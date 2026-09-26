"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { PAYWALL_ENABLED } from "@/lib/config";
import { useStore } from "@/lib/store";
import { PaywallModal } from "./PaywallModal";

interface Paywall {
  /** Runs `action` immediately if the user has access, otherwise opens the ₹9 modal first. */
  requirePass: (action: () => void) => void;
  hasPass: boolean;
}

const Ctx = createContext<Paywall | null>(null);
export const usePaywall = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePaywall must be used inside <PaywallProvider>");
  return c;
};

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const passUntil = useStore((s) => s.customPassUntil);
  const [open, setOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null);
  const [now] = useState(() => Date.now());
  const hasPass = !PAYWALL_ENABLED || passUntil > now;

  const requirePass = useCallback(
    (action: () => void) => {
      if (!PAYWALL_ENABLED || useStore.getState().customPassUntil > Date.now()) return action();
      pending.current = action;
      setOpen(true);
    },
    [],
  );

  return (
    <Ctx.Provider value={{ requirePass, hasPass }}>
      {children}
      {PAYWALL_ENABLED && (
        <PaywallModal
          open={open}
          onClose={() => {
            pending.current = null;
            setOpen(false);
          }}
          onUnlocked={() => {
            setOpen(false);
            pending.current?.();
            pending.current = null;
          }}
        />
      )}
    </Ctx.Provider>
  );
}
