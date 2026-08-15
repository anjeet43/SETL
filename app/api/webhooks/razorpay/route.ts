import crypto from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export async function POST(request: Request) {
  try {
    // -------------------------------------------------------
    // 1. Read the RAW webhook body.
    //
    // Razorpay signature verification must use the exact
    // raw request body.
    // -------------------------------------------------------

    const body = await request.text();

    const signature =
      request.headers.get(
        "x-razorpay-signature"
      ) || "";

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error(
        "Missing Razorpay webhook secret."
      );

      return new NextResponse(
        "Webhook is not configured",
        { status: 500 }
      );
    }

    // -------------------------------------------------------
    // 2. Verify Razorpay webhook signature.
    // -------------------------------------------------------

    const expected =
      crypto
        .createHmac(
          "sha256",
          webhookSecret
        )
        .update(body)
        .digest("hex");

    if (!safeCompare(signature, expected)) {
      return new NextResponse(
        "Invalid signature",
        { status: 400 }
      );
    }

    // -------------------------------------------------------
    // 3. Parse event only AFTER signature verification.
    // -------------------------------------------------------

    let event: {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
          };
        };
      };
    };

    try {
      event = JSON.parse(body);
    } catch {
      return new NextResponse(
        "Invalid JSON",
        { status: 400 }
      );
    }

    const db = createAdminClient();

    // -------------------------------------------------------
    // 4. Idempotency
    //
    // Razorpay may retry a webhook.
    //
    // We store the event before processing it so the same
    // event cannot be processed twice.
    // -------------------------------------------------------

    const eventId =
      request.headers.get(
        "x-razorpay-event-id"
      ) ||
      crypto
        .createHash("sha256")
        .update(body)
        .digest("hex");

    const {
      error: alreadySeen,
    } = await db
      .from("webhook_events")
      .insert({
        provider: "razorpay",
        event_id: eventId,
        payload: event,
      });

    if (alreadySeen?.code === "23505") {
      return NextResponse.json({
        received: true,
        duplicate: true,
      });
    }

    if (alreadySeen) {
      console.error(
        "Could not record webhook event:",
        alreadySeen
      );

      return new NextResponse(
        "Could not record webhook",
        { status: 500 }
      );
    }

    // -------------------------------------------------------
    // 5. payment.captured
    //
    // IMPORTANT:
    //
    // Stock was already reserved during checkout.
    //
    // Therefore we DO NOT deduct stock here.
    //
    // We only commit the existing reservation.
    // -------------------------------------------------------

    if (
      event.event ===
      "payment.captured"
    ) {
      const payment =
        event.payload?.payment?.entity;

      const razorpayOrderId =
        payment?.order_id;

      const paymentId =
        payment?.id;

      if (
        !razorpayOrderId ||
        !paymentId
      ) {
        console.error(
          "payment.captured missing payment/order information."
        );

        return NextResponse.json({
          received: true,
        });
      }

      const { data: order } =
        await db
          .from("orders")
          .select(
            "id,payment_status"
          )
          .eq(
            "razorpay_order_id",
            razorpayOrderId
          )
          .single();

      if (!order) {
        console.error(
          "Setl order not found for Razorpay order:",
          razorpayOrderId
        );

        // Acknowledge the webhook so Razorpay
        // doesn't endlessly retry an unknown order.
        return NextResponse.json({
          received: true,
        });
      }

      // Idempotent behavior:
      // If the browser verification already committed
      // the reservation, there is nothing more to do.
      if (
        order.payment_status ===
        "paid"
      ) {
        return NextResponse.json({
          received: true,
          alreadyProcessed: true,
        });
      }

      const {
        error: commitError,
      } = await db.rpc(
        "commit_inventory_reservation",
        {
          p_order_id: order.id,
          p_payment_id: paymentId,
        }
      );

      if (commitError) {
        console.error(
          "Could not commit inventory reservation:",
          commitError
        );

        // Return 500 so Razorpay can retry the webhook.
        return new NextResponse(
          "Could not finalize payment",
          { status: 500 }
        );
      }
    }

    // -------------------------------------------------------
    // 6. payment.failed
    //
    // DO NOT immediately release stock.
    //
    // The reservation remains active until its 15-minute
    // expiry. This protects against cases where a payment
    // subsequently becomes authorized/captured.
    // -------------------------------------------------------

    if (
      event.event ===
      "payment.failed"
    ) {
      const payment =
        event.payload?.payment?.entity;

      const razorpayOrderId =
        payment?.order_id;

      if (razorpayOrderId) {
        console.log(
          "Razorpay payment failed; reservation remains active until expiry:",
          razorpayOrderId
        );
      }
    }

    // -------------------------------------------------------
    // 7. Other events
    //
    // We acknowledge them without changing the order.
    // -------------------------------------------------------

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Razorpay webhook error:",
      error
    );

    return new NextResponse(
      "Webhook processing failed",
      { status: 500 }
    );
  }
}