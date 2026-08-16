"use client";

import Link from "next/link";
import { useState } from "react";

const guides = {
  hostel: {
    title: "Getting your room sorted?",
    description: "Useful things for your first days in the hostel.",
    items: [
      "Bedsheet & pillow covers",
      "Hangers",
      "Room storage",
      "Bathroom essentials",
      "Laundry essentials",
    ],
  },

  study: {
    title: "Getting your desk ready?",
    description: "A few basics for classes and late-night study.",
    items: [
      "Notebooks & pens",
      "Highlighters",
      "Files & folders",
      "Desk organizer",
      "Study lamp",
    ],
  },

  electronics: {
    title: "Getting your tech sorted?",
    description: "Small things that make campus life easier.",
    items: [
      "Extension board",
      "Charging cables",
      "Laptop accessories",
      "Earphones",
      "Power bank",
    ],
  },
  everything: {
  title: "Just getting started?",
  description: "Browse everything available for your campus setup.",
  items: [
    "Hostel essentials",
    "Study & stationery",
    "Electronics",
    "Everyday essentials",
  ],
},
};



type GuideKey = keyof typeof guides;

export function SetupGuide() {
  const [active, setActive] = useState<GuideKey | null>(null);

  return (
    <div>
      <div className="mt-5 grid grid-cols-2 gap-2 text-sm font-bold">
        {(
          [
            ["hostel", "My hostel"],
            ["study", "My study desk"],
            ["electronics", "My electronics"],
          ] as [GuideKey, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() =>
              setActive((current) => (current === key ? null : key))
            }
            aria-expanded={active === key}
            className={`border border-black px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-white ${
              active === key
                ? "bg-white shadow-[3px_3px_0_#171719]"
                : ""
            }`}
          >
            {label}
          </button>
        ))}

        <button
  type="button"
  onClick={() =>
    setActive((current) =>
      current === "everything" ? null : "everything"
    )
  }
  aria-expanded={active === "everything"}
  className={`border border-black px-3 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-white ${
    active === "everything"
      ? "bg-white shadow-[3px_3px_0_#171719]"
      : ""
  }`}
>
  Everything
</button>
      </div>

      <div
        className={`grid transition-all duration-300 ease-out ${
          active
            ? "mt-4 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          {active && (
            <div className="border border-black bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[.15em] text-moss">
                A quick start
              </p>

              <h3 className="display mt-2 text-2xl leading-tight">
                {guides[active].title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-black/60">
                {guides[active].description}
              </p>

              <ul className="mt-4 space-y-2">
                {guides[active].items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className="mt-0.5 text-moss">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-center gap-3">
                <Link
                  href="/products"
                  className="bg-ink px-4 py-3 text-xs font-bold text-white transition-transform duration-150 hover:-translate-y-0.5"
                >
                  Shop essentials →
                </Link>

                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="px-3 py-3 text-xs font-bold underline underline-offset-4"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}