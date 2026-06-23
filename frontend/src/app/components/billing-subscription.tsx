import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  CreditCard, Calendar, Users, Zap, CheckCircle2, Clock,
  AlertTriangle, ArrowUpRight, RefreshCw, FileText, Crown,
  Shield, Rocket,
} from "lucide-react";
import { Button } from "./ui/button";
import api from "../api";

interface OrgData {
  id: number;
  planId: number | null;
  planStartDate: string | null;
  planExpiryDate: string | null;
  planGracePeriodEnd: string | null;
  [key: string]: any;
}

interface PlanData {
  id: number;
  planName: string;
  price: string;
  duration: string;
  employeeLimit: number;
  subscription?: string;
  isActive?: boolean;
}

interface InvoiceData {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  startDate: string;
  endDate: string;
  amount?: number | null;
  organizationInvoice_plan?: { planName: string; price: string };
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  basic: <Shield className="h-6 w-6" />,
  premium: <Zap className="h-6 w-6" />,
  advanced: <Crown className="h-6 w-6" />,
};

const PLAN_COLORS: Record<string, string> = {
  basic:    "from-[#5A4079] to-[#422462]",
  premium:  "from-[#422462] to-[#200B43]",
  advanced: "from-[#200B43] to-[#0d0621]",
};

function planTier(name: string): string {
  return name?.toLowerCase().includes("advance") ? "advanced"
    : name?.toLowerCase().includes("premium") ? "premium"
    : "basic";
}

