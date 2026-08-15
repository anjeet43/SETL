import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { Logo } from "@/components/logo";

const statuses = [
  "confirmed",
  "packing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

async function updateOrderStatus(formData: FormData) {
  "use server";

  const { supabase } = await requireAdmin();

  const orderId = String(formData.get("orderId"));
  const status = String(formData.get("status"));

  if (!statuses.includes(status as (typeof statuses)[number])) {
    throw new Error("Invalid order status.");
  }

  const { error } = await supabase
    .from("orders")
    .update({
      fulfillment_status: status,
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
}

export default async function AdminOrderDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { supabase } = await requireAdmin();

  const { data: order } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        product_name,
        unit_price,
        quantity
      )
    `)
    .eq("id", id)
    .single();

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#eeece4] px-4 py-5 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Logo />

          <Link
            href="/admin/orders"
            className="text-sm font-bold underline"
          >
            ← All orders
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
              Order
            </p>

            <h1 className="display mt-2 text-5xl">
              #{order.id.slice(0, 8).toUpperCase()}
            </h1>

            <p className="mt-2 text-sm text-black/50">
              {new Date(order.created_at).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="border border-black bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-wider text-black/45">
              Total
            </p>

            <p className="mt-1 text-2xl font-bold">
              ₹{order.total.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
          <section className="border border-black bg-white p-6">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
              Items
            </p>

            <div className="mt-5 divide-y divide-black/10">
              {order.order_items.map(
                (item: {
                  id: string;
                  product_name: string;
                  unit_price: number;
                  quantity: number;
                }) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-4 py-4"
                  >
                    <div>
                      <p className="font-bold">
                        {item.product_name}
                      </p>

                      <p className="mt-1 text-xs text-black/45">
                        ₹{item.unit_price.toLocaleString("en-IN")} ×{" "}
                        {item.quantity}
                      </p>
                    </div>

                    <p className="font-bold">
                      ₹
                      {(
                        item.unit_price * item.quantity
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                )
              )}
            </div>
          </section>

          <div className="grid gap-5">
            <section className="border border-black bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
                Payment
              </p>

              <p className="mt-4 text-lg font-bold capitalize">
                {order.payment_status}
              </p>

              <p className="mt-2 break-all text-xs text-black/45">
                Razorpay order: {order.razorpay_order_id}
              </p>

              {order.razorpay_payment_id && (
                <p className="mt-2 break-all text-xs text-black/45">
                  Payment ID: {order.razorpay_payment_id}
                </p>
              )}
            </section>

            <section className="border border-black bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
                Customer
              </p>

              <p className="mt-4 font-bold">
                {order.customer_name}
              </p>

              <p className="mt-1 text-sm">
                {order.customer_phone}
              </p>

              <p className="mt-4 text-sm">
                {order.hostel} · Room {order.room}
              </p>

              {order.delivery_note && (
                <p className="mt-4 border-t border-black/10 pt-4 text-sm text-black/60">
                  {order.delivery_note}
                </p>
              )}
            </section>
          </div>
        </div>

        <section className="mt-5 border border-black bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
            Fulfillment
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {statuses.map((status) => (
              <form action={updateOrderStatus} key={status}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="status" value={status} />

                <button
                  className={`border px-4 py-3 text-sm font-bold capitalize transition ${
                    order.fulfillment_status === status
                      ? "border-ink bg-ink text-white"
                      : "border-black bg-white hover:bg-black hover:text-white"
                  }`}
                >
                  {status.replaceAll("_", " ")}
                </button>
              </form>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}