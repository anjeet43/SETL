# SETL — Campus E-Commerce Platform

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-3395FF?style=for-the-badge&logo=razorpay&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

## Live Website

**Production:** https://setl-delta.vercel.app

---

## About SETL

**SETL** is a full-stack campus e-commerce platform designed to make it easier for students to purchase hostel essentials and other daily-use products.

The platform was built as a real-world application rather than only as a prototype. It handles the complete shopping workflow, including product browsing, cart management, checkout, online payments, order creation, inventory management, order tracking, administrative operations, and a separate architecture for real-time delivery tracking.

The system is designed for a campus environment where students often need essential products immediately after arriving at their hostel.

### The problem

Students moving into hostels frequently need products such as:

- Storage and organization items
- Cleaning supplies
- Daily-use essentials
- Room accessories
- Personal-use products
- Other hostel necessities

Traditional purchasing often requires visiting multiple stores or relying on limited nearby availability.

### The solution

SETL provides a centralized online storefront where students can:

1. Browse available products.
2. Add products to their cart.
3. Review their order.
4. Make an online payment.
5. Receive an order reference.
6. Track their order status.
7. View delivery progress through the live tracking system.

The backend handles inventory validation, payment verification, order creation, and administrative operations.

---

# Key Features

## 1. Product Storefront

SETL provides a responsive product catalog where customers can:

- Browse products by category
- View product information
- Check pricing
- View available stock
- Add items to cart
- Adjust quantities
- Remove items from the cart

The storefront is designed to work across desktop and mobile devices.

---

## 2. Shopping Cart

The cart system allows users to build their order before checkout.

Users can:

- Add multiple products
- Increase or decrease quantities
- Remove individual products
- Review item prices
- Calculate the order total
- Continue shopping before payment

Cart validation is also performed before creating an order so that unavailable products cannot be purchased accidentally.

---

## 3. Secure Checkout

SETL uses **Razorpay** for online payments.

The payment workflow is handled on the server rather than trusting payment information directly from the client.

The flow is approximately:

```text
Customer
   ↓
Cart
   ↓
Checkout
   ↓
Server creates Razorpay order
   ↓
Razorpay payment
   ↓
Payment verification
   ↓      
Webhook confirmation
   ↓
Order confirmation
