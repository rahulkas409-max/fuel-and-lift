"use client";

import { motion } from "framer-motion";

/** Large, thumb-friendly checkbox with a micro-bounce and a drawn tick. */
export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      whileTap={{ scale: 0.8 }}
      animate={checked ? { scale: [1, 1.22, 0.94, 1] } : { scale: 1 }}
      transition={{ duration: 0.35 }}
      className={`relative size-11 shrink-0 rounded-xl border-2 grid place-items-center transition-colors ${
        checked ? "bg-emerald border-emerald shadow-[0_0_20px_-2px_rgb(16_185_129/0.7)]" : "border-slate-600 bg-slate-800/60"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="#0b1120" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
        <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={false} animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }} transition={{ duration: 0.25, delay: checked ? 0.05 : 0 }} />
      </svg>
    </motion.button>
  );
}
