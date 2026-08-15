import Link from "next/link";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/header";

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  const orderCookies = allCookies.filter((cookie) =>
    cookie.name.startsWith("setl_order_")
  );

  const db = createAdminClient();

  const orders = [];

  for (const cookie of orderCookies) {
    const orderId = cookie.name.replace("setl_order_", "");

    const { data } = await db
      .from("orders")
      .select(
        "id,total,payment_status,fulfillment_status,created_at,customer_name"
      )
      .eq("id", orderId)
      .eq("order_access_token", cookie.value)
      .single();

    if (data) {
      orders.push(data);
    }
  }

  orders.sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
  );

  return (
    <>
      <Header />

      <main className="mx-auto max-w-4xl px-5 py-14">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
          Account
        </p>

        <h1 className="display mt-2 text-6xl">Your orders</h1>

        {!orders.length ? (
          <div className="mt-10 border border-black bg-white p-8">
            <h2 className="display text-3xl">No orders yet.</h2>

            <p className="mt-3 text-sm text-black/60">
              Your Setl orders will appear here after you place one.
            </p>

            <Link
              href="/products"
              className="mt-6 inline-block bg-ink px-5 py-3 text-sm font-bold text-white"
            >
              Shop essentials
            </Link>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block border border-black bg-white p-5 transition hover:-translate-y-0.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-black/45">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>

                    <p className="mt-2 text-lg font-bold">
                      ₹{order.total.toLocaleString("en-IN")}
                    </p>

                    <p className="mt-1 text-xs text-black/50">
                      {new Date(order.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-moss">
                      {order.payment_status}
                    </p>

                    <p className="mt-1 text-sm font-bold">
                      {order.fulfillment_status
                        .replaceAll("_", " ")}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}