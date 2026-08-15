-- =========================================================
-- SETL INVENTORY RESERVATION SYSTEM
-- =========================================================

create table if not exists public.inventory_reservations (
  order_id uuid not null
    references public.orders on delete cascade,

  product_id uuid not null
    references public.products on delete restrict,

  quantity integer not null
    check (quantity > 0),

  status text not null default 'active'
    check (status in ('active', 'committed', 'released')),

  expires_at timestamptz not null,

  created_at timestamptz not null default now(),

  released_at timestamptz,

  committed_at timestamptz,

  primary key (order_id, product_id)
);

create index if not exists inventory_reservations_product_idx
on public.inventory_reservations (
  product_id,
  status,
  expires_at
);

create index if not exists inventory_reservations_expiry_idx
on public.inventory_reservations (
  status,
  expires_at
);

alter table public.inventory_reservations enable row level security;


-- =========================================================
-- ADMIN READ POLICY
-- =========================================================

drop policy if exists "admins read inventory reservations"
on public.inventory_reservations;

create policy "admins read inventory reservations"
on public.inventory_reservations
for select
using (public.is_admin());


-- =========================================================
-- RELEASE EXPIRED RESERVATIONS
-- =========================================================

create or replace function public.release_expired_inventory_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released_count integer := 0;
  reservation record;
begin

  for reservation in
    select
      order_id,
      product_id,
      quantity
    from public.inventory_reservations
    where status = 'active'
      and expires_at <= now()
    for update skip locked

  loop

    -- Put the reserved stock back.
    update public.products
    set
      stock_quantity = stock_quantity + reservation.quantity,
      updated_at = now()
    where id = reservation.product_id;

    -- Record the stock release.
    insert into public.inventory_events (
      product_id,
      order_id,
      delta,
      reason
    )
    values (
      reservation.product_id,
      reservation.order_id,
      reservation.quantity,
      'checkout reservation expired'
    );

    -- Mark reservation released.
    update public.inventory_reservations
    set
      status = 'released',
      released_at = now()
    where order_id = reservation.order_id
      and product_id = reservation.product_id
      and status = 'active';

    -- If payment never completed, mark the pending order failed.
    update public.orders
    set payment_status = 'failed'
    where id = reservation.order_id
      and payment_status = 'created';

    released_count := released_count + 1;

  end loop;

  return released_count;
end;
$$;


-- =========================================================
-- CREATE ORDER + RESERVE STOCK ATOMICALLY
-- =========================================================

create or replace function public.create_order_with_stock_reservation(
  p_razorpay_order_id text,
  p_receipt text,
  p_order_access_token text,
  p_customer_name text,
  p_customer_phone text,
  p_hostel text,
  p_room text,
  p_delivery_note text,
  p_expected_total integer,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  line record;
  product record;

  computed_total integer := 0;
  new_order_id uuid;

  -- Razorpay checkout timeout is 15 minutes.
  -- We keep the server-side reservation for the same period.
  reservation_expiry timestamptz :=
    now() + interval '15 minutes';
begin

  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
  then
    raise exception 'EMPTY_CART';
  end if;


  -- Release old abandoned reservations first.
  perform public.release_expired_inventory_reservations();


  -- =======================================================
  -- LOCK EVERY PRODUCT AND VALIDATE STOCK
  -- =======================================================

  for line in
    select *
    from jsonb_to_recordset(p_items)
      as x(
        product_id uuid,
        quantity integer
      )
    order by product_id

  loop

    if line.quantity is null
       or line.quantity < 1
    then
      raise exception 'INVALID_QUANTITY';
    end if;


    -- IMPORTANT:
    -- FOR UPDATE locks this product row.
    --
    -- If two customers try to buy the last item,
    -- only one transaction can pass this point at a time.

    select
      id,
      name,
      price,
      stock_quantity
    into product
    from public.products
    where id = line.product_id
      and status = 'active'
    for update;


    if not found then
      raise exception 'PRODUCT_UNAVAILABLE';
    end if;


    if product.stock_quantity < line.quantity then
      raise exception
        'INSUFFICIENT_STOCK:%',
        product.name;
    end if;


    computed_total :=
      computed_total +
      (product.price * line.quantity);

  end loop;


  -- =======================================================
  -- PRICE PROTECTION
  -- =======================================================

  if computed_total <> p_expected_total then
    raise exception 'TOTAL_CHANGED';
  end if;


  -- =======================================================
  -- CREATE INTERNAL SETL ORDER
  -- =======================================================

  insert into public.orders (
    razorpay_order_id,
    receipt,
    order_access_token,
    customer_name,
    customer_phone,
    hostel,
    room,
    delivery_note,
    subtotal,
    total,
    payment_status,
    fulfillment_status
  )
  values (
    p_razorpay_order_id,
    p_receipt,
    p_order_access_token,
    p_customer_name,
    p_customer_phone,
    p_hostel,
    p_room,
    p_delivery_note,
    computed_total,
    computed_total,
    'created',
    'confirmed'
  )
  returning id into new_order_id;


  -- =======================================================
  -- CREATE ORDER ITEMS + RESERVE STOCK
  -- =======================================================

  for line in
    select *
    from jsonb_to_recordset(p_items)
      as x(
        product_id uuid,
        quantity integer
      )

  loop

    select
      id,
      name,
      price
    into product
    from public.products
    where id = line.product_id
    for update;


    -- Save a snapshot of the product information.
    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      unit_price,
      quantity
    )
    values (
      new_order_id,
      product.id,
      product.name,
      product.price,
      line.quantity
    );


    -- RESERVE THE STOCK.
    --
    -- We actually decrease stock now.
    -- Therefore every other customer immediately sees
    -- the reduced available quantity.

    update public.products
    set
      stock_quantity =
        stock_quantity - line.quantity,
      updated_at = now()
    where id = product.id;


    -- Record reservation.
    insert into public.inventory_events (
      product_id,
      order_id,
      delta,
      reason
    )
    values (
      product.id,
      new_order_id,
      -line.quantity,
      'checkout reservation'
    );


    insert into public.inventory_reservations (
      order_id,
      product_id,
      quantity,
      status,
      expires_at
    )
    values (
      new_order_id,
      product.id,
      line.quantity,
      'active',
      reservation_expiry
    );

  end loop;


  return new_order_id;

