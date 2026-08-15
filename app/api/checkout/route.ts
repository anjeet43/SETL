import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const customer = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[0-9+ -]{8,18}$/),
  hostel: z.string().trim().min(1).max(80),
  room: z.string().trim().min(1).max(30),
  note: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    // -------------------------------------------------------
    // 1. Validate customer details
    // -------------------------------------------------------

    const form = await request.formData();

    const parsed = customer.safeParse(
      Object.fromEntries(form)
    );

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Please complete valid delivery details.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // 2. Read cart
    // -------------------------------------------------------

    let cart: Record<string, number> = {};

    try {
      const raw = request.headers
        .get("cookie")
        ?.match(/setl_cart=([^;]+)/)?.[1];

      cart = raw
        ? JSON.parse(decodeURIComponent(raw))
        : {};
    } catch {
      cart = {};
    }

    const ids = Object.keys(cart);

    if (!ids.length) {
      return NextResponse.json(
        {
          error: "Your cart is empty.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // 3. Read current active products
    //
    // This is only used to calculate the expected amount.
    // The database reservation function performs the FINAL
    // stock + price validation atomically.
    // -------------------------------------------------------

    const db = createAdminClient();

    const { data: products, error: productsError } =
      await db
        .from("products")
        .select(
          "id,name,price,stock_quantity,status"
        )
        .in("id", ids)
        .eq("status", "active");

    if (
      productsError ||
      !products ||
      products.length !== ids.length
    ) {
      return NextResponse.json(
        {
          error:
            "One or more items are unavailable.",
        },
        { status: 409 }
      );
    }

    const lines = products.map((product) => ({
      product_id: product.id,
      quantity: Number(cart[product.id]),
      name: product.name,
      price: product.price,
    }));

    // Basic validation before contacting Razorpay.
    if (
      lines.some(
        (item) =>
          !Number.isInteger(item.quantity) ||
          item.quantity < 1
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid cart quantity.",
        },
        { status: 400 }
      );
    }

    const amount = lines.reduce(
      (sum, item) =>
        sum + item.price * item.quantity,
      0
    );

    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        {
          error: "Invalid order amount.",
        },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // 4. Create Razorpay order
    //
    // The payment order is created server-side.
    // -------------------------------------------------------

    const receipt = `setl_${crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, 28)}`;

    const razorpayKeyId =
      process.env.RAZORPAY_KEY_ID;

    const razorpayKeySecret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error(
        "Missing Razorpay server credentials."
      );

      return NextResponse.json(
        {
          error:
            "Payment service is not configured.",
        },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    const payment =
      await razorpay.orders.create({
        amount: amount * 100,
        currency: "INR",
        receipt,
        notes: {
          hostel: parsed.data.hostel,
          room: parsed.data.room,
        },
      });

    // -------------------------------------------------------
    // 5. Create Setl order + RESERVE STOCK atomically
    //
    // IMPORTANT:
    // Do NOT insert orders/order_items manually here.
    //
    // The PostgreSQL function:
    //
    // create_order_with_stock_reservation()
    //
    // performs:
    // - final price validation
    // - final stock validation
    // - row locking
    // - Setl order creation
    // - order item creation
    // - stock reservation
    // - inventory event creation
    //
    // All inside ONE database transaction.
    // -------------------------------------------------------

    const orderAccessToken =
      crypto.randomUUID();

    const { data: orderId, error: reservationError } =
      await db.rpc(
        "create_order_with_stock_reservation",
        {
          p_razorpay_order_id: payment.id,
          p_receipt: receipt,
          p_order_access_token:
            orderAccessToken,
          p_customer_name:
            parsed.data.name,
          p_customer_phone:
            parsed.data.phone,
          p_hostel:
            parsed.data.hostel,
          p_room:
            parsed.data.room,
          p_delivery_note:
            parsed.data.note || null,
          p_expected_total: amount,
          p_items: lines.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
        }
      );

    // -------------------------------------------------------
    // 6. Reservation failed
    // -------------------------------------------------------

    if (reservationError || !orderId) {
      console.error(
        "Inventory reservation failed:",
        reservationError
      );

      const message =
        reservationError?.message || "";

      if (
        message.includes(
          "INSUFFICIENT_STOCK"
        )
      ) {
        return NextResponse.json(
          {
            error:
              "One or more items are no longer available in the requested quantity.",
          },
          { status: 409 }
        );
      }

      if (
        message.includes(
          "PRODUCT_UNAVAILABLE"
        )
      ) {
        return NextResponse.json(
          {
            error:
              "One or more items are no longer available.",
          },
          { status: 409 }
        );
      }

      if (
        message.includes(
          "TOTAL_CHANGED"
        )
      ) {
        return NextResponse.json(
          {
            error:
              "The price of an item changed. Please return to your cart and try again.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error:
            "We couldn't reserve your items. Please try again.",
        },
        { status: 409 }
      );
    }

    // -------------------------------------------------------
    // 7. Return Razorpay checkout information
    // -------------------------------------------------------

    const response =
      NextResponse.json({
        orderId,
        razorpayOrderId: payment.id,
        amount: amount * 100,
        currency: "INR",
        key: razorpayKeyId,
      });

    // Customer can use this cookie to view their order.
    response.cookies.set(
      `setl_order_${orderId}`,
      orderAccessToken,
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        maxAge: 60 * 60 * 24 * 90,
        path: "/",
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Checkout creation failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not start checkout. Please try again.",
      },
      { status: 500 }
    );
  }
}

