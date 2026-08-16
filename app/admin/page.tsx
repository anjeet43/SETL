import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { roomCategories, type Product } from "@/lib/types";
import { Logo } from "@/components/logo";

async function createProduct(formData: FormData) {
  "use server";

  const { supabase } = await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  const image = formData.get("image");

  if (
    !name ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    throw new Error(
      "Enter a name, a valid price, and whole-number stock."
    );
  }

  if (
    image instanceof File &&
    (image.size > 5_000_000 ||
      (image.size && !image.type.startsWith("image/")))
  ) {
    throw new Error(
      "Use an image smaller than 5 MB."
    );
  }

  const slug = `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${crypto
      .randomUUID()
      .slice(0, 6)}`;

  let imageUrl: string | null = null;

  if (image instanceof File && image.size) {
    const extension =
      image.name.split(".").pop() || "jpg";

    const path = `${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, image, {
        contentType: image.type,
      });

    if (error) {
      throw new Error(
        `Image upload failed: ${error.message}`
      );
    }

    imageUrl = supabase.storage
      .from("product-images")
      .getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase
    .from("products")
    .insert({
      name,
      slug,
      image_url: imageUrl,
      description:
        String(formData.get("description") || "").trim() ||
        null,
      category_slug: String(
        formData.get("category")
      ),
      price,
      compare_at_price:
        Number(formData.get("compareAt")) || null,
      stock_quantity: stock,
      sku:
        String(formData.get("sku") || "").trim() ||
        null,
      badge:
        String(formData.get("badge") || "").trim() ||
        null,
      status: String(formData.get("status")),
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin");
}

async function updateProduct(formData: FormData) {
  "use server";

  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));

  if (
    !id ||
    !name ||
    !Number.isFinite(price) ||
    price < 0 ||
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    throw new Error(
      "Enter valid product details."
    );
  }

  const { error } = await supabase
    .from("products")
    .update({
      name,
      price,
      compare_at_price:
        Number(formData.get("compareAt")) || null,
      stock_quantity: stock,
      sku:
        String(formData.get("sku") || "").trim() ||
        null,
      badge:
        String(formData.get("badge") || "").trim() ||
        null,
      category_slug: String(
        formData.get("category")
      ),
      description:
        String(formData.get("description") || "").trim() ||
        null,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin");
}

async function updateStatus(formData: FormData) {
  "use server";

  const { supabase } = await requireAdmin();

  await supabase
    .from("products")
    .update({
      status: String(formData.get("status")),
    })
    .eq("id", String(formData.get("id")));

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin");
}

async function deleteProduct(formData: FormData) {
  "use server";

  const { supabase } = await requireAdmin();

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Product ID is missing.");
  }

  /*
   * Products with existing order history should normally
   * be hidden/archived instead of permanently deleted.
   */

  const { count } = await supabase
    .from("order_items")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("product_id", id);

  if (count && count > 0) {
    revalidatePath("/admin");
    redirect("/admin?message=existing-orders");
  }

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/admin");
}

export default async function Admin() {
  let products: Product[] = [];

  let totalOrders = 0;
  let paidOrders = 0;
  let fulfillmentPending = 0;
  let totalSales = 0;

  try {
    const { supabase } = await requireAdmin();

    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    products = (data ?? []) as Product[];

    const { data: orders } = await supabase
      .from("orders")
      .select(
        "id,total,payment_status,fulfillment_status"
      );

    const allOrders = orders ?? [];

    totalOrders = allOrders.length;

    paidOrders = allOrders.filter(
      (order) =>
        order.payment_status === "paid"
    ).length;

    fulfillmentPending = allOrders.filter(
      (order) =>
        order.payment_status === "paid" &&
        order.fulfillment_status !== "delivered"
    ).length;

    totalSales = allOrders
      .filter(
        (order) =>
          order.payment_status === "paid"
      )
      .reduce(
        (sum, order) =>
          sum + Number(order.total || 0),
        0
      );
  } catch {
    redirect("/login?next=/admin");
  }

  const low = products.filter(
    (p) =>
      p.stock_quantity > 0 &&
      p.stock_quantity < 6
  ).length;

  const outOfStock = products.filter(
    (p) => p.stock_quantity < 1
  ).length;

  return (
    <main className="min-h-screen bg-[#eeece4] px-4 py-5 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="flex items-center justify-between">
          <Logo />

          <div className="flex gap-4">
            <a
              href="/admin/orders"
              className="text-sm font-bold underline"
            >
              Orders
            </a>

            <a
              href="/"
              className="text-sm font-bold underline"
            >
              View store
            </a>
          </div>
        </div>

        {/* TITLE */}

        <div className="mt-12">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-moss">
            Private workspace
          </p>

          <h1 className="display mt-2 text-5xl">
            Store manager
          </h1>

          <p className="mt-2 max-w-xl text-sm text-black/60">
            Manage products, inventory and orders
            from one place.
          </p>
        </div>

        {/* STATS */}

        <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="border border-black bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-black/45">
              Products
            </p>

            <p className="display mt-2 text-3xl">
              {products.length}
            </p>
          </div>

          <div className="border border-black bg-lemon p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-black/45">
              Orders
            </p>

            <p className="display mt-2 text-3xl">
              {totalOrders}
            </p>
          </div>

          <div className="border border-black bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-black/45">
              Paid orders
            </p>

            <p className="display mt-2 text-3xl">
              {paidOrders}
            </p>
          </div>

          <div className="border border-black bg-ink p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-white/55">
              Sales
            </p>

            <p className="display mt-2 text-3xl">
              ₹{totalSales.toLocaleString("en-IN")}
            </p>
          </div>
        </section>

        {/* INVENTORY ALERTS */}

        <div className="mt-4 flex flex-wrap gap-2">
          <div className="border border-black/15 bg-white px-4 py-2 text-xs">
            <b>{low}</b> low stock
          </div>

          <div className="border border-black/15 bg-white px-4 py-2 text-xs">
            <b>{outOfStock}</b> out of stock
          </div>

          <div className="border border-black/15 bg-white px-4 py-2 text-xs">
            <b>{fulfillmentPending}</b> orders to fulfill
          </div>
        </div>

        {/* MAIN */}

        <div className="mt-10 grid gap-5 lg:grid-cols-[360px_1fr]">
          {/* ADD PRODUCT */}

          <form
            action={createProduct}
            className="h-fit border border-black bg-white p-5"
          >
            <h2 className="display text-3xl">
              Add a product
            </h2>

            <p className="mt-2 text-xs leading-5 text-black/60">
              Add a product and publish it directly
              to the store.
            </p>

            <div className="mt-6 grid gap-3">
              {[
                [
                  "name",
                  "Product name",
                  "Extension board",
                ],
                ["price", "Price (₹)", "399"],
                ["stock", "Stock", "20"],
                [
                  "sku",
                  "SKU (optional)",
                  "SETL-POWER-01",
                ],
                [
                  "compareAt",
                  "MRP / compare price",
                  "499",
                ],
                [
                  "badge",
                  "Badge (optional)",
                  "Fresher favorite",
                ],
              ].map(
                ([name, label, placeholder]) => (
                  <label
                    key={name}
                    className="text-xs font-bold"
                  >
                    {label}

                    <input
                      required={
                        name === "name" ||
                        name === "price" ||
                        name === "stock"
                      }
                      name={name}
                      type={
                        name === "price" ||
                          name === "stock" ||
                          name === "compareAt"
                          ? "number"
                          : "text"
                      }
                      min={
                        name === "price" ||
                          name === "stock" ||
                          name === "compareAt"
                          ? "0"
                          : undefined
                      }
                      step={
                        name === "stock"
                          ? "1"
                          : name === "price" || name === "compareAt"
                            ? "0.01"
                            : undefined
                      }
                      placeholder={placeholder}
                      className="mt-1 w-full border border-black/20 px-3 py-2 text-sm font-normal outline-none focus:border-black"
                    />
                  </label>
                )
              )}

              <label className="text-xs font-bold">
                Product image

                <span className="font-normal text-black/45">
                  {" "}
                  (optional, max 5 MB)
                </span>

                <input
                  name="image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="mt-1 block w-full text-xs font-normal"
                />
              </label>

              <label className="text-xs font-bold">
                Category

                <select
                  name="category"
                  className="mt-1 w-full border border-black/20 bg-white px-3 py-2 text-sm font-normal"
                >
                  {roomCategories.map((c) => (
                    <option
                      value={c.slug}
                      key={c.slug}
                    >
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-bold">
                Description

                <textarea
                  name="description"
                  rows={3}
                  className="mt-1 w-full border border-black/20 p-3 text-sm font-normal"
                  placeholder="What makes this useful in a hostel?"
                />
              </label>

              <label className="text-xs font-bold">
                Publish status

                <select
                  name="status"
                  defaultValue="draft"
                  className="mt-1 w-full border border-black/20 bg-white px-3 py-2 text-sm font-normal"
                >
                  <option value="draft">
                    Save as draft
                  </option>

                  <option value="active">
                    Publish now
                  </option>
                </select>
              </label>

              <button className="mt-2 bg-ink px-4 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5">
                Save product
              </button>
            </div>
          </form>

          {/* CATALOG */}

          <section className="border border-black bg-white">
            <div className="border-b border-black p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="display text-3xl">
                    Catalog
                  </h2>

                  <p className="mt-1 text-xs text-black/50">
                    Edit, hide or remove products.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-black/10">
              {products.map((p) => (
                <details
                  key={p.id}
                  className="group"
                >
                  <summary className="cursor-pointer list-none p-5 transition-colors hover:bg-black/[.025]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <b>{p.name}</b>

                          {p.badge && (
                            <span className="bg-lemon px-2 py-0.5 text-[9px] font-bold uppercase">
                              {p.badge}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-black/50">
                          {p.sku || "No SKU"} ·{" "}
                          {p.category_slug}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-4 text-right">
                        <div>
                          <p className="text-sm font-bold">
                            ₹
                            {p.price.toLocaleString(
                              "en-IN"
                            )}
                          </p>

                          <p
                            className={`text-xs ${p.stock_quantity < 6
                                ? "font-bold text-red-700"
                                : "text-black/50"
                              }`}
                          >
                            {p.stock_quantity} in stock
                          </p>
                        </div>

                        <span className="text-lg transition-transform group-open:rotate-180">
                          ↓
                        </span>
                      </div>
                    </div>
                  </summary>

                  {/* EDIT PANEL */}

                  <div className="border-t border-black/10 bg-[#faf9f5] p-5">
                    <form
                      action={updateProduct}
                      className="grid gap-4 md:grid-cols-2"
                    >
                      <input
                        type="hidden"
                        name="id"
                        value={p.id}
                      />

                      <label className="text-xs font-bold">
                        Product name

                        <input
                          name="name"
                          defaultValue={p.name}
                          required
                          className="mt-1 w-full border border-black/20 bg-white px-3 py-2 text-sm font-normal"
                        />
                      </label>

                      <label className="text-xs font-bold">
                        Price (₹)

                        <input
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={p.price}
                          required
                          className="mt-1 w-full border border-black/20 bg-white px-3 py-2 text-sm font-normal"
                        />
                      </label>

                      <label className="text-xs font-bold">
                        Stock

                        <input
                          name="stock"
                          type="number"
                          min="0"
                          step="1"
                          defaultValue={
                            p.stock_quantity
                          }
                          required
                          className="mt-1 w-full border border-black/20 bg-white px-3 py-2 text-sm font-normal"
                        />
                      </label>

                      <label className="text-xs font-bold">
                        MRP / compare price

                        <input
                          name="compareAt"
                          type="number"
                          min="0"
                          defaultValue={
                            p.compare_at_price ?? ""
                          }
                          className="mt-1 w-full border border-black/20 bg-white px-3 py-2 text-sm font-normal"
                        />
                      </label>

                      <label className="text-xs font-bold">
                        SKU

                        <input
                          name="sku"
                          defaultValue={
                            p.sku ?? ""
                          }
                          className="mt-1 w-full border border-black/20 bg-white px-3 py-2 text-sm font-normal"
                        />
                      </label>

                      <label className="text-xs font-bold">
                        Badge

                        <input
                          name="badge"
                          defaultValue={
                            p.badge ?? ""
                          }
                          className="mt-1 w-full border border-black/20 bg-white px-3 py-2 text-sm font-normal"
                        />
                      </label>

                      <label className="text-xs font-bold md:col-span-2">
                        Category

                        <select
                          name="category"
                          defaultValue={
                            p.category_slug
                          }
                          className="mt-1 w-full border border-black/20 bg-white px-3 py-2 text-sm font-normal"
                        >
                          {roomCategories.map(
                            (c) => (
                              <option
                                key={c.slug}
                                value={c.slug}
                              >
                                {c.name}
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label className="text-xs font-bold md:col-span-2">
                        Description

                        <textarea
                          name="description"
                          defaultValue={
                            p.description ?? ""
                          }
                          rows={3}
                          className="mt-1 w-full border border-black/20 bg-white p-3 text-sm font-normal"
                        />
                      </label>

                      <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                        <button
                          type="submit"
                          className="bg-ink px-4 py-3 text-xs font-bold text-white transition-transform hover:-translate-y-0.5"
                        >
                          Save changes
                        </button>
                      </div>
                    </form>

                    {/* STATUS + DELETE */}

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-black/10 pt-5">
                      <form
                        action={updateStatus}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={p.id}
                        />

                        <select
                          name="status"
                          defaultValue={p.status}
                          className="border border-black/20 bg-white px-3 py-2 text-xs"
                        >
                          <option value="draft">
                            Draft
                          </option>

                          <option value="active">
                            Live
                          </option>

                          <option value="archived">
                            Hidden
                          </option>
                        </select>

                        <button className="text-xs font-bold underline">
                          Update status
                        </button>
                      </form>

                      <form action={deleteProduct}>
                        <input
                          type="hidden"
                          name="id"
                          value={p.id}
                        />

                        <button
                          type="submit"
                          className="border border-red-700 px-3 py-2 text-xs font-bold text-red-700 transition-colors hover:bg-red-700 hover:text-white"
                        >
                          Delete product
                        </button>
                      </form>
                    </div>

                    <p className="mt-3 text-[11px] leading-5 text-black/45">
                      If this product has already appeared
                      in an order, use <b>Hidden</b> instead
                      of deleting it.
                    </p>
                  </div>
                </details>
              ))}

              {!products.length && (
                <p className="p-8 text-sm text-black/55">
                  No products yet. Your first product
                  will appear here.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}