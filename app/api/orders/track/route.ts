import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const orderId = String(body.orderId || "")
      .trim()
      .toLowerCase();

    const phone = String(body.phone || "")
      .trim()
      .replace(/\D/g, "");

    if (!orderId || !phone) {
      return NextResponse.json(
        {
          error: "Please enter your order ID and phone number.",
        },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    const { data: orders, error } = await db
      .from("orders")
      .select(
        "id, customer_name, customer_phone, hostel, room, total, payment_status, fulfillment_status, created_at"
      )
      .eq("customer_phone", phone)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Order lookup failed:", error);

      return NextResponse.json(
        {
          error: "Could not check your order right now.",
        },
        { status: 500 }
      );
    }

    const order = (orders ?? []).find(
      (item) => item.id.slice(0, 8).toLowerCase() === orderId
    );

    if (!order) {
      return NextResponse.json(
        {
          error: "We couldn't find an order with those details.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: {
        id: order.id,
        customerName: order.customer_name,
        hostel: order.hostel,
        room: order.room,
        total: order.total,
        paymentStatus: order.payment_status,
        fulfillmentStatus: order.fulfillment_status,
        createdAt: order.created_at,
      },
    });
  } catch (error) {
    console.error("Order tracking error:", error);

    return NextResponse.json(
      {
        error: "Could not check your order right now.",
      },
      { status: 500 }
    );
  }
}