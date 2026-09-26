import Razorpay from "razorpay";

const PRICE_PAISE = 900;

export async function POST() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (process.env.NEXT_PUBLIC_ENABLE_PAYWALL !== "true") {
    return Response.json({ error: "Payments are disabled — Fuel & Lift is free right now." }, { status: 404 });
  }
  if (!keyId || !secret) return Response.json({ error: "Razorpay keys are not configured (sandbox mode)." }, { status: 503 });

  try {
    const rzp = new Razorpay({ key_id: keyId, key_secret: secret });
    const order = await rzp.orders.create({
      amount: PRICE_PAISE,
      currency: "INR",
      receipt: `fl_${Date.now()}`,
      notes: { product: "Fuel & Lift Custom Pass (7 days)" },
    });
    return Response.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId });
  } catch (err) {
    console.error("[razorpay] create-order failed", err);
    return Response.json({ error: "Could not start checkout. Please try again." }, { status: 502 });
  }
}