end;
$$;


-- =========================================================
-- COMMIT RESERVATION AFTER PAYMENT
-- =========================================================

create or replace function public.commit_inventory_reservation(
  p_order_id uuid,
  p_payment_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reservation_count integer;
begin

  -- Lock the order.
  perform 1
  from public.orders
  where id = p_order_id
    and payment_status = 'created'
  for update;


  if not found then
    return;
  end if;


  select count(*)
  into reservation_count
  from public.inventory_reservations
  where order_id = p_order_id
    and status = 'active';


  if reservation_count = 0 then
    raise exception 'RESERVATION_MISSING';
  end if;


  -- Stock was already deducted at checkout.
  --
  -- Therefore DO NOT deduct stock again here.

  update public.inventory_reservations
  set
    status = 'committed',
    committed_at = now()
  where order_id = p_order_id
    and status = 'active';


  update public.orders
  set
    payment_status = 'paid',
    razorpay_payment_id = p_payment_id
  where id = p_order_id;

end;
$$;


-- =========================================================
-- RELEASE A SPECIFIC RESERVATION
-- =========================================================

create or replace function public.release_order_inventory_reservation(
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reservation record;
begin

  perform 1
  from public.orders
  where id = p_order_id
    and payment_status = 'created'
  for update;


  if not found then
    return;
  end if;


  for reservation in
    select
      product_id,
      quantity
    from public.inventory_reservations
    where order_id = p_order_id
      and status = 'active'
    for update

  loop

    update public.products
    set
      stock_quantity =
        stock_quantity + reservation.quantity,
      updated_at = now()
    where id = reservation.product_id;


    insert into public.inventory_events (
      product_id,
      order_id,
      delta,
      reason
    )
    values (
      reservation.product_id,
      p_order_id,
      reservation.quantity,
      'checkout reservation released'
    );

  end loop;


  update public.inventory_reservations
  set
    status = 'released',
    released_at = now()
  where order_id = p_order_id
    and status = 'active';


  update public.orders
  set payment_status = 'failed'
  where id = p_order_id
    and payment_status = 'created';

end;
$$;


-- =========================================================
-- SECURITY
-- =========================================================

revoke all
on function public.release_expired_inventory_reservations()
from public, anon, authenticated;

revoke all
on function public.create_order_with_stock_reservation(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  jsonb
)
from public, anon, authenticated;

revoke all
on function public.commit_inventory_reservation(
  uuid,
  text
)
from public, anon, authenticated;

revoke all
on function public.release_order_inventory_reservation(
  uuid
)
from public, anon, authenticated;


grant execute
on function public.release_expired_inventory_reservations()
to service_role;

grant execute
on function public.create_order_with_stock_reservation(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  jsonb
)
to service_role;

grant execute
on function public.commit_inventory_reservation(
  uuid,
  text
)
to service_role;

grant execute
on function public.release_order_inventory_reservation(
  uuid
)
to service_role;