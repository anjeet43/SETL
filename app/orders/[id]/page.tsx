import Link from "next/link";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { Header } from "@/components/header";

const statusSteps = [
    { key: "confirmed", label: "Confirmed" },
    { key: "packing", label: "Packing" },
    { key: "ready", label: "Ready" },
    { key: "out_for_delivery", label: "Out for delivery" },
    { key: "delivered", label: "Delivered" },
];

function formatStatus(status: string) {
    return status.replaceAll("_", " ");
}

export default async function OrderPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const cookieStore = await cookies();
    const token = cookieStore.get(`setl_order_${id}`)?.value;

    if (!token) {
        return (
            <>
                <Header />

                <main className="mx-auto max-w-2xl px-5 py-20">
                    <h1 className="display text-5xl">
                        Order not available
                    </h1>

                    <p className="mt-4 text-black/60">
                        This order can only be viewed from the device
                        where it was placed.
                    </p>

                    <Link
                        href="/orders"
                        className="mt-8 inline-block bg-ink px-5 py-3 text-sm font-bold text-white"
                    >
                        Back to orders
                    </Link>
                </main>
            </>
        );
    }

    const db = createAdminClient();

    const { data: order, error } = await db
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
        .eq("order_access_token", token)
        .single();

    if (error || !order) {
        return (
            <>
                <Header />

                <main className="mx-auto max-w-2xl px-5 py-20">
                    <h1 className="display text-5xl">
                        Order not found
                    </h1>

                    <p className="mt-4 text-black/60">
                        We couldn't find this order.
                    </p>

                    <Link
                        href="/orders"
                        className="mt-8 inline-block bg-ink px-5 py-3 text-sm font-bold text-white"
                    >
                        Back to orders
                    </Link>
                </main>
            </>
        );
    }

    const isCancelled =
        order.fulfillment_status === "cancelled";

    const currentIndex = statusSteps.findIndex(
        (step) => step.key === order.fulfillment_status
    );

    return (
        <>
            <Header />

            <main className="mx-auto max-w-3xl px-5 py-14">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
                    Your order
                </p>

                <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="display text-5xl">
                            {isCancelled
                                ? "Order cancelled."
                                : "Order confirmed."}
                        </h1>

                        <p className="mt-2 text-sm text-black/55">
                            Order #
                            {order.id
                                .slice(0, 8)
                                .toUpperCase()}
                        </p>
                    </div>

                    <div className="border border-black bg-white px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-wider text-black/45">
                            Total
                        </p>

                        <p className="mt-1 text-xl font-bold">
                            ₹
                            {order.total.toLocaleString(
                                "en-IN"
                            )}
                        </p>
                    </div>
                </div>

                {/* CANCELLED STATE */}
                {isCancelled ? (
                    <section className="mt-10 border border-red-700 bg-white p-6">
                        <div className="flex items-start gap-4">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-700 text-lg font-bold text-white">
                                ×
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-[.18em] text-red-700">
                                    Cancelled
                                </p>

                                <h2 className="display mt-2 text-3xl">
                                    This order has been cancelled.
                                </h2>

                                <p className="mt-3 text-sm leading-6 text-black/60">
                                    Your order will not be delivered.
                                    If you believe this cancellation
                                    was made by mistake, please contact
                                    Setl support.
                                </p>
                            </div>
                        </div>
                    </section>
                ) : (
                    /* NORMAL DELIVERY TIMELINE */
                    <section className="mt-10 border border-black bg-white p-6">
                        <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
                            Delivery
                        </p>

                        <div className="mt-8 space-y-6">
                            {statusSteps.map((step, index) => {
                                const completed =
                                    index <= currentIndex;

                                const active =
                                    index === currentIndex;

                                return (
                                    <div
                                        key={step.key}
                                        className="flex items-start gap-4"
                                    >
                                        <div
                                            className={`mt-1 grid h-7 w-7 place-items-center rounded-full border text-xs font-bold ${
                                                completed
                                                    ? "border-moss bg-moss text-white"
                                                    : "border-black/20 text-black/30"
                                            }`}
                                        >
                                            {completed
                                                ? "✓"
                                                : index + 1}
                                        </div>

                                        <div>
                                            <p
                                                className={`text-sm font-bold ${
                                                    active
                                                        ? "text-moss"
                                                        : ""
                                                }`}
                                            >
                                                {step.label}
                                            </p>

                                            {active && (
                                                <p className="mt-1 text-xs text-black/50">
                                                    This is the current
                                                    status of your order.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ITEMS */}
                <section className="mt-5 border border-black bg-white p-6">
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
                                    className="flex items-center justify-between gap-4 py-4"
                                >
                                    <div>
                                        <p className="font-bold">
                                            {item.product_name}
                                        </p>

                                        <p className="mt-1 text-xs text-black/50">
                                            ₹
                                            {item.unit_price.toLocaleString(
                                                "en-IN"
                                            )}{" "}
                                            × {item.quantity}
                                        </p>
                                    </div>

                                    <p className="font-bold">
                                        ₹
                                        {(
                                            item.unit_price *
                                            item.quantity
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                </section>

                {/* PAYMENT */}
                <section className="mt-5 border border-black bg-white p-6">
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
                        Payment
                    </p>

                    <div className="mt-4">
                        <p className="text-sm">
                            Payment status
                        </p>

                        <p
                            className={`mt-1 font-bold capitalize ${
                                order.payment_status === "paid"
                                    ? "text-moss"
                                    : "text-black"
                            }`}
                        >
                            {formatStatus(
                                order.payment_status
                            )}
                        </p>
                    </div>
                </section>

                {/* DELIVERY DETAILS */}
                <section className="mt-5 border border-black bg-white p-6">
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
                        Delivery details
                    </p>

                    <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                            <p className="text-xs text-black/45">
                                Name
                            </p>

                            <p className="mt-1 font-bold">
                                {order.customer_name}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-black/45">
                                Phone
                            </p>

                            <p className="mt-1 font-bold">
                                {order.customer_phone}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-black/45">
                                Hostel
                            </p>

                            <p className="mt-1 font-bold">
                                {order.hostel}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs text-black/45">
                                Room
                            </p>

                            <p className="mt-1 font-bold">
                                {order.room}
                            </p>
                        </div>
                    </div>

                    {order.delivery_note && (
                        <div className="mt-5 border-t border-black/10 pt-5">
                            <p className="text-xs text-black/45">
                                Delivery note
                            </p>

                            <p className="mt-1 text-sm">
                                {order.delivery_note}
                            </p>
                        </div>
                    )}
                </section>

                <Link
                    href="/orders"
                    className="mt-6 inline-block border border-black bg-white px-5 py-3 text-sm font-bold"
                >
                    ← All orders
                </Link>
            </main>
        </>
    );
}