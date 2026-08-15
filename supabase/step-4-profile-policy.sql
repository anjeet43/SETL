-- Run once in Supabase SQL Editor.
-- Lets each signed-in user read their own profile so Setl can verify the admin role.
create policy "users read own profile" on public.profiles
for select to authenticated
using (id = auth.uid());
