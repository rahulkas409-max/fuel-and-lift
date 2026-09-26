// Client-visible feature flags (inlined at build time).

/** The ₹9 Custom Pass paywall is OFF unless NEXT_PUBLIC_ENABLE_PAYWALL=true. While off, everything is free. */
export const PAYWALL_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PAYWALL === "true";

export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ?? "";

/** No Razorpay key → the paywall offers a "Simulate ₹9 payment" button instead of real checkout. */
export const SANDBOX = !RAZORPAY_KEY_ID;

export const PRICE_PAISE = 900;
export const PASS_DAYS = 7;
