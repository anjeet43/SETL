import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Logo } from "@/components/logo";

export default async function AdminOrdersPage() {
  const { supabase } = await requireAdmin();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id,customer_name,customer_phone,hostel,room,total,payment_status,fulfillment_status,created_at"
    )
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-[#eeece4] px-4 py-5 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <Logo />

          <div className="flex gap-4 text-sm font-bold">
            <Link href="/admin" className="underline">
              Store
            </Link>

            <Link href="/admin/orders">
              Orders
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
            Store operations
          </p>

          <h1 className="display mt-2 text-6xl">
            Orders
          </h1>

          <p className="mt-3 text-sm text-black/60">
            Manage incoming orders and delivery status.
          </p>
        </div>

        <section className="mt-10 overflow-hidden border border-black bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="border-b border-black/10 text-xs uppercase tracking-wider text-black/45">
                <tr>
                  <th className="p-4">Order</th>
                  <th>Customer</th>
                  <th>Delivery</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {(orders ?? []).map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-black/10 last:border-0"
                  >
                    <td className="p-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-bold underline"
                      >
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>

                      <p className="mt-1 text-xs text-black/45">
                        {new Date(
                          order.created_at
                        ).toLocaleString("en-IN")}
                      </p>
                    </td>

                    <td>
                      <p className="font-bold">
                        {order.customer_name}
                      </p>
                      <p className="text-xs text-black/45">
                        {order.customer_phone}
                      </p>
                    </td>

                    <td>
                      <p className="font-bold">
                        {order.hostel}
                      </p>
                      <p className="text-xs text-black/45">
                        Room {order.room}
                      </p>
                    </td>

                    <td className="font-bold">
                      ₹{order.total.toLocaleString("en-IN")}
                    </td>

                    <td>
                      <span
                        className={
                          order.payment_status === "paid"
                            ? "font-bold text-moss"
                            : "text-red-700"
                        }
                      >
                        {order.payment_status}
                      </span>
                    </td>

                    <td>
                      <span className="capitalize">
                        {order.fulfillment_status.replaceAll(
                          "_",
                          " "
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!orders?.length && (
            <p className="p-10 text-center text-sm text-black/50">
              No orders yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}