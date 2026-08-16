"use client";

import { useState } from "react";

type Props = {
  productId: string;
  productName: string;
  quantity: number;
  stockQuantity: number;
};

export function CartActions({
  productId,
  productName,
  quantity,
  stockQuantity,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function updateCart(action: "add" | "decrement" | "remove") {
    if (loading) return;

    setLoading(true);

    try {
      const formData = new URLSearchParams();

      formData.set("productId", productId);
      formData.set("action", action);

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        redirect: "manual",
      });

      if (
        !response.ok &&
        response.type !== "opaqueredirect"
      ) {
        throw new Error("Could not update cart.");
      }

      window.dispatchEvent(new Event("cart-updated"));

      window.location.reload();
    } catch (error) {
      console.error("Cart update failed:", error);
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="flex items-center border border-black">
        <button
          type="button"
          disabled={loading}
          onClick={() => updateCart("decrement")}
          className="h-8 w-8 text-lg transition-colors hover:bg-black/5 disabled:opacity-30"
          aria-label={`Remove one ${productName}`}
        >
          −
        </button>

        <span className="min-w-8 text-center text-sm font-bold">
          {quantity}
        </span>

        <button
          type="button"
          disabled={
            loading || quantity >= stockQuantity
          }
          onClick={() => updateCart("add")}
          className="h-8 w-8 text-lg transition-colors hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Add one ${productName}`}
        >
          +
        </button>
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={() => updateCart("remove")}
        className="text-xs font-bold text-black/55 underline transition-colors hover:text-black disabled:opacity-30"
      >
        {loading ? "Updating..." : "Remove"}
      </button>
    </div>
  );
}