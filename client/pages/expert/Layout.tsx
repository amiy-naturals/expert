import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ExpertProvider, useExpertCtx } from "./context";
import { DISCOUNT_THRESHOLDS } from "@/lib/expert";

const STEPS = [
  { to: "/expert", label: "Add Products" },
  { to: "/expert/subscription", label: "Subscription" },
  { to: "/expert/account", label: "Account" },
  { to: "/expert/review", label: "Review" },
];

function Stepper() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totals, subscription, account } = useExpertCtx();

  const currentIndex = STEPS.findIndex((s) => s.to === location.pathname);

  function canNavigateTo(index: number) {
    if (index <= currentIndex) return true; // backward always allowed
    // forward only if previous step(s) completed
    if (index === 1) return totals.subtotal >= 1000; // subscription requires cart min
    if (index === 2) return Boolean(subscription.nextDate); // account requires subscription scheduled
    if (index === 3) {
      return Boolean(
        account.firstName &&
          account.lastName &&
          account.email &&
          account.agreeTerms,
      );
    }
    return false;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
        Amiy Expert Sign Up
      </div>
      <div className="grid grid-cols-4 gap-3 text-center text-xs sm:text-sm">
        {STEPS.map((s, idx) => {
          const isActive = location.pathname === s.to;
          const allowed = canNavigateTo(idx);
          const base = `border px-3 py-2`;
          const className = isActive
            ? `${base} bg-primary text-primary-foreground`
            : allowed
            ? `${base} bg-card cursor-pointer`
            : `${base} bg-muted/40 cursor-not-allowed opacity-70`;

          return (
            <button
              key={s.to}
              aria-current={isActive ? "step" : undefined}
              className={className}
              onClick={() => {
                if (!allowed) return;
                navigate(s.to);
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-center text-xs text-muted-foreground">
        Discounts: {DISCOUNT_THRESHOLDS.map((t) => `${t.pct}% @ ₹${t.at}`).join(" · ")}
      </div>
    </div>
  );
}

function Guard() {
  const { totals, subscription, account } = useExpertCtx();
  const location = useLocation();
  const navigate = useNavigate();

  function allowedHighestIndex() {
    let idx = 0;
    if (totals.subtotal >= 1000) idx = 1;
    if (subscription.nextDate) idx = 2;
    if (
      account.firstName &&
      account.lastName &&
      account.email &&
      account.agreeTerms
    )
      idx = 3;
    return idx;
  }

  const allowed = allowedHighestIndex();
  const activeIndex = STEPS.findIndex((s) => s.to === location.pathname);

  // if user is on a step ahead of allowed, redirect back to allowed
  if (activeIndex > allowed) {
    navigate(STEPS[allowed].to, { replace: true });
  }
  return null;
}

export default function ExpertLayout() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      try {
        const { ExpertAPI } = await import("@/lib/api");
        const me = await ExpertAPI.me();
        if (me.onboarded) navigate('/dashboard', { replace: true });
      } catch {}
    })();
  }, [navigate]);
  return (
    <ExpertProvider>
      <Stepper />
      <Guard />
      <Outlet />
    </ExpertProvider>
  );
}
