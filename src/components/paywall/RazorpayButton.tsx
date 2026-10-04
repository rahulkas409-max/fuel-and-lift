"use client";

import { Loader2, Sparkles, FlaskConical } from "lucide-react";
import { useState } from "react";
import { SANDBOX } from "@/lib/config";

declare global {
  interface Window {
    Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
  }
}

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Real Razorpay checkout, or a simulated payment when no key is configured. */
export function RazorpayButton({ onPaid }: { onPaid: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pay = async () => {
    setError("");
    setBusy(true);
    try {
      if (SANDBOX) {
        await new Promise((r) => setTimeout(r, 1200));
        return onPaid();
      }
      const res = await fetch("/api/razorpay/create-order", { method: "POST" });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error || "Could not create order");
      if (!(await loadCheckout()) || !window.Razorpay) throw new Error("Could not load Razorpay Checkout.");

      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: "Fuel & Lift",
        description: "Custom Pass · 7 days",
        theme: { color: "#1a73e8" },
        handler: async (resp: Record<string, string>) => {
          const v = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          }).then((r) => r.json());
          if (v.ok) onPaid();
          else setError(v.error || "Payment could not be verified.");
          setBusy(false);
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.on("payment.failed", (r) => {
        setError((r as { error?: { description?: string } }).error?.description || "Payment failed. No money was taken.");
        setBusy(false);
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        onClick={pay}
        disabled={busy}
        className="w-full h-14 rounded-2xl bg-fit-blue text-on-accent font-semibold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-70"
      >
        {busy ? <Loader2 className="animate-spin" size={20} /> : SANDBOX ? <FlaskConical size={20} /> : <Sparkles size={20} />}
        {busy ? "Processing…" : SANDBOX ? "Simulate ₹9 Payment (Sandbox Mode)" : "Pay ₹9 with Razorpay"}
      </button>
      {error && <p className="text-sm text-fit-red mt-3" role="alert">{error}</p>}
    </div>
  );
}
