-- Run this in a NEW Supabase SQL Editor tab to fix the failed function.
-- It is safe to run more than once.
create or replace function public.finalize_paid_order(p_order_id uuid, p_payment_id text)
returns void language plpgsql security definer set search_path = public as $$
declare
  line record;
  available_stock integer;
begin
  perform 1 from orders where id = p_order_id and payment_status = 'created' for update;
  if not found then return; end if;

  for line in select product_id, quantity from order_items where order_id = p_order_id and product_id is not null loop
    select stock_quantity into available_stock from products where id = line.product_id for update;
    if available_stock is null or available_stock < line.quantity then
      update orders set payment_status = 'cancelled', fulfillment_status = 'cancelled' where id = p_order_id;
      return;
    end if;
  end loop;

  update orders set payment_status = 'paid', razorpay_payment_id = p_payment_id where id = p_order_id;
  for line in select product_id, quantity from order_items where order_id = p_order_id and product_id is not null loop
    update products set stock_quantity = stock_quantity - line.quantity, updated_at = now() where id = line.product_id;
    insert into inventory_events(product_id, order_id, delta, reason) values (line.product_id, p_order_id, -line.quantity, 'paid order');
  end loop;
end;
$$;
