import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  TrendingUp,
  Download,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  BarChart2,
  IndianRupee,
  Receipt,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { invoiceService, ApiInvoice } from "../../services/revenueService";
import api from "../../api";

interface OrgInvoice {
  id: number;
  organizationId: number;
  planId: number;
  invoiceNumber: string;
  invoiceDate: string;
  startDate: string;
  endDate: string;
  amount: number;
  organizationInvoice_plan?: { planName: string; price: string; duration: string };
  [key: string]: any;
}

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function parseAmount(inv: ApiInvoice): number {
  if (inv.Total) return parseFloat(String(inv.Total).replace(/[^0-9.]/g, "")) || 0;
  if (Array.isArray(inv.amount)) return inv.amount.reduce((s: number, v: number) => s + (v || 0), 0);
  return 0;
}

export function AdminFinancials() {
  const [orgInvoices, setOrgInvoices] = useState<OrgInvoice[]>([]);
  const [clientInvoices, setClientInvoices] = useState<ApiInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("90");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [orgInvRes, clientInvRes] = await Promise.allSettled([
        api.get("/api/admin/org-invoices"),
        invoiceService.getAll(),
      ]);

      const orgInvData: OrgInvoice[] =
        orgInvRes.status === "fulfilled" && Array.isArray(orgInvRes.value.data?.data)
          ? orgInvRes.value.data.data
          : [];
      setOrgInvoices(orgInvData);

      const clientInvData: ApiInvoice[] =
        clientInvRes.status === "fulfilled" && Array.isArray(clientInvRes.value.data)
          ? clientInvRes.value.data
          : [];
      setClientInvoices(clientInvData);
    } catch (err: any) {
      console.error("Failed to fetch financial data:", err);
      setError(err?.response?.data?.message ?? "Failed to load financial data from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Date range filter ─────────────────────────────────────────────────────
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - parseInt(dateRange));
  const cutoffStr = cutoff.toISOString().substring(0, 10);

  const filteredOrgInv = orgInvoices.filter(inv => {
    const d = (inv.invoiceDate ?? inv.createdAt ?? "").substring(0, 10);
    return !d || d >= cutoffStr;
  });

  const filteredClientInv = clientInvoices.filter(inv => {
    const d = (inv.Date ?? inv.createdAt ?? "").substring(0, 10);
    return !d || d >= cutoffStr;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const subscriptionRevenue = filteredOrgInv.reduce((s, inv) => s + (inv.amount || 0), 0);
  const clientRevenue = filteredClientInv.reduce((s, inv) => s + parseAmount(inv), 0);
  const totalRevenue = subscriptionRevenue + clientRevenue;

  const paidClientInv = filteredClientInv.filter(i => (i.status ?? "").toLowerCase() === "approved");
  const pendingClientInv = filteredClientInv.filter(i => (i.status ?? "").toLowerCase() === "pending");

  const stats = [
    { label: "Total Revenue", value: formatINR(totalRevenue), gradient: "from-[#422462] to-[#5A4079]" },
    { label: "Subscription Revenue", value: formatINR(subscriptionRevenue), gradient: "from-[#5A4079] to-[#937CB4]" },
    { label: "Paid Invoices", value: paidClientInv.length, gradient: "from-[#937CB4] to-[#5A4079]" },
    { label: "Pending Invoices", value: pendingClientInv.length, gradient: "from-[#422462] to-[#937CB4]" },
  ];

  // ── Revenue chart — subscription invoices grouped by month ─────────────────
  const monthlyMap: Record<string, number> = {};
  filteredOrgInv.forEach(inv => {
    const month = (inv.invoiceDate ?? inv.createdAt ?? "").substring(0, 7);
    if (!month) return;
    monthlyMap[month] = (monthlyMap[month] ?? 0) + (inv.amount || 0);
  });
  // Also fold in client invoices
  filteredClientInv.forEach(inv => {
    const month = (inv.Date ?? inv.createdAt ?? "").substring(0, 7);
    if (!month) return;
    monthlyMap[month] = (monthlyMap[month] ?? 0) + parseAmount(inv);
  });

  const chartData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue }));

  // ── Status helpers ────────────────────────────────────────────────────────
  const getStatusIcon = (status: string) => {
    const s = (status ?? "").toLowerCase();
    if (s === "approved") return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (s === "pending") return <Clock className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusBadge = (status: string) => {
    const s = (status ?? "").toLowerCase();
    if (s === "approved") return "bg-green-500 text-white";
    if (s === "pending") return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  const getStatusBg = (status: string) => {
    const s = (status ?? "").toLowerCase();
    if (s === "approved") return "bg-green-100";
    if (s === "pending") return "bg-yellow-100";
    return "bg-red-100";
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-xl border border-[#937CB4]/20 bg-white/90 backdrop-blur-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
            <div className="relative z-10">
              <p className="text-sm text-[#5A4079] mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-[#200B43]">
                {loading ? <Loader2 className="h-6 w-6 animate-spin text-[#937CB4]" /> : stat.value}
              </h3>
            </div>
            <div className="absolute top-2 right-2">
              <Sparkles className="h-5 w-5 text-[#937CB4] opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <Button size="sm" variant="outline" className="border-red-300 hover:bg-red-100 text-red-700" onClick={fetchData}>
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <Card className="gradient-card border-[#937CB4]/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar className="h-5 w-5 text-[#422462]" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[#937CB4]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#937CB4] text-[#200B43]"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-[#937CB4]/30 hover:bg-[#F0E9FF] hover:text-[#200B43] text-[#5A4079]" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
              <Button variant="outline" className="border-[#937CB4]/30 hover:bg-[#F0E9FF] hover:text-[#200B43] text-[#5A4079]">
                <Download className="h-4 w-4 mr-2" /> Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#937CB4] mx-auto mb-3" />
            <p className="text-[#5A4079] text-sm">Loading financial data from server...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Revenue Chart */}
          <Card className="gradient-card border-[#937CB4]/30">
            <CardHeader>
              <CardTitle className="text-[#200B43] flex items-center gap-2">
                <BarChart2 className="h-5 w-5" /> Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#422462" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#422462" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#937CB4" opacity={0.2} />
                    <XAxis dataKey="month" stroke="#5A4079" tick={{ fontSize: 12 }} />
                    <YAxis
                      stroke="#5A4079"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #937CB4", borderRadius: "8px" }}
                      formatter={(value: any) => [formatINR(value), "Revenue"]}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#422462" fillOpacity={1} fill="url(#revGrad)" name="Revenue (₹)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-[#5A4079]">
                  <p className="text-sm">No revenue data in the selected period.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Billing Transactions */}
          <Card className="gradient-card border-[#937CB4]/30">
            <CardHeader>
              <CardTitle className="text-[#200B43] flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Billing ({filteredOrgInv.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredOrgInv.length === 0 ? (
                <div className="py-10 text-center text-[#5A4079]">
                  <IndianRupee className="h-10 w-10 mx-auto mb-3 text-[#937CB4]" />
                  <p className="text-sm">No subscription invoices in the selected period.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrgInv.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-[#F0E9FF] to-white border border-[#937CB4]/20 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-[#422462]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#200B43]">{inv.invoiceNumber}</p>
                          <p className="text-sm text-[#5A4079]">
                            {inv.organizationInvoice_plan?.planName ?? `Plan #${inv.planId}`}
                            {inv.organizationInvoice_plan?.duration ? ` · ${inv.organizationInvoice_plan.duration}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-center text-sm text-[#5A4079]">
                        <p>{inv.startDate?.substring(0, 10) ?? "—"}</p>
                        <p className="text-xs text-[#958CA7]">→ {inv.endDate?.substring(0, 10) ?? "—"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#200B43]">{formatINR(inv.amount ?? 0)}</p>
                        <p className="text-xs text-[#958CA7]">{inv.invoiceDate?.substring(0, 10) ?? "—"}</p>
                      </div>
                      <Badge className="bg-green-500 text-white">Paid</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Invoice Transactions */}
          <Card className="gradient-card border-[#937CB4]/30">
            <CardHeader>
              <CardTitle className="text-[#200B43] flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Recent Transactions ({filteredClientInv.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredClientInv.length === 0 ? (
                <div className="py-10 text-center text-[#5A4079]">
                  <Receipt className="h-10 w-10 mx-auto mb-3 text-[#937CB4]" />
                  <p className="text-sm">No transactions in the selected period.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredClientInv.slice(0, 20).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-[#F0E9FF] to-white border border-[#937CB4]/20 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusBg(inv.status ?? "")}`}>
                          {getStatusIcon(inv.status ?? "")}
                        </div>
                        <div>
                          <p className="font-medium text-[#200B43]">{inv.invoiceId ?? String(inv.id)}</p>
                          <p className="text-sm text-[#5A4079]">{inv.clientName ?? inv.billTo ?? "—"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#200B43]">{formatINR(parseAmount(inv))}</p>
                        <p className="text-xs text-[#5A4079]">{inv.invoiceType ?? inv.base?.[0] ?? "—"}</p>
                      </div>
                      <div className="text-right text-sm text-[#5A4079]">
                        <p>{inv.currency ?? "INR"}</p>
                        <p className="text-xs text-[#958CA7]">{inv.Date ? inv.Date.substring(0, 10) : inv.createdAt?.substring(0, 10) ?? "—"}</p>
                      </div>
                      <Badge className={getStatusBadge(inv.status ?? "")}>{inv.status ?? "unknown"}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
