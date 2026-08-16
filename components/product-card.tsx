"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const unavailable = product.stock_quantity < 1;
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function addToCart() {
    if (unavailable || adding) return;

    setAdding(true);
    setAdded(false);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          productId: product.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Could not add product to cart.");
      }

      setAdded(true);

      window.dispatchEvent(new Event("cart-updated"));

      setTimeout(() => {
        setAdded(false);
      }, 1500);
    } catch (error) {
      console.error("Add to cart failed:", error);
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className="lift group relative overflow-hidden border border-black/10 bg-white p-3">
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-clay">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grain flex h-full items-end p-4 text-xs font-bold uppercase tracking-[.16em] text-black/45">
              Image coming soon
            </div>
          )}

          {product.badge && (
            <span className="absolute left-2 top-2 bg-lemon px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
              {product.badge}
            </span>
          )}
        </div>

        <h3 className="mt-3 text-sm font-bold leading-tight">
          {product.name}
        </h3>

        <p className="mt-1 text-sm">
          ₹{product.price.toLocaleString("en-IN")}

          {product.compare_at_price && (
            <del className="ml-1 text-xs text-black/45">
              ₹{product.compare_at_price.toLocaleString("en-IN")}
            </del>
          )}
        </p>
      </Link>

      <button
        type="button"
        disabled={unavailable || adding}
        onClick={addToCart}
        className="mt-3 w-full border border-black bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:border-black/15 disabled:text-black/35"
      >
        {unavailable
          ? "Out of Stock"
          : adding
            ? "Adding..."
            : added
              ? "✓ Added to setup"
              : "Add to setup"}
      </button>
    </article>
  );
}