import { Header } from "@/components/header";
import { CheckoutForm } from "@/components/checkout-form";
export default function Checkout() { return <><Header/><main className="mx-auto max-w-xl px-5 py-14"><p className="text-xs font-bold uppercase tracking-[.18em] text-moss">Delivery details</p><h1 className="display mt-2 text-6xl">Where should we set it down?</h1><CheckoutForm/></main></>; }
