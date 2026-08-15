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

    const db = createAdminClient();

    // Retrieve the Razorpay order ID from our own database.
    // Do not trust the order ID supplied by the browser.
    const { data: order, error: orderError } = await db
      .from("orders")
      .select("id, razorpay_order_id, payment_status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    if (order.razorpay_order_id !== razorpay_order_id) {
      return NextResponse.json(
        { error: "Payment order mismatch." },
        { status: 400 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${order.razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    // Signature is valid. The payment came from the expected Razorpay order.
    const { error: finalizeError } = await db.rpc("finalize_paid_order", {
      p_order_id: order.id,
      p_payment_id: razorpay_payment_id,
    });

    if (finalizeError) {
      console.error(finalizeError);

      return NextResponse.json(
        { error: "Payment was verified, but order finalization failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return NextResponse.json(
      { error: "Could not verify payment." },
      { status: 500 }
    );
  }
}