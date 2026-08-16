import Link from "next/link";
import { cookies } from "next/headers";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { CartActions } from "@/components/cart-actions";

export default async function Cart() {
  let cart: Record<string, number> = {};

  try {
    cart = JSON.parse(
      decodeURIComponent(
        (await cookies()).get("setl_cart")?.value || "{}"
      )
    );
  } catch {}

  const ids = Object.keys(cart);

  const supabase = await createClient();

  const { data } = ids.length
    ? await supabase
        .from("products")
        .select("*")
        .in("id", ids)
        .eq("status", "active")
    : { data: [] };

  const items = ((data ?? []) as Product[]).sort(
    (a, b) => ids.indexOf(b.id) - ids.indexOf(a.id)
  );

  const total = items.reduce(
    (sum, p) => sum + p.price * cart[p.id],
    0
  );

  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
          Your setup
        </p>

        <h1 className="display mt-2 text-6xl">
          Almost there.
        </h1>

        {items.length ? (
          <>
            <section className="mt-10 border-y border-black">
              {items.map((p) => (
                <div
                  className="flex items-center justify-between gap-5 border-b border-black/10 py-4"
                  key={p.id}
                >
                  <div className="min-w-0">
                    <b>{p.name}</b>

                    <CartActions
                      productId={p.id}
                      productName={p.name}
                      quantity={cart[p.id]}
                      stockQuantity={p.stock_quantity}
                    />
                  </div>

                  <b className="shrink-0">
                    ₹
                    {(p.price * cart[p.id]).toLocaleString(
                      "en-IN"
                    )}
                  </b>
                </div>
              ))}
            </section>

            <div className="mt-6 flex items-center justify-between text-xl">
              <b>Total</b>
              <b>₹{total.toLocaleString("en-IN")}</b>
            </div>

            <Link
              href="/checkout"
              className="mt-6 block bg-ink px-5 py-4 text-center text-sm font-bold text-white transition-transform duration-150 hover:-translate-y-0.5"
            >
              Continue to delivery
            </Link>
          </>
        ) : (
          <div className="mt-8 border border-dashed border-black/20 p-8">
            <p className="text-sm text-black/60">
              Your setup is still empty.
            </p>

            <Link
              href="/products"
              className="mt-4 inline-block text-sm font-bold underline"
            >
              Find essentials
            </Link>
          </div>
        )}
      </main>
    </>
  );
}