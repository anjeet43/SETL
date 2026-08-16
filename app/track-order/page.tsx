import { Header } from "@/components/header";
import { TrackOrderForm } from "@/components/track-order-form";

export default function TrackOrderPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
          Order tracking
        </p>

        <h1 className="display mt-2 text-5xl">
          Where's my order?
        </h1>

        <p className="mt-4 max-w-lg text-sm leading-6 text-black/60">
          Enter your order ID and the phone number used during
          checkout to check your order from any device.
        </p>

        <TrackOrderForm />
      </main>
    </>
  );
}