import { Check, Loader2 } from "lucide-react";

export type PlanTier = "basic" | "premium" | "advanced";
export type BillingCycle = "quarterly" | "halfYearly" | "annually";

export const CYCLE_LABEL: Record<BillingCycle, string> = {
  quarterly: "Quarterly",
  halfYearly: "Half Yearly",
  annually: "Annually",
};

// Each cycle uses a different per-period base price (set in pricing-page.tsx).
// The multiplier here converts that base price into the billing total:
//   - Quarterly   = base × 3  (3 monthly payments)
//   - Half Yearly = base × 2  (2 half-yearly periods, base is per-period price)
//   - Annually    = base × 1  (single annual payment, base IS the annual price)
export const CYCLE_MULTIPLIER: Record<BillingCycle, number> = {
  quarterly: 3,
  halfYearly: 2,
  annually: 1,
};

interface PlanCardProps {
  tier: PlanTier;
  name: string;
  tagline: string;
  monthlyBase: number;
  cycle: BillingCycle;
  userLimit: number;
  features: string[];
  popular?: boolean;
  loading?: boolean;
  buyNowLoading?: boolean;
  isLoggedIn?: boolean;
  onStartTrial: () => void;
  onBuyNow?: () => void;
}

const popularGradient = "linear-gradient(180deg, #2a1450 0%, #4a2e7a 100%)";

export function PlanCard({
  tier,
  name,
  tagline,
  monthlyBase,
  cycle,
  userLimit,
  features,
  popular,
  loading,
  buyNowLoading,
  isLoggedIn,
  onStartTrial,
  onBuyNow,
}: PlanCardProps) {
  const isPopular = !!popular;
  const cycleLabel = CYCLE_LABEL[cycle];
  const cycleTotal = Math.round(monthlyBase * CYCLE_MULTIPLIER[cycle]);
  const cycleTotalDisplay = cycleTotal.toLocaleString("en-IN");

  // Theme tokens. The Popular card is dark by default; the others are light.
  const shell = isPopular
    ? "bg-[#1f0d3d] text-white border border-[#3a1f6a] shadow-2xl shadow-[#1f0d3d]/30"
    : "bg-white text-[#200B43] border border-[#E5DEF2] shadow-md shadow-[#937CB4]/10";

  const subText = isPopular ? "text-[#d8c7f0]" : "text-[#5A4079]";
  const taglineColor = isPopular ? "text-[#b89be0]" : "text-[#7A5FA8]";
  const hrClass = isPopular ? "border-white/10" : "border-[#EDE4F8]";
  const featureIcon = isPopular ? "bg-white/15 text-white" : "bg-[#F0E9FF] text-[#422462]";

  return (
    <div className="relative h-full">
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="px-5 py-1.5 rounded-full bg-gradient-to-r from-[#FF8A3D] to-[#FF6B2B] text-white text-[11px] font-bold tracking-widest shadow-lg shadow-orange-500/30">
            MOST POPULAR
          </div>
        </div>
      )}

      <div
        className={`relative flex flex-col h-full rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${shell}`}
        style={isPopular ? { background: popularGradient } : undefined}
      >
        {/* Plan name + tagline */}
        <div>
          <h3 className={`text-xl font-bold ${isPopular ? "text-white" : "text-[#200B43]"}`}>
            {name}
          </h3>
          <p className={`text-xs mt-1 ${taglineColor}`}>{tagline}</p>
        </div>

        {/* Price — monthly base */}
        <div className="mt-6 flex items-baseline gap-1 flex-wrap">
          <span className={`text-sm font-medium ${subText}`}>₹</span>
          <span className={`text-5xl font-extrabold tracking-tight ${isPopular ? "text-white" : "text-[#200B43]"}`}>
            {monthlyBase.toLocaleString("en-IN")}
          </span>
          <span className={`text-sm ml-1 ${subText}`}>/month</span>
        </div>

        {/* Primary CTA */}
        {isLoggedIn ? (
          /* Logged-in user: single "Select Plan" button */
          <button
            type="button"
            onClick={onBuyNow}
            disabled={buyNowLoading}
            className={`mt-6 w-full py-3 rounded-xl text-sm font-semibold flex flex-col items-center justify-center gap-0.5 transition-all
              ${isPopular
                ? "bg-white text-[#1f0d3d] hover:bg-[#F0E9FF] shadow-lg shadow-black/20"
                : "bg-[#1f0d3d] text-white hover:bg-[#2a1450] shadow-md shadow-[#1f0d3d]/30"}
              disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {buyNowLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="font-semibold">Select Plan</span>
            )}
            {!buyNowLoading && (
              <span className={`text-xs font-normal ${isPopular ? "text-[#5A4079]" : "text-white/75"}`}>
                ₹ {cycleTotalDisplay} ({cycleLabel})
              </span>
            )}
          </button>
        ) : (
          /* New signup: Trial + Buy Now */
          <button
            type="button"
            onClick={onStartTrial}
            disabled={loading}
            className={`mt-6 w-full py-3 rounded-xl text-sm font-semibold flex flex-col items-center justify-center gap-0.5 transition-all
              ${isPopular
                ? "bg-white text-[#1f0d3d] hover:bg-[#F0E9FF] shadow-lg shadow-black/20"
                : "bg-[#1f0d3d] text-white hover:bg-[#2a1450] shadow-md shadow-[#1f0d3d]/30"}
              disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="font-semibold">Start Free Trial</span>
            )}
            {!loading && (
              <span className={`text-xs font-normal ${isPopular ? "text-[#5A4079]" : "text-white/75"}`}>
                ₹ {cycleTotalDisplay} ({cycleLabel})
              </span>
            )}
          </button>
        )}

        {/* Feature list */}
        <ul className={`mt-6 pt-5 border-t space-y-2.5 flex-1 ${hrClass}`}>
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${featureIcon}`}>
                <Check className="h-3 w-3" strokeWidth={3.5} />
              </span>
              <span className={`text-sm leading-snug ${isPopular ? "text-white" : "text-[#3A2C5A]"}`}>
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* Buy Now — only shown for new signups */}
        {!isLoggedIn && (
          <button
            type="button"
            onClick={onBuyNow}
            disabled={buyNowLoading}
            className={`mt-6 w-full py-3 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-2
              ${isPopular
                ? "border-white/30 text-white hover:bg-white/10"
                : "border-[#1f0d3d] text-[#1f0d3d] hover:bg-[#F0E9FF]"}
              disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {buyNowLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy Now"}
          </button>
        )}
      </div>
    </div>
  );
}
