"use client";

import { useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  customerName: string;
  hostel: string;
  room: string;
  total: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
};

function getStatus(
  fulfillmentStatus: string,
  paymentStatus: string
) {
  // Payment has not been completed yet.
  // This takes priority over fulfillment status because
  // the database creates the order before Razorpay payment.
  if (paymentStatus !== "paid") {
    if (paymentStatus === "failed") {
      return {
        title: "Payment failed",
        description:
          "Your payment was not completed. Please try placing the order again.",
      };
    }

    if (paymentStatus === "cancelled") {
      return {
        title: "Payment cancelled",
        description:
          "The payment was cancelled and the order was not completed.",
      };
    }

    return {
      title: "Payment pending",
      description:
        "Your order is waiting for payment confirmation.",
    };
  }

  // Payment is confirmed — now show the delivery status.
  switch (fulfillmentStatus) {
    case "confirmed":
      return {
        title: "Order confirmed",
        description:
          "We've received your order and will prepare it soon.",
      };

    case "packing":
    case "preparing":
      return {
        title: "Being prepared",
        description:
          "Your order is being packed for delivery.",
      };

    case "ready":
      return {
        title: "Ready for delivery",
        description:
          "Your order is packed and ready to go.",
      };

    case "out_for_delivery":
      return {
        title: "Out for delivery",
        description:
          "Your order is on its way.",
      };

    case "delivered":
      return {
        title: "Delivered",
        description:
          "Your order has been delivered.",
      };

    case "cancelled":
      return {
        title: "Order cancelled",
        description:
          "This order has been cancelled.",
      };

    default:
      return {
        title: "Order confirmed",
        description:
          "Your payment has been confirmed and your order is being processed.",
      };
  }
}

export function TrackOrderForm() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not find your order."
        );
      }

      setOrder(data.order);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not check your order."
      );
    } finally {
      setLoading(false);
    }
  }

  if (order) {
    const status = getStatus(
  order.fulfillmentStatus,
  order.paymentStatus
);

    return (
      <div className="mt-10 border border-black bg-white p-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-moss">
              Order found
            </p>

            <h2 className="display mt-2 text-3xl">
              {status.title}
            </h2>
          </div>

          <span className="border border-black bg-lemon px-3 py-2 text-xs font-bold">
            #{order.id.slice(0, 8)}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-black/60">
          {status.description}
        </p>

        <div className="mt-6 border-t border-black/10 pt-5">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-black/45">Customer</p>
              <p className="mt-1 font-bold">{order.customerName}</p>
            </div>

            <div>
              <p className="text-xs text-black/45">Total</p>
              <p className="mt-1 font-bold">
                ₹{order.total.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <p className="text-xs text-black/45">Hostel</p>
              <p className="mt-1 font-bold">{order.hostel}</p>
            </div>

            <div>
              <p className="text-xs text-black/45">Room</p>
              <p className="mt-1 font-bold">{order.room}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 border border-moss bg-[#f4f7f2] p-4">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-moss">
            Payment
          </p>

         <p className="mt-1 text-sm font-bold">
  {order.paymentStatus === "paid"
    ? "Payment confirmed"
    : order.paymentStatus === "failed"
      ? "Payment failed"
      : order.paymentStatus === "cancelled"
        ? "Payment cancelled"
        : "Payment pending"}
</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => setOrder(null)}
            className="border border-black px-4 py-3 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5"
          >
            Track another order
          </button>

          <Link
            href="/"
            className="bg-ink px-4 py-3 text-xs font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
          >
            Back to Setl
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-10 grid gap-4 border border-black bg-white p-5"
    >
      <label className="text-xs font-bold">
        Order ID

        <input
          required
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          placeholder="Paste your order ID"
          className="mt-1 w-full border border-black/20 p-3 text-sm outline-none focus:border-black"
        />
      </label>

      <label className="text-xs font-bold">
        Phone number

        <input
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          inputMode="tel"
          placeholder="Phone used during checkout"
          className="mt-1 w-full border border-black/20 p-3 text-sm outline-none focus:border-black"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="bg-ink p-4 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
      >
        {loading ? "Checking order…" : "Check my order →"}
      </button>

      {error && (
        <p className="text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="text-xs leading-5 text-black/45">
        Use the same phone number you entered during checkout.
      </p>
    </form>
  );
}