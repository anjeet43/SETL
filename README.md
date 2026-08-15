# Setl

Setl is a production-shaped student-commerce platform for IIIT Manipur freshers. It replaces the browser-only prototype with a Next.js app backed by Supabase and Razorpay test mode.

## What is implemented

- Database-driven storefront that starts with zero products.
- Original mobile-first Setl UI, fresher welcome, and Build Your Room discovery.
- Passwordless Supabase manager login and role-gated `/admin` catalog manager.
- Product publishing, draft/hide states, price, stock, SKU, badge, category, and description.
- Server-side order creation, price and stock validation, Razorpay order generation, signed webhook handling, and atomic inventory decrement.
- Supabase SQL schema with RLS foundation, orders, bundles, inventory history, and idempotent webhook records.

## Run locally

1. Install Node.js 20 or later.
2. In Supabase, create a project. Open **SQL Editor**, paste and run [`supabase/schema.sql`](./supabase/schema.sql).
3. In **Authentication → Providers**, enable Email. Create a user for yourself, then run this in SQL Editor (replace the email):

   `update public.profiles set role = 'super_admin' where id = (select id from auth.users where email = 'you@example.com');`

4. Create a private `product-images` Storage bucket. Add an admin-only upload policy before using image uploads.
5. Copy `.env.example` to `.env.local` and fill each value from Supabase and Razorpay **Test Mode**. Never commit this file.
6. Run `npm install`, then `npm run dev`, and open http://localhost:3000.

## Razorpay test setup

Create a Test Mode key pair in Razorpay Dashboard → Account & Settings → API Keys. Add the key ID and secret only to `.env.local`. Create a webhook pointing to `https://YOUR_DOMAIN/api/webhooks/razorpay`, select `payment.captured` and `payment.failed`, then place its secret in `RAZORPAY_WEBHOOK_SECRET`.

The checkout endpoint intentionally refuses to claim that money was paid. An order becomes paid only after Razorpay sends a valid signed `payment.captured` webhook.

## Before public launch

- Add a client-side Razorpay Checkout handler that uses the response from `/api/checkout`; its completion screen must still wait for the webhook/order status.
- Add product image upload UI, product variants, CMS homepage sections, coupon rules, reviews, and customer account pages. The schema is designed so these can be added without moving the source of truth back into browser storage.
- Set Vercel environment variables, point Razorpay’s webhook to the production URL, test all payment failure/cancellation paths, and audit the Storage upload policy.
