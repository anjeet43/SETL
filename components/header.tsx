"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./logo";

export function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [cartBump, setCartBump] = useState(false);

  async function loadCartCount() {
    try {
      const response = await fetch("/api/cart", {
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();

      setCartCount(Number(data.count) || 0);
    } catch (error) {
      console.error("Could not load cart count:", error);
    }
  }

  useEffect(() => {
    loadCartCount();

    function handleCartUpdate() {
      loadCartCount();

      setCartBump(true);

      window.setTimeout(() => {
        setCartBump(false);
      }, 300);
    }

    window.addEventListener(
      "cart-updated",
      handleCartUpdate
    );

    return () => {
      window.removeEventListener(
        "cart-updated",
        handleCartUpdate
      );
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />

        <nav className="flex items-center gap-1 text-sm font-medium">
          {/* <Link
            className="rounded-full px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-black/5 active:translate-y-0"
            href="#room"
          >
            Build room
          </Link> */}

          <Link
            className="rounded-full px-3 py-2 transition-colors hover:bg-black/5"
            href="/#essentials"
          >
            Essentials
          </Link>

          <Link
            className="rounded-full px-3 py-2 transition-colors hover:bg-black/5"
            href="/orders"
          >
            Orders
          </Link>

          <Link
  className="rounded-full px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:bg-black/5 active:translate-y-0"
  href="/track-order"
>
  Track order
</Link>

          <Link
            href="/cart"
            className={`rounded-full bg-ink px-4 py-2 text-white transition-all duration-200 ${
              cartBump
                ? "scale-105"
                : "scale-100"
            }`}
          >
            Cart
            {cartCount > 0 && (
              <span className="ml-1.5">
                · {cartCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}