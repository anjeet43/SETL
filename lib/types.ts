export type CategorySlug = "sleep" | "study" | "power" | "care" | "carry" | "organize";
export type Product = { id: string; name: string; slug: string; description: string | null; category_slug: CategorySlug; price: number; compare_at_price: number | null; stock_quantity: number; sku: string | null; status: "draft" | "active" | "archived"; tags: string[]; badge: string | null; image_url: string | null };
export type Category = { slug: CategorySlug; name: string; icon: string };
export const roomCategories: Category[] = [
  { slug: "sleep", name: "Sleep", icon: "✦" }, { slug: "study", name: "Study", icon: "⌁" }, { slug: "power", name: "Power", icon: "↯" }, { slug: "care", name: "Care", icon: "◌" }, { slug: "carry", name: "Carry", icon: "→" }, { slug: "organize", name: "Organize", icon: "□" }
];
