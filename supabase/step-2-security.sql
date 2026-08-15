-- Run after repair-finalize-paid-order.sql. Safe to run only once.
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.bundles enable row level security;
alter table public.bundle_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "published products visible" on public.products for select using (status='active' or public.is_admin());
create policy "admin manages products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "live bundles visible" on public.bundles for select using (status='active' or public.is_admin());
create policy "admin manages bundles" on public.bundles for all using (public.is_admin()) with check (public.is_admin());
create policy "users see own orders" on public.orders for select using (user_id=auth.uid() or public.is_admin());
create policy "admins manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
