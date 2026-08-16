"use client";

import { useState } from "react";
import Link from "next/link";



declare global {
    interface Window {
        Razorpay?: new (options: Record<string, unknown>) => {
            open: () => void;
        };
    }
}

function loadRazorpay(): Promise<boolean> {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);

        document.body.appendChild(script);
    });
}

export function CheckoutForm() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [complete, setComplete] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setLoading(true);
        setError("");

        try {
            const form = new FormData(event.currentTarget);

            const response = await fetch("/api/checkout", {
                method: "POST",
                body: form,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Could not start checkout.");
            }

            const razorpayLoaded = await loadRazorpay();

            if (!razorpayLoaded || !window.Razorpay) {
                throw new Error(
                    "Secure payment window could not load. Please check your connection."
                );
            }

            const payment = new window.Razorpay({
                key: data.key,
                amount: data.amount,
                currency: data.currency,
                name: "Setl",
                description: "Your campus setup",
                order_id: data.razorpayOrderId,

                theme: {
                    color: "#184f42",
                },

                handler: async (paymentResponse: {
                    razorpay_payment_id: string;
                    razorpay_order_id: string;
                    razorpay_signature: string;
                }) => {
                    try {
                        const verifyResponse = await fetch("/api/payments/verify", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                ...paymentResponse,
                                orderId: data.orderId,
                            }),
                        });

                        const verification = await verifyResponse.json();

                        if (!verifyResponse.ok) {
                            throw new Error(
                                verification.error || "Payment verification failed."
                            );
                        }

                        setOrderId(data.orderId);
                        setComplete(true);
                    } catch (verificationError) {
                        console.error(
                            "Payment verification failed:",
                            verificationError
                        );

                        setError(
                            verificationError instanceof Error
                                ? verificationError.message
                                : "Payment verification failed."
                        );
                    } finally {
                        setLoading(false);
                    }
                },

                modal: {
                    ondismiss: () => {
                        setLoading(false);
                    },
                },
            });

            payment.open();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Could not start payment."
            );
            setLoading(false);
        }
    }

    if (complete) {
        return (
            <div className="mt-10 border border-moss bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
                    Payment verified
                </p>

                <h2 className="display mt-3 text-4xl">
                    Your order is confirmed.
                </h2>

                <p className="mt-3 text-sm leading-6 text-black/65">
                    Your payment was successfully verified by Setl.
                    Your order is now confirmed.
                </p>

                {orderId && (
                    <Link
                        href={`/orders/${orderId}`}
                        className="mt-6 inline-block bg-ink px-5 py-3 text-sm font-bold text-white"
                    >
                        View your order
                    </Link>
                )}
            </div>
        );
    }

    return (
        <form
            className="mt-10 grid gap-4 border border-black bg-white p-5"
            onSubmit={submit}
        >
            <label className="text-xs font-bold">
                Your name

                <input
                    required
                    name="name"
                    className="mt-1 w-full border border-black/20 p-3 text-sm"
                />
            </label>

            <label className="text-xs font-bold">
                Phone

                <input
                    required
                    name="phone"
                    inputMode="tel"
                    className="mt-1 w-full border border-black/20 p-3 text-sm"
                />
            </label>

            <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold">
                    Hostel

                    <select
                        required
                        name="hostel"
                        className="mt-1 w-full border border-black/20 bg-white p-3 text-sm"
                    >
                        <option value="">Select</option>
                        <option>Hostel 1</option>
                        <option>Hostel 2</option>
                        <option>Other</option>
                    </select>
                </label>

                <label className="text-xs font-bold">
                    Room

                    <input
                        required
                        name="room"
                        className="mt-1 w-full border border-black/20 p-3 text-sm"
                    />
                </label>
            </div>

            <label className="text-xs font-bold">
                Delivery note (optional)

                <textarea
                    name="note"
                    className="mt-1 w-full border border-black/20 p-3 text-sm"
                />
            </label>

            <div className="border border-black/15 bg-[#f7f6f0] p-4">
                <p className="text-xs font-bold uppercase tracking-[.12em] text-moss">
                    Before you pay
                </p>

                <p className="mt-2 text-sm leading-5 text-black/70">
                    Once an order is placed and payment is completed,
                    it cannot be cancelled.
                </p>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="bg-ink p-4 text-sm font-bold text-white disabled:opacity-50"
            >
                {loading
                    ? "Preparing secure payment…"
                    : "Continue to secure payment"}
            </button>

            {error && (
                <p className="text-sm text-red-700">
                    {error}
                </p>
            )}

            <p className="text-xs leading-5 text-black/50">
                Prices and stock are rechecked securely before payment.
                Setl only confirms payment after server-side verification.
            </p>
        </form>
    );
}