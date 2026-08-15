import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Setl — Your room, ready before you are", description: "Essentials for your IIITM hostel room." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
