import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Users,
  TrendingUp,
  Activity,
  CreditCard,
  UserCheck,
  UserX,
  Sparkles,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  IndianRupee,
  Lock,
} from "lucide-react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { orgService } from "../../services/orgService";
import { plansService } from "../../services/plansService";
import api from "../../api";

const PLAN_COLORS: Record<string, string> = {
  Free: "#937CB4",
  Basic: "#5A4079",
  Pro: "#422462",
  Enterprise: "#200B43",
};

const DEFAULT_COLOR = "#958CA7";

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    mrr: 0,
    newUsersToday: 0,
    openQueries: 0,
    lockedOrgs: 0,
  });
  const [planDistribution, setPlanDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<{ month: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [orgsRes, plansRes, invoicesRes] = await Promise.allSettled([
        orgService.getAll(),
        plansService.getAll(),
        api.get("/api/admin/org-invoices"),
      ]);

      // ── Orgs ──────────────────────────────────────────
      const orgs: any[] = orgsRes.status === "fulfilled" && Array.isArray(orgsRes.value.data?.Clients)
        ? orgsRes.value.data.Clients : [];

      const today = new Date().toISOString().substring(0, 10);
      const newUsersToday = orgs.filter(o => (o.createdAt ?? "").startsWith(today)).length;
      const lockedOrgs = orgs.filter(o => o.isLocked === true).length;

      // ── Plans price map ────────────────────────────────
      const plans: any[] = plansRes.status === "fulfilled" && Array.isArray(plansRes.value.data)
        ? plansRes.value.data : [];

      const planPriceMap: Record<string, number> = {};
      plans.forEach(p => {
        planPriceMap[p.planName] = parseFloat(p.price) || 0;
      });

      // ── Plan distribution — use the real selectedPlan field ──
      const planCounts: Record<string, number> = {};
      orgs.forEach(o => {
        const plan = o.selectedPlan ?? "Free";
        planCounts[plan] = (planCounts[plan] ?? 0) + 1;
      });

      const distribution = Object.entries(planCounts).map(([name, value]) => ({
        name,
        value,
        color: PLAN_COLORS[name] ?? DEFAULT_COLOR,
      }));
      setPlanDistribution(distribution);

      // ── Active subscriptions (paid + status Converted) ──
      const activeSubscriptions = orgs.filter(o => {
        const plan = o.selectedPlan ?? "Free";
        return plan !== "Free" && o.status === "Converted";
      }).length;

      // ── MRR from plan prices × active paid orgs ────────
      let mrr = 0;
      orgs.forEach(o => {
        if ((o.selectedPlan ?? "Free") !== "Free" && o.status === "Converted") {
          mrr += planPriceMap[o.selectedPlan] ?? 0;
        }
      });

      // ── Revenue from OrganizationInvoices ─────────────
      const invoices: any[] = invoicesRes.status === "fulfilled" && Array.isArray(invoicesRes.value.data?.data)
        ? invoicesRes.value.data.data : [];

      const totalRevenue = invoices.reduce((sum, inv) => {
        const amt = inv.amount ?? inv.organizationInvoice_plan?.price ?? 0;
        return sum + (parseFloat(String(amt)) || 0);
      }, 0);

      // Revenue trend — group by YYYY-MM from invoiceDate
      const monthlyMap: Record<string, number> = {};
      invoices.forEach(inv => {
        const month = (inv.invoiceDate ?? inv.createdAt ?? "").substring(0, 7);
        if (!month) return;
        const amt = parseFloat(String(inv.amount ?? inv.organizationInvoice_plan?.price ?? 0)) || 0;
        monthlyMap[month] = (monthlyMap[month] ?? 0) + amt;
      });

      const chartData = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, revenue]) => ({ month, revenue }));
      setRevenueChartData(chartData);

      setStats({
        totalUsers: orgs.length,
        totalRevenue,
        activeSubscriptions,
        mrr,
        newUsersToday,
        openQueries: 0,
        lockedOrgs,
      });
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load dashboard data. Check your backend connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const metricCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      gradient: "from-[#937CB4] to-[#5A4079]",
    },
    {
      label: "Total Revenue",
      value: formatINR(stats.totalRevenue),
      icon: IndianRupee,
      gradient: "from-[#5A4079] to-[#422462]",
    },
    {
      label: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: CreditCard,
      gradient: "from-[#422462] to-[#200B43]",
    },
    {
      label: "MRR (This Month)",
      value: formatINR(stats.mrr),
      icon: TrendingUp,
      gradient: "from-[#937CB4] via-[#5A4079] to-[#422462]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1 text-sm border border-red-300 px-3 py-1 rounded-lg hover:bg-red-100"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="gradient-card gradient-card-hover border-[#937CB4]/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#937CB4]/10 to-transparent rounded-full blur-2xl"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#200B43]">{card.label}</CardTitle>
                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-md`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="h-7 w-7 animate-spin text-[#937CB4]" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-[#200B43]">{card.value}</div>
                    <div className="flex items-center gap-1 mt-2">
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                      <p className="text-xs text-green-600 font-medium">Live from server</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="gradient-card border-[#937CB4]/30">
          <CardHeader>
            <CardTitle className="text-[#200B43] flex items-center gap-2">
              <Activity className="h-5 w-5" /> Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#937CB4]" />
              </div>
            ) : revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#422462" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#422462" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#937CB4" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#5A4079" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#5A4079" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #937CB4", borderRadius: "8px" }}
                    formatter={(value: any) => [formatINR(value), "Revenue"]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stroke="#422462" fillOpacity={1} fill="url(#revenueGradient)" name="Revenue (₹)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-[#5A4079]">
                <p className="text-sm">No subscription revenue recorded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="gradient-card border-[#937CB4]/30">
          <CardHeader>
            <CardTitle className="text-[#200B43] flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-[#937CB4]" />
              </div>
            ) : planDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={90}
                      dataKey="value"
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #937CB4", borderRadius: "8px" }}
                      formatter={(value: any, name: any) => [`${value} users`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                  {planDistribution.map(entry => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-sm text-[#5A4079]">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      {entry.name}: <strong>{entry.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-[#5A4079]">
                <p className="text-sm">No subscription data available yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "New Users Today", value: stats.newUsersToday, icon: UserCheck, note: "Registered today" },
          { label: "Active Subscriptions", value: stats.activeSubscriptions, icon: CreditCard, note: "Paid plans · active orgs" },
          { label: "Locked Orgs", value: stats.lockedOrgs, icon: Lock, note: "Plan expired — needs unlock" },
          { label: "MRR", value: formatINR(stats.mrr), icon: TrendingUp, note: "Monthly recurring revenue" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="gradient-card gradient-card-hover border-[#937CB4]/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[#200B43]">{s.label}</CardTitle>
                <Icon className="h-5 w-5 text-[#5A4079]" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-[#937CB4]" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-[#200B43]">{s.value}</div>
                    <p className="text-xs text-[#5A4079] mt-1">{s.note}</p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
