import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return NextResponse.json(
        { error: "Missing payment verification details." },
        { status: 400 }
      );
    }

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpaySecret) {
      console.error("Missing Razorpay server secret.");

      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 500 }
      );
    }

    const db = createAdminClient();

    // -------------------------------------------------------
    // 1. Get the order from our own database.
    //
    // Never trust the order ID supplied by the browser.
    // -------------------------------------------------------

    const { data: order, error: orderError } = await db
      .from("orders")
      .select(
        "id, razorpay_order_id, payment_status"
      )
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // -------------------------------------------------------
    // 2. Make sure the Razorpay order belongs to this
    //    Setl order.
    // -------------------------------------------------------

    if (
      order.razorpay_order_id !==
      razorpay_order_id
    ) {
      return NextResponse.json(
        { error: "Payment order mismatch." },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // 3. Verify Razorpay signature.
    // -------------------------------------------------------

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          razorpaySecret
        )
        .update(
          `${order.razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");

    const receivedBuffer =
      Buffer.from(razorpay_signature, "utf8");

    const generatedBuffer =
      Buffer.from(generatedSignature, "utf8");

    if (
      receivedBuffer.length !==
        generatedBuffer.length ||
      !crypto.timingSafeEqual(
        receivedBuffer,
        generatedBuffer
      )
    ) {
      return NextResponse.json(
        { error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // 4. Commit the existing inventory reservation.
    //
    // IMPORTANT:
    //
    // Checkout already reserved/decremented stock.
    //
    // Therefore we MUST NOT deduct stock again here.
    //
    // The database function changes:
    //
    // reservation:
    // active → committed
    //
    // order:
    // created → paid
    // -------------------------------------------------------

    const { error: commitError } =
      await db.rpc(
        "commit_inventory_reservation",
        {
          p_order_id: order.id,
          p_payment_id:
            razorpay_payment_id,
        }
      );

    if (commitError) {
      console.error(
        "Inventory reservation commit failed:",
        commitError
      );

      return NextResponse.json(
        {
          error:
            "Payment was verified, but the order could not be finalized. Please contact Setl support.",
        },
        { status: 500 }
      );
    }

   const response = NextResponse.json({
    success: true,
    orderId: order.id,
});

response.cookies.set("setl_cart", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
});

return response;

  } catch (error) {
    console.error(
      "Payment verification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not verify payment.",
      },
      { status: 500 }
    );
  }
}