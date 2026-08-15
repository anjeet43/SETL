import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
export default async function ProductsPage() { const supabase = await createClient(); const { data } = await supabase.from("products").select("*").eq("status", "active").order("created_at", { ascending: false }); const products = (data ?? []) as Product[]; return <><Header/><main className="mx-auto max-w-6xl px-5 py-14"><p className="text-xs font-bold uppercase tracking-[.18em] text-moss">Set up your space</p><h1 className="display mt-2 text-6xl">Everything, considered.</h1><div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">{products.map(p => <ProductCard product={p} key={p.id}/>)}</div>{!products.length && <p className="mt-8 text-sm text-black/60">No products are published yet.</p>}</main></>; }
