import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { Loader2, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { PlanCard, PlanTier, BillingCycle, CYCLE_LABEL } from "./plan-card";
import { plansService, ApiPlan } from "../services/plansService";
import api from "../api";

// Exact feature lists from the design reference. Order matters: the first
// item of Premium and Advanced is "Everything in <previous>". These are also
// the strings shown on the cards; the backend gating is a follow-up.
const FEATURES: Record<PlanTier, string[]> = {
  basic: [
    "Dashboard Analytics",
    "Business Development",
    "Project Management",
    "Finance",
    "HR",
    "Notes",
    "Up to 30 Users",
  ],
  premium: [
    "Everything in Basic Plan",
    "Lead Generation",
    "Chat Management",
    "Priority Support",
    "Marketing",
    "Up to 60 Users",
    "Form Integrations",
  ],
  advanced: [
    "Everything in Premium Plan",
    "Custom Form Integrations",
    "Multi Document Selection",
    "Your Website Integration Support",
    "Dedicated Support",
    "Training & Learning",
    "Up to 100 Users",
  ],
};

const USER_LIMITS: Record<PlanTier, number> = { basic: 30, premium: 60, advanced: 100 };

// Per-cycle base prices (from the design reference).
// Quarterly base comes from the DB; the other two cycles use these fixed amounts.
// Multipliers in plan-card.tsx convert each base into the billing total:
//   quarterly ×3, halfYearly ×2, annually ×1
const CYCLE_PRICES: Record<BillingCycle, Record<PlanTier, number>> = {
  quarterly:  { basic: 3500,  premium: 5000,  advanced: 7500  },
  halfYearly: { basic: 7500,  premium: 8000,  advanced: 13000 },
  annually:   { basic: 10500, premium: 15000, advanced: 25000 },
};

const TIER_ORDER: PlanTier[] = ["basic", "premium", "advanced"];
const TIER_NAME: Record<PlanTier, string> = { basic: "Basic", premium: "Premium", advanced: "Advanced" };
const TIER_TAGLINE: Record<PlanTier, string> = {
  basic: "Perfect for small teams",
  premium: "For growing businesses",
  advanced: "For scaling organizations",
};

interface PendingSignup {
  signupToken: string;
  signupId: number;
  email: string;
  password: string;
}

interface LoggedInOrg {
  organizationId: number;
  email: string;
}

function getPendingSignup(): PendingSignup | null {
  try {
    const raw = sessionStorage.getItem("signupPending");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.signupToken && parsed.password) return parsed;
  } catch {}
  return null;
}

function getLoggedInOrg(): LoggedInOrg | null {
  try {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    const raw = sessionStorage.getItem("userData") || localStorage.getItem("userData");
    if (!token || !raw) return null;
    const user = JSON.parse(raw);
    if (user?.organizationId) return { organizationId: user.organizationId, email: user.email || "" };
  } catch {}
  return null;
}

