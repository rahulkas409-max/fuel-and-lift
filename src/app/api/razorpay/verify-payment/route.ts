import crypto from "node:crypto";

export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_ENABLE_PAYWALL !== "true") {
    return Response.json({ ok: false, error: "Payments are disabled." }, { status: 404 });
  }
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) return Response.json({ ok: false, error: "Payments are not configured." }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
  if (![orderId, paymentId, signature].every((v) => typeof v === "string" && v.length > 0 && v.length < 200)) {
    return Response.json({ ok: false, error: "Missing payment fields" }, { status: 400 });
  }

  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return Response.json({ ok: false, error: "Signature verification failed" }, { status: 400 });
  }
  // The client persists hasCustomPass in localStorage after this returns ok.
  return Response.json({ ok: true, paymentId });
}
