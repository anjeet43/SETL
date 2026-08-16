import Link from "next/link";
import { Header } from "@/components/header";

export default function ShippingPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
          Setl policies
        </p>

        <h1 className="display mt-2 text-5xl">
          Shipping & Delivery
        </h1>

        <div className="mt-10 space-y-8 text-sm leading-7 text-black/70">
          <section>
            <h2 className="text-lg font-bold text-black">
              Delivery area
            </h2>

            <p className="mt-2">
              Setl currently serves the IIIT Manipur campus and
              hostel community.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              Delivery details
            </h2>

            <p className="mt-2">
              Orders are delivered using the hostel and room
              information provided during checkout. Customers
              should make sure these details are accurate.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              Delivery timing
            </h2>

            <p className="mt-2">
              Delivery timing may vary depending on order
              volume, product availability and campus
              conditions. The Setl team may contact the customer
              when additional delivery information is required.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              Delivery issues
            </h2>

            <p className="mt-2">
              If you are unable to receive your order or notice a
              delivery issue, contact the Setl store team with
              your order details.
            </p>
          </section>
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