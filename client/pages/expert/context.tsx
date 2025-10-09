import React, { createContext, useContext, useMemo, useState } from "react";
import type { ExpertState, CartItem } from "@/lib/expert";
import { DEFAULT_STATE, calcCart, saveState, loadState } from "@/lib/expert";

export type ExpertContextType = ExpertState & {
  setCart: (updater: (prev: CartItem[]) => CartItem[]) => void;
  setSubscription: (update: Partial<ExpertState["subscription"]>) => void;
  setAccount: (update: Partial<ExpertState["account"]>) => void;
  reset: () => void;
  totals: ReturnType<typeof calcCart>;
};

const ExpertContext = createContext<ExpertContextType | null>(null);

export function ExpertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ExpertState>(() => loadState());

  const totals = useMemo(() => calcCart(state.cart), [state.cart]);

  const value: ExpertContextType = {
    ...state,
    totals,
    setCart: (updater) => {
      setState((prev) => {
        const next = { ...prev, cart: updater(prev.cart) };
        saveState(next);
        return next;
      });
    },
    setSubscription: (update) => {
      setState((prev) => {
        const next = { ...prev, subscription: { ...prev.subscription, ...update } };
        saveState(next);
        return next;
      });
    },
    setAccount: (update) => {
      setState((prev) => {
        const next = { ...prev, account: { ...prev.account, ...update } };
        saveState(next);
        return next;
      });
    },
    reset: () => {
      setState(DEFAULT_STATE);
      saveState(DEFAULT_STATE);
    },
  };

  return <ExpertContext.Provider value={value}>{children}</ExpertContext.Provider>;
}

export function useExpertCtx() {
  const ctx = useContext(ExpertContext);
  if (!ctx) throw new Error("useExpert must be used within ExpertProvider");
  return ctx;
}
