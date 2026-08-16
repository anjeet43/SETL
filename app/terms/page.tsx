import Link from "next/link";
import { Header } from "@/components/header";

export default function TermsPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
          Setl policies
        </p>

        <h1 className="display mt-2 text-5xl">
          Terms & Conditions
        </h1>

        <div className="mt-10 space-y-8 text-sm leading-7 text-black/70">
          <section>
            <h2 className="text-lg font-bold text-black">
              1. About Setl
            </h2>

            <p className="mt-2">
              Setl is a campus-focused store offering hostel,
              study, electronics and everyday essentials for
              students at IIIT Manipur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              2. Orders
            </h2>

            <p className="mt-2">
              An order is placed when the customer completes
              checkout and the payment is successfully verified.
              Customers are responsible for providing accurate
              name, phone, hostel and room details.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              3. Pricing and availability
            </h2>

            <p className="mt-2">
              Product prices and availability may change from
              time to time. Setl checks product availability
              before accepting payment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              4. Order cancellation
            </h2>

            <p className="mt-2">
              Once an order has been placed and payment has been
              completed, the order cannot be cancelled by the
              customer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              5. Delivery
            </h2>

            <p className="mt-2">
              Orders are delivered according to the delivery
              information provided during checkout. Customers
              should provide correct hostel and room details to
              help ensure successful delivery.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              6. Changes to these terms
            </h2>

            <p className="mt-2">
              Setl may update these terms when necessary. The
              latest version will be available on this page.
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