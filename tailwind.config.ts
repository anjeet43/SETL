import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#171719", paper: "#f7f6f1", lemon: "#d9ff3f", moss: "#184f42", clay: "#f4e7cf" }, fontFamily: { display: ["var(--font-display)"], sans: ["var(--font-sans)"] } } }, plugins: [] } satisfies Config;
