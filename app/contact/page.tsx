import Link from "next/link";
import { Header } from "@/components/header";

export default function ContactPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
          Setl
        </p>

        <h1 className="display mt-2 text-5xl">
          Contact us
        </h1>

        <div className="mt-10 border border-black bg-white p-6">
          <h2 className="display text-3xl">
            Need help with an order?
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-black/65">
            For questions about an order, delivery or payment,
            keep your order number ready when contacting the
            Setl store team.
          </p>

          <div className="mt-6 border-t border-black/10 pt-5 text-sm">
            <p className="font-bold">
              Setl — IIIT Manipur
            </p>

            <p className="mt-1 text-black/55">
              Campus store for hostel and everyday essentials.
            </p>

            {/* Replace these with your real support details */}
            <p className="mt-5 text-black/70">
              Email: <span className="font-bold">officialanjeet@gmail.com</span>
            </p>

            <p className="mt-1 text-black/70">
              Phone: <span className="font-bold">6299239203</span>
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="mt-10 inline-block text-sm font-bold underline"
        >
          ← Back to Setl
        </Link>
      </main>
    </>
  );
}