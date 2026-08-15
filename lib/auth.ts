import { createClient } from "@/lib/supabase/server";
export async function requireAdmin() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["store_admin", "super_admin"].includes(profile.role)) throw new Error("Forbidden");
  return { supabase, user };
}
