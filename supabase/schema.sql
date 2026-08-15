-- Setl production schema. Run once in Supabase SQL Editor.
create extension if not exists pgcrypto;
create type public.app_role as enum ('customer','store_admin','super_admin');
create type public.product_status as enum ('draft','active','archived');
create type public.payment_status as enum ('created','paid','failed','refunded','cancelled');
create type public.fulfillment_status as enum ('confirmed','packing','ready','out_for_delivery','delivered','cancelled');
create table public.profiles (id uuid primary key references auth.users on delete cascade, role app_role not null default 'customer', full_name text, phone text, created_at timestamptz not null default now());
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', '')) on conflict (id) do nothing; return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create table public.products (id uuid primary key default gen_random_uuid(), name text not null check (char_length(name) between 2 and 160), slug text unique not null, description text, category_slug text not null check (category_slug in ('sleep','study','power','care','carry','organize')), price integer not null check (price >= 0), compare_at_price integer check (compare_at_price is null or compare_at_price >= price), stock_quantity integer not null default 0 check (stock_quantity >= 0), sku text unique, status product_status not null default 'draft', tags text[] not null default '{}', badge text, image_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.bundles (id uuid primary key default gen_random_uuid(), name text not null, slug text unique not null, description text, image_url text, price integer not null check (price >= 0), compare_at_price integer, status product_status not null default 'draft', created_at timestamptz not null default now());
create table public.bundle_items (bundle_id uuid references public.bundles on delete cascade, product_id uuid references public.products on delete restrict, quantity integer not null default 1 check (quantity > 0), primary key(bundle_id, product_id));
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  order_access_token text unique,
  razorpay_order_id text unique not null,
  razorpay_payment_id text unique,
  receipt text unique not null,
  customer_name text not null,
  customer_phone text not null,
  hostel text not null,
  room text not null,
  delivery_note text,
  subtotal integer not null,
  discount integer not null default 0,
  total integer not null,
  payment_status payment_status not null default 'created',
  fulfillment_status fulfillment_status not null default 'confirmed',
  created_at timestamptz not null default now()
);
create table public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders on delete cascade, product_id uuid references public.products on delete set null, product_name text not null, unit_price integer not null, quantity integer not null check(quantity > 0));
create table public.inventory_events (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products, order_id uuid references public.orders, delta integer not null, reason text not null, created_at timestamptz not null default now());
create table public.webhook_events (id uuid primary key default gen_random_uuid(), provider text not null, event_id text not null, payload jsonb not null, created_at timestamptz not null default now(), unique(provider,event_id));
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from profiles where id = auth.uid() and role in ('store_admin','super_admin')) $$;
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
alter table public.profiles enable row level security; alter table public.products enable row level security; alter table public.bundles enable row level security; alter table public.bundle_items enable row level security; alter table public.orders enable row level security; alter table public.order_items enable row level security;
create policy "published products visible" on public.products for select using (status='active' or public.is_admin()); create policy "admin manages products" on public.products for all using (public.is_admin()) with check (public.is_admin()); create policy "live bundles visible" on public.bundles for select using (status='active' or public.is_admin()); create policy "admin manages bundles" on public.bundles for all using (public.is_admin()) with check (public.is_admin()); create policy "users see own orders" on public.orders for select using (user_id=auth.uid() or public.is_admin()); create policy "admins manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid());
-- Create the product-images Storage bucket in the dashboard. Restrict uploads to is_admin().
