import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const customer = z.object({ name: z.string().trim().min(2).max(80), phone: z.string().trim().regex(/^[0-9+ -]{8,18}$/), hostel: z.string().trim().min(1).max(80), room: z.string().trim().min(1).max(30), note: z.string().trim().max(500).optional() });
export async function POST(request: Request) {
  const form = await request.formData(); const parsed = customer.safeParse(Object.fromEntries(form)); if (!parsed.success) return NextResponse.json({ error: "Please complete valid delivery details." }, { status: 400 });
  let cart: Record<string, number> = {}; try { const raw = request.headers.get("cookie")?.match(/setl_cart=([^;]+)/)?.[1]; cart = raw ? JSON.parse(decodeURIComponent(raw)) : {}; } catch { }
  const ids = Object.keys(cart); if (!ids.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  const db = createAdminClient(); const { data: products } = await db.from("products").select("id,name,price,stock_quantity,status").in("id", ids).eq("status", "active"); if (!products || products.length !== ids.length) return NextResponse.json({ error: "One or more items are unavailable." }, { status: 409 });
  const lines = products.map(p => ({ ...p, quantity: Number(cart[p.id]) })); if (lines.some(p => !Number.isInteger(p.quantity) || p.quantity < 1 || p.quantity > p.stock_quantity)) return NextResponse.json({ error: "An item no longer has enough stock." }, { status: 409 });
  const amount = lines.reduce((sum, item) => sum + item.price * item.quantity, 0); const receipt = `setl_${crypto.randomUUID().replaceAll("-", "").slice(0, 28)}`;
  const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! }); const payment = await razorpay.orders.create({ amount: amount * 100, currency: "INR", receipt, notes: { hostel: parsed.data.hostel, room: parsed.data.room } });
  const orderAccessToken = crypto.randomUUID();
  
  const { data: order, error } = await db
  .from("orders")
  .insert({
    razorpay_order_id: payment.id,
    receipt,
    order_access_token: orderAccessToken,
    customer_name: parsed.data.name,
    customer_phone: parsed.data.phone,
    hostel: parsed.data.hostel,
    room: parsed.data.room,
    delivery_note: parsed.data.note || null,
    subtotal: amount,
    total: amount,
    payment_status: "created",
    fulfillment_status: "confirmed",
  })
  .select("id")
  .single();
   if (error) return NextResponse.json({ error: "Could not create your order." }, { status: 500 });
  await db.from("order_items").insert(lines.map(item => ({ order_id: order.id, product_id: item.id, product_name: item.name, unit_price: item.price, quantity: item.quantity })));
  const response = NextResponse.json({
  orderId: order.id,
  razorpayOrderId: payment.id,
  amount: amount * 100,
  currency: "INR",
  key: process.env.RAZORPAY_KEY_ID,
});

response.cookies.set(
  `setl_order_${order.id}`,
  orderAccessToken,
  {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  }
);

return response;
}