function daysLeft(expiryDate: string | null): number {
  if (!expiryDate) return 0;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function daysTotal(startDate: string | null, expiryDate: string | null): number {
  if (!startDate || !expiryDate) return 1;
  const diff = new Date(expiryDate).getTime() - new Date(startDate).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function BillingSubscription() {
  const navigate = useNavigate();
  const [org, setOrg] = useState<OrgData | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [allPlans, setAllPlans] = useState<PlanData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("userData");
    if (!raw) { setError("Session not found. Please login again."); setLoading(false); return; }
    const user = JSON.parse(raw);
    const orgId = user?.organizationId;
    if (!orgId) { setError("Organization ID not found."); setLoading(false); return; }

    const load = async () => {
      try {
        const [orgRes, plansRes, invRes] = await Promise.all([
          api.get<OrgData>(`/api/companies/${orgId}`),
          api.get<PlanData[]>("/api/plans"),
          api.get<{ success: boolean; data: InvoiceData[] }>(`/api/organizationInvoice/${orgId}`),
        ]);

        const orgData = orgRes.data;
        setOrg(orgData);
        setInvoices(invRes.data?.data ?? []);

        const plans = plansRes.data ?? [];
        setAllPlans(plans);

        if (orgData.planId) {
          const current = plans.find((p) => p.id === orgData.planId) ?? null;
          setPlan(current);
        }
      } catch (e: any) {
        setError(e?.response?.data?.error ?? e?.message ?? "Failed to load subscription data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-[#422462]" />
          <p className="text-[#5A4079] text-sm">Loading subscription details…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const left  = daysLeft(org?.planExpiryDate ?? null);
  const total = daysTotal(org?.planStartDate ?? null, org?.planExpiryDate ?? null);
  const pct   = total > 0 ? Math.round((left / total) * 100) : 0;
  const tier  = planTier(plan?.planName ?? "");

  const isExpired      = left === 0;
  const isExpiringSoon = !isExpired && left <= 7;

  const statusBadge = isExpired
    ? { label: "Expired", color: "bg-red-100 text-red-700 border-red-200" }
    : isExpiringSoon
    ? { label: "Expiring Soon", color: "bg-amber-100 text-amber-700 border-amber-200" }
    : { label: "Active", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">

      {/* ── Current Plan Card ─────────────────────────────────── */}
      <div className={`relative rounded-2xl bg-gradient-to-br ${PLAN_COLORS[tier]} p-6 text-white overflow-hidden shadow-xl shadow-[#422462]/30`}>
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-3">
                {PLAN_ICONS[tier] ?? <CreditCard className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Current Plan</p>
                <h2 className="text-2xl font-bold">{plan?.planName ?? "No Plan"}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
              <Button
                onClick={() => navigate("/pricing")}
                className="bg-white text-[#422462] hover:bg-white/90 text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <ArrowUpRight className="h-4 w-4" />
                {isExpired ? "Renew / Upgrade" : "Upgrade Plan"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <Stat icon={<CreditCard className="h-4 w-4" />} label="Price" value={`₹${plan?.price ?? "—"}/mo`} />
            <Stat icon={<Users className="h-4 w-4" />} label="User Limit" value={`${plan?.employeeLimit ?? "—"} users`} />
            <Stat icon={<Calendar className="h-4 w-4" />} label="Started" value={fmtDate(org?.planStartDate ?? null)} />
            <Stat icon={<Clock className="h-4 w-4" />} label="Expires" value={fmtDate(org?.planExpiryDate ?? null)} />
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/80">Days remaining</span>
              <span className="font-semibold">
                {isExpired ? "Expired" : `${left} / ${total} days`}
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isExpired ? "bg-red-400" : isExpiringSoon ? "bg-amber-400" : "bg-emerald-400"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {isExpiringSoon && !isExpired && (
              <p className="text-amber-300 text-xs mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Your plan expires in {left} day{left !== 1 ? "s" : ""}. Renew now to avoid interruption.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Plan Features ─────────────────────────────────────── */}
      {plan?.subscription && (
        <div className="bg-white rounded-2xl border border-[#937CB4]/20 shadow-sm p-6">
          <h3 className="text-[#200B43] font-semibold text-base mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#422462]" />
            What's included in your plan
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {plan.subscription.split(/\n|,/).map((f, i) => f.trim() && (
              <li key={i} className="flex items-center gap-2 text-sm text-[#5A4079]">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                {f.trim()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Available Plans ───────────────────────────────────── */}
      {allPlans.length > 0 && (
        <div>
          <h3 className="text-[#200B43] font-semibold text-base mb-4 flex items-center gap-2">
            <Rocket className="h-5 w-5 text-[#422462]" />
            Available Plans
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allPlans.filter(p => p.isActive !== false).map((p) => {
              const isCurrent = p.id === plan?.id;
              const t = planTier(p.planName);
              return (
                <div
                  key={p.id}
                  className={`relative rounded-xl border-2 p-5 transition-all ${
                    isCurrent
                      ? "border-[#422462] bg-gradient-to-br from-[#F0E9FF] to-white"
                      : "border-[#937CB4]/20 bg-white hover:border-[#937CB4]/50 hover:shadow-md"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-4 bg-[#422462] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Current
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${PLAN_COLORS[t]} text-white`}>
                      {PLAN_ICONS[t]}
                    </div>
                    <div>
                      <p className="font-semibold text-[#200B43]">{p.planName}</p>
                      <p className="text-xs text-[#5A4079]">{p.duration}</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[#200B43] mb-1">
                    ₹{p.price}<span className="text-sm font-normal text-[#5A4079]">/mo</span>
                  </p>
                  <p className="text-xs text-[#5A4079] mb-4">Up to {p.employeeLimit} users</p>
                  {isCurrent ? (
                    <Button
                      onClick={() => navigate("/pricing")}
                      className="w-full bg-[#422462] text-white hover:bg-[#200B43] text-sm rounded-lg"
                    >
                      Renew
                    </Button>
                  ) : (
                    <Button
                      onClick={() => navigate("/pricing")}
                      variant="outline"
                      className="w-full border-[#422462] text-[#422462] hover:bg-[#F0E9FF] text-sm rounded-lg"
                    >
                      {p.id > (plan?.id ?? 0) ? "Upgrade" : "Switch"} →
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Invoice History ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#937CB4]/20 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#937CB4]/10 flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#422462]" />
          <h3 className="text-[#200B43] font-semibold text-base">Billing History</h3>
        </div>

        {invoices.length === 0 ? (
          <div className="px-6 py-12 text-center text-[#937CB4]">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No invoices found yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F0E9FF]/50">
                  <th className="text-left px-6 py-3 text-[#5A4079] font-semibold">Invoice #</th>
                  <th className="text-left px-6 py-3 text-[#5A4079] font-semibold">Date</th>
                  <th className="text-left px-6 py-3 text-[#5A4079] font-semibold">Plan</th>
                  <th className="text-left px-6 py-3 text-[#5A4079] font-semibold">Period</th>
                  <th className="text-left px-6 py-3 text-[#5A4079] font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#937CB4]/10">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F0E9FF]/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-[#422462] font-semibold">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 text-[#200B43]">{fmtDate(inv.invoiceDate)}</td>
                    <td className="px-6 py-4 text-[#200B43]">
                      {inv.organizationInvoice_plan?.planName ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-[#5A4079] text-xs">
                      {fmtDate(inv.startDate)} → {fmtDate(inv.endDate)}
                    </td>
                    <td className="px-6 py-4 text-[#200B43] font-semibold">
                      ₹{inv.amount ?? inv.organizationInvoice_plan?.price ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/10 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-white/70 text-xs mb-1">
        {icon}
        {label}
      </div>
      <p className="text-white font-semibold text-sm">{value}</p>
    </div>
  );
}
