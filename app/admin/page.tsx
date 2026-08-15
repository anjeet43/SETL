import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { roomCategories, type Product } from "@/lib/types";
import { Logo } from "@/components/logo";

async function createProduct(formData: FormData) {
  "use server";
  const { supabase } = await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price")); const stock = Number(formData.get("stock")); const image = formData.get("image");
  if (!name || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) throw new Error("Enter a name, a valid price, and whole-number stock.");
  if (image instanceof File && (image.size > 5_000_000 || (image.size && !image.type.startsWith("image/")))) throw new Error("Use an image smaller than 5 MB.");
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${crypto.randomUUID().slice(0, 6)}`;
  let imageUrl: string | null = null;
  if (image instanceof File && image.size) {
    const extension = image.name.split(".").pop() || "jpg"; const path = `${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("product-images").upload(path, image, { contentType: image.type });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  }
  const { error } = await supabase.from("products").insert({ name, slug, image_url: imageUrl, description: String(formData.get("description") || "").trim() || null, category_slug: String(formData.get("category")), price, compare_at_price: Number(formData.get("compareAt")) || null, stock_quantity: stock, sku: String(formData.get("sku") || "").trim() || null, badge: String(formData.get("badge") || "").trim() || null, status: String(formData.get("status")) });
  if (error) throw new Error(error.message);
  revalidatePath("/"); revalidatePath("/products"); revalidatePath("/admin");
}
async function updateStatus(formData: FormData) { "use server"; const { supabase } = await requireAdmin(); await supabase.from("products").update({ status: formData.get("status") }).eq("id", formData.get("id")); revalidatePath("/"); revalidatePath("/admin"); }

export default async function Admin() {
  let products: Product[] = [];
  try { const { supabase } = await requireAdmin(); const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }); products = (data ?? []) as Product[]; } catch { redirect("/login?next=/admin"); }
  const low = products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 6).length;
  return <main className="min-h-screen bg-[#eeece4] px-4 py-5 md:px-8"><div className="mx-auto max-w-6xl">
    <div className="flex items-center justify-between"><Logo/><a href="/" className="text-sm font-bold underline">View store</a></div>
    <div className="mt-12 flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-moss">Private workspace</p><h1 className="display mt-2 text-5xl">Store manager</h1><p className="mt-2 text-sm text-black/60">Publish a product once. It appears on the storefront immediately.</p></div><div className="flex gap-2"><div className="border border-black bg-white px-4 py-3 text-sm"><b>{products.length}</b> products</div><div className="border border-black bg-lemon px-4 py-3 text-sm"><b>{low}</b> low stock</div></div></div>
    <div className="mt-10 grid gap-5 lg:grid-cols-[360px_1fr]">
      <form
  action={createProduct}
  className="h-fit border border-black bg-white p-5"
>
      <h2 className="display text-3xl">Add a product</h2><p className="mt-2 text-xs leading-5 text-black/60">Add a clear product photo, name, price and stock. The image appears in the shop immediately after publishing.</p><div className="mt-6 grid gap-3">
        {[ ["name", "Product name", "Extension board"], ["price", "Price (₹)", "399"], ["stock", "Stock", "20"], ["sku", "SKU (optional)", "SETL-POWER-01"], ["compareAt", "MRP / compare price", "499"], ["badge", "Badge (optional)", "Fresher favorite"] ].map(([name, label, placeholder]) => <label key={name} className="text-xs font-bold">{label}<input required={name === "name" || name === "price" || name === "stock"} name={name} type={name === "price" || name === "stock" || name === "compareAt" ? "number" : "text"} placeholder={placeholder} className="mt-1 w-full border border-black/20 px-3 py-2 text-sm font-normal outline-none focus:border-black"/></label>)}
        <label className="text-xs font-bold">Product image <span className="font-normal text-black/45">(optional, max 5 MB)</span><input name="image" type="file" accept="image/png,image/jpeg,image/webp" className="mt-1 block w-full text-xs font-normal"/></label>
        <label className="text-xs font-bold">Category<select name="category" className="mt-1 w-full border border-black/20 bg-white px-3 py-2 text-sm font-normal">{roomCategories.map(c => <option value={c.slug} key={c.slug}>{c.name}</option>)}</select></label>
        <label className="text-xs font-bold">Description<textarea name="description" rows={3} className="mt-1 w-full border border-black/20 p-3 text-sm font-normal" placeholder="What makes this useful in a hostel?"/></label>
        <label className="text-xs font-bold">Publish status<select name="status" defaultValue="draft" className="mt-1 w-full border border-black/20 bg-white px-3 py-2 text-sm font-normal"><option value="draft">Save as draft</option><option value="active">Publish now</option></select></label><button className="mt-2 bg-ink px-4 py-3 text-sm font-bold text-white">Save product</button>
      </div></form>
      <section className="border border-black bg-white"><div className="border-b border-black p-5"><h2 className="display text-3xl">Catalog</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-black/10 text-xs uppercase tracking-wider text-black/45"><tr><th className="p-4">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead><tbody>{products.map(p => <tr className="border-b border-black/10" key={p.id}><td className="p-4"><b>{p.name}</b><br/><span className="text-xs text-black/50">{p.sku || "No SKU"}</span></td><td className="capitalize">{p.category_slug}</td><td>₹{p.price}</td><td className={p.stock_quantity < 6 ? "font-bold text-red-700" : ""}>{p.stock_quantity}</td><td><form action={updateStatus} className="flex gap-1"><input type="hidden" name="id" value={p.id}/><select name="status" defaultValue={p.status} className="border border-black/15 bg-white px-2 py-1 text-xs"><option value="draft">Draft</option><option value="active">Live</option><option value="archived">Hidden</option></select><button className="text-xs font-bold underline">Save</button></form></td></tr>)}</tbody></table>{!products.length && <p className="p-8 text-sm text-black/55">No products yet. Your first product will appear here.</p>}</div></section>
    </div></div></main>;
}
