import Link from "next/link";
import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { RoomBuilder } from "@/components/room-builder";
import { SetupGuide } from "@/components/setup-guide";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";

async function getProducts() { try { const supabase = await createClient(); const { data } = await supabase.from("products").select("*").eq("status", "active").order("created_at", { ascending: false }); return (data ?? []) as Product[]; } catch { return [] as Product[]; } }
export default async function Home() { const products = await getProducts(); const featured = products.slice(0, 8); return <><Header /><main><section className="relative overflow-hidden px-5 pb-16 pt-14 md:pb-24 md:pt-24"><div className="grain absolute inset-0 opacity-30"/><div className="relative mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_.78fr] md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-moss">For IIIT Manipur freshers</p><h1 className="display mt-3 max-w-2xl text-6xl leading-[.87] md:text-8xl">Your room, ready before you are.</h1><p className="mt-7 max-w-lg text-base leading-7 text-black/65">A more considered way to get hostel essentials. Built around the things you’ll actually set up in your first week.</p><div className="mt-8 flex flex-wrap gap-3">
    
    <Link
  href="#room"
  className="bg-ink px-5 py-3 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
>
  Build my room 
</Link>
    
    <Link href="#essentials" className="border border-black px-5 py-3 text-sm font-bold">Explore essentials</Link></div></div><aside className="border border-black bg-lemon p-6 md:p-8"><p className="text-xs font-bold uppercase tracking-[.15em]">A two-minute start</p><h2 className="display mt-12 text-4xl leading-none">Welcome to IIITM </h2><p className="mt-3 text-sm leading-6">What are you setting up?</p>

<SetupGuide /></aside></div></section><RoomBuilder products={products}/><section id="essentials" className="mx-auto max-w-6xl px-5 py-16"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-moss">Curated by your store manager</p><h2 className="display mt-2 text-5xl">Freshers’ essentials</h2></div><Link className="text-sm font-bold underline" href="/products">See all</Link></div>{featured.length ? <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">{featured.map(product => <ProductCard key={product.id} product={product}/>)}</div> : <div className="mt-8 border border-dashed border-black/25 bg-white p-10"><h3 className="display text-3xl">The shelves are being set up.</h3><p className="mt-2 max-w-md text-sm leading-6 text-black/60">Products will appear here as soon as the store manager publishes them. There’s no fake catalog behind the scenes.</p></div>}</section></main>

<footer className="border-t border-black/10 px-5 py-8 text-xs font-medium text-black/55">
  <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <span>setl — for campus life</span>

    <div className="flex flex-wrap gap-x-5 gap-y-2">
      <Link href="/terms">Terms</Link>
      <Link href="/privacy">Privacy</Link>
      <Link href="/shipping">Shipping</Link>
      <Link href="/refunds">
        Cancellation & Refunds
      </Link>
      <Link href="/contact">Contact</Link>

      <Link href="/admin">
        Store manager
      </Link>
    </div>
  </div>
</footer>
</>; }