export function PricingPage() {
  const navigate = useNavigate();
  const pending = getPendingSignup();
  const loggedInOrg = getLoggedInOrg();
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialLoadingTier, setTrialLoadingTier] = useState<PlanTier | null>(null);
  const [toast, setToast] = useState<{ kind: "info" | "error"; message: string } | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("quarterly");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await plansService.getActivePublic();
        if (!alive) return;
        const data = (res.data as any)?.data || (res.data as any) || [];
        setPlans(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.response?.data?.message || "Failed to load plans.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  // Redirect to signup only when neither a pending signup nor a logged-in org exists.
  if (!pending && !loggedInOrg) {
    return <Navigate to="/signup" replace />;
  }

  // Build the three card slots. If the API has no plans, fall back to the
  // design prices — we still want the user to be able to click "Start Trial"
  // and the trial endpoint doesn't need a price, only a planId. When there
  // are no plans at all, the trial click is disabled.
  const cards = useMemo(() => {
    return TIER_ORDER.map((tier, idx) => {
      const plan = plans[idx]; // idx is the card slot: 0=Basic, 1=Premium, 2=Advanced
      // Quarterly uses the DB price (admin-controlled); other cycles use design constants.
      const price = cycle === "quarterly"
        ? (plan ? parseFloat(String(plan.price ?? 0)) || CYCLE_PRICES.quarterly[tier] : CYCLE_PRICES.quarterly[tier])
        : CYCLE_PRICES[cycle][tier];
      return {
        tier,
        name: TIER_NAME[tier],
        tagline: TIER_TAGLINE[tier],
        price,
        userLimit: USER_LIMITS[tier],
        features: FEATURES[tier],
        popular: tier === "premium",
        planId: plan?.id,
        hasPlan: !!plan,
      };
    });
  }, [plans, cycle]);

  const handleStartTrial = async (tier: PlanTier) => {
    const slot = cards.find((c) => c.tier === tier);
    if (!slot?.hasPlan || !slot.planId) {
      setToast({
        kind: "error",
        message: "This plan is not available right now. Please contact support.",
      });
      return;
    }
    try {
      setTrialLoadingTier(tier);
      const res = await api.post("/api/signup/start-trial", {
        signupToken: pending.signupToken,
        planId: slot.planId,
        password: pending.password,
        subscription: CYCLE_LABEL[cycle],
      });
      const data = (res.data as any) || {};
      if (!data.token) {
        setToast({ kind: "error", message: data.message || "Could not start trial." });
        return;
      }
      // Mirror login.tsx and api.ts interceptor — store in both storages.
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("userData", JSON.stringify(data.user || {}));
      sessionStorage.setItem("userType", "organization");
      sessionStorage.setItem("isAuthenticated", "true");
      try {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userData", JSON.stringify(data.user || {}));
      } catch {}

      sessionStorage.removeItem("signupPending");

      window.location.href = "/app/dashboard";
    } catch (e: any) {
      setToast({ kind: "error", message: e?.response?.data?.message || "Failed to start trial." });
    } finally {
      setTrialLoadingTier(null);
    }
  };

  const [buyNowLoading, setBuyNowLoading] = useState<PlanTier | null>(null);

  const handleBuyNow = async (tier: PlanTier) => {
    const slot = cards.find((c) => c.tier === tier);
    if (!slot?.hasPlan || !slot.planId) {
      setToast({ kind: "error", message: "This plan is not available right now. Please contact support." });
      return;
    }
    const cycleMultiplier = { quarterly: 3, halfYearly: 2, annually: 1 };
    const totalAmount = slot.price * cycleMultiplier[cycle];

    // Logged-in user: renewal/upgrade flow
    if (loggedInOrg) {
      const transactionId = `TXNID-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        setBuyNowLoading(tier);
        const res = await api.post("/api/payment", {
          transactionId,
          planId: { id: slot.planId },
          organizationId: loggedInOrg.organizationId,
          amount: totalAmount,
          billingCycle: cycle,
          name: loggedInOrg.email,
          number: "",
        });
        const redirectUrl = (res.data as any)?.route;
        if (!redirectUrl) { setToast({ kind: "error", message: "Failed to initiate payment." }); return; }
        window.location.href = redirectUrl;
      } catch (e: any) {
        setToast({ kind: "error", message: e?.response?.data?.message || "Payment initiation failed." });
      } finally {
        setBuyNowLoading(null);
      }
      return;
    }

    // New signup: use the signup payment flow
    if (!pending) return;
    try {
      setBuyNowLoading(tier);
      const res = await api.post("/api/payment/signup", {
        signupToken: pending.signupToken,
        planId: slot.planId,
        amount: totalAmount,
        billingCycle: cycle,
        name: pending.email,
        phone: "",
      });
      const redirectUrl = (res.data as any)?.redirectUrl;
      if (!redirectUrl) {
        setToast({ kind: "error", message: "Failed to initiate payment." });
        return;
      }
      window.location.href = redirectUrl;
    } catch (e: any) {
      setToast({ kind: "error", message: e?.response?.data?.message || "Payment initiation failed." });
    } finally {
      setBuyNowLoading(null);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#FAF6FF] via-white to-[#F2E8FF]">
      {/* Background: scattered small purple dots (matches the reference). */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* faint grid lines */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(#C7B4E4 1px, transparent 1px), linear-gradient(90deg, #C7B4E4 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />
        {/* scattered dots */}
        {[
          { top: "8%", left: "12%", size: 8 },
          { top: "14%", left: "78%", size: 10 },
          { top: "22%", left: "32%", size: 6 },
          { top: "30%", left: "88%", size: 8 },
          { top: "44%", left: "8%", size: 10 },
          { top: "52%", left: "62%", size: 7 },
          { top: "64%", left: "26%", size: 9 },
          { top: "72%", left: "82%", size: 6 },
          { top: "82%", left: "16%", size: 8 },
          { top: "88%", left: "70%", size: 10 },
          { top: "36%", left: "48%", size: 5 },
          { top: "60%", left: "44%", size: 6 },
        ].map((d, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[#937CB4]/40"
            style={{ top: d.top, left: d.left, width: d.size, height: d.size }}
          />
        ))}
        {/* a few lighter halos for depth */}
        <div className="absolute top-10 left-1/3 w-[420px] h-[420px] bg-[#C7B4E4]/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-[480px] h-[480px] bg-[#937CB4]/25 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="Oraddo" className="h-8 w-8 object-contain" />
            <span className="text-sm font-semibold text-[#200B43]">Oraddo AI</span>
          </div>
          {loggedInOrg && (
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-[#422462] hover:underline flex items-center gap-1"
            >
              ← Back
            </button>
          )}
        </div>

        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#200B43] mb-3">
            Choose the plan that fits your business
          </h1>
          <p className="text-[#5A4079] text-base">
            All plans include a 7-day free trial. No credit card required to start.
          </p>
        </div>

        {/* Billing-cycle toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center p-1 rounded-full bg-white border border-[#E5DEF2] shadow-sm">
            {(["quarterly", "halfYearly", "annually"] as BillingCycle[]).map((c) => {
              const active = c === cycle;
              const hint =
                c === "halfYearly"
                  ? "1 month free"
                  : c === "annually"
                  ? "2 months free"
                  : null;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  className={`group relative px-5 py-2 rounded-full text-sm font-semibold transition-colors min-h-[44px] ${
                    active ? "text-white" : "text-[#5A4079] hover:text-[#200B43]"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-full bg-[#1f0d3d] shadow-md" />
                  )}
                  <span className="relative flex flex-col items-center leading-tight">
                    <span>{CYCLE_LABEL[c]}</span>
                    <span
                      aria-hidden={!hint}
                      className={`text-[10px] font-medium mt-0.5 h-3.5 leading-[14px] ${
                        hint ? (active ? "text-white/80" : "text-[#7A5FA8]") : "invisible"
                      }`}
                    >
                      {hint ?? " "}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards grid — popular card scales up slightly and sits forward */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-[#937CB4] mb-3" />
            <p className="text-[#5A4079] text-sm">Loading plans...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="border-[#937CB4]/30 text-[#422462]">
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 items-stretch">
            {cards.map((c) => (
              <div
                key={c.tier}
                className={c.popular ? "md:scale-[1.04] md:-translate-y-2 z-[1]" : "z-0"}
              >
                <PlanCard
                  tier={c.tier}
                  name={c.name}
                  tagline={c.tagline}
                  monthlyBase={c.price}
                  cycle={cycle}
                  userLimit={c.userLimit}
                  features={c.features}
                  popular={c.popular}
                  loading={trialLoadingTier === c.tier}
                  buyNowLoading={buyNowLoading === c.tier}
                  isLoggedIn={!!loggedInOrg}
                  onStartTrial={() => handleStartTrial(c.tier)}
                  onBuyNow={() => handleBuyNow(c.tier)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Footer trust row */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm text-[#5A4079]">
          <span className="inline-flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#422462]" /> Secure signup
          </span>
          <span>•</span>
          <span>Cancel anytime</span>
          <span>•</span>
          <span>No credit card for the 7-day trial</span>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div
            className={`px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium ${
              toast.kind === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-white border-[#937CB4]/30 text-[#200B43]"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
