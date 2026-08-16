import Link from "next/link";
import { Header } from "@/components/header";

export default function RefundsPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
          Setl policies
        </p>

        <h1 className="display mt-2 text-5xl">
          Cancellation & Refunds
        </h1>

        <div className="mt-10 space-y-8 text-sm leading-7 text-black/70">
          <section className="border border-black bg-lemon p-5">
            <h2 className="text-lg font-bold text-black">
              Cancellation
            </h2>

            <p className="mt-2">
              Once an order has been placed and payment has been
              completed, it cannot be cancelled by the customer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              When a refund may apply
            </h2>

            <p className="mt-2">
              If Setl is unable to fulfil a successfully paid
              order, the customer may be eligible for a refund.
              Refunds may also be considered for duplicate
              payments or other payment-related issues verified
              by the Setl team.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              Payment failures
            </h2>

            <p className="mt-2">
              If a payment fails, the order is not treated as a
              successfully paid order. If your account is charged
              despite a failed payment, contact Setl with the
              payment and order details so the transaction can be
              checked.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              Refund processing
            </h2>

            <p className="mt-2">
              Where a refund is approved, it will be processed
              through the applicable payment channel. The time
              taken for the amount to appear in the customer's
              account may depend on the payment provider and
              banking system.
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