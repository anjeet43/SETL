import Link from "next/link";
import { Header } from "@/components/header";

export default function PrivacyPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
          Setl policies
        </p>

        <h1 className="display mt-2 text-5xl">
          Privacy Policy
        </h1>

        <div className="mt-10 space-y-8 text-sm leading-7 text-black/70">
          <section>
            <h2 className="text-lg font-bold text-black">
              Information we collect
            </h2>

            <p className="mt-2">
              When you place an order, Setl collects information
              such as your name, phone number, hostel, room
              number and delivery note so that your order can be
              processed and delivered.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              How we use your information
            </h2>

            <p className="mt-2">
              Your information is used to process orders,
              communicate about your order, arrange delivery,
              provide customer support and maintain order
              records.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              Payments
            </h2>

            <p className="mt-2">
              Payments are processed through Razorpay. Setl does
              not store your card, UPI or other payment
              credentials on its own servers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              Data security
            </h2>

            <p className="mt-2">
              Setl takes reasonable measures to protect the
              information associated with your orders and to
              prevent unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-black">
              Contact
            </h2>

            <p className="mt-2">
              If you have questions about your personal
              information or this policy, please contact the
              Setl store team.
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