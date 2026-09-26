"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

/** Bottom sheet on phones, centered dialog on larger screens. */
export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`relative w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"} max-h-[92dvh] overflow-y-auto no-scrollbar rounded-t-[28px] sm:rounded-[28px] bg-card border border-line px-5 sm:px-7 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            <div className="sticky top-0 -mx-5 sm:-mx-7 px-5 sm:px-7 pt-1 pb-3 bg-card backdrop-blur z-10 flex items-center justify-between">
              <p className="text-xs font-medium text-ink-3 mt-3">{title}</p>
              <button onClick={onClose} className="mt-2 size-10 grid place-items-center rounded-full hover:bg-card-2 text-ink-2" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
