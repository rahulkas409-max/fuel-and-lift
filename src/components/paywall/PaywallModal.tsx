"use client";

import { Check, Dumbbell } from "lucide-react";
import { celebrate } from "@/lib/confetti";
import { SANDBOX } from "@/lib/config";
import { play } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { Sheet } from "../ui/Sheet";
import { RazorpayButton } from "./RazorpayButton";

const PERKS = [
  "Custom Builder: add and swap exercises, change sets and reps, reorder days",
  "Smart Auto-Sync: meal plans rebuilt around each day's training load",
  "Heavy days get +300 kcal and more carbs; rest days are lean and protein-first",
];

export function PaywallModal({ open, onClose, onUnlocked }: { open: boolean; onClose: () => void; onUnlocked: () => void }) {
  const grantPass = useStore((s) => s.grantPass);
  return (
    <Sheet open={open} onClose={onClose} title="Custom Pass">
      <div className="size-12 rounded-2xl bg-fit-blue-soft text-fit-blue grid place-items-center">
        <Dumbbell />
      </div>
      <h2 className="font-display text-2xl leading-tight mt-4">
        Unlock the Custom Routine Builder and Auto-Synced Meal Engine for just <span className="text-fit-yellow">₹9</span>.
      </h2>
      <p className="text-ink-2 text-sm mt-2">One payment, 7 days of access. No auto-renewal.</p>
      <ul className="mt-5 space-y-3">
        {PERKS.map((p) => (
          <li key={p} className="flex gap-3 text-sm text-ink">
            <span className="mt-0.5 size-5 shrink-0 rounded-full bg-fit-blue-soft text-fit-blue grid place-items-center">
              <Check size={12} strokeWidth={3} />
            </span>
            {p}
          </li>
        ))}
      </ul>
      {SANDBOX && (
        <p className="mt-5 rounded-xl border border-fit-yellow/40 bg-fit-yellow-soft p-3 text-xs text-fit-yellow">
          Sandbox Mode: no Razorpay key found, so this payment is simulated and free.
        </p>
      )}
      <div className="mt-6">
        <RazorpayButton
          onPaid={() => {
            grantPass();
            play("win");
            celebrate();
            onUnlocked();
          }}
        />
      </div>
    </Sheet>
  );
}
