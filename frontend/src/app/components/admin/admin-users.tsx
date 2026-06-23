import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Modal } from "../ui/modal";
import {
  Users,
  Search,
  Edit,
  Ban,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Download,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  Building2,
  Lock,
  Unlock,
} from "lucide-react";
import { orgService, ApiOrg } from "../../services/orgService";
import { plansService } from "../../services/plansService";

interface PlanOption {
  id: number;
  planName: string;
  price: string;
  duration: string;
  isActive: boolean;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  plan: string;
  status: "active" | "inactive" | "suspended" | "Converted" | "Dead" | "Processing";
  joinDate: string;
  lastActive: string;
  mrr: number;
  company?: string;
  isLocked: boolean;
  organizationId?: number;
  planExpiryDate?: string;
  planGracePeriodEnd?: string;
}

const mapStatusToUI = (status?: string): User["status"] => {
  if (status === "Converted") return "active";
  if (status === "Dead") return "suspended";
  if (status === "Processing") return "inactive";
  return (status as User["status"]) || "active";
};

const mapStatusToDB = (status: string): string => {
  if (status === "active") return "Converted";
  if (status === "suspended") return "Dead";
  if (status === "inactive") return "Processing";
  return status;
};

function mapOrgToUser(org: ApiOrg, planPriceMap: Record<string, number>): User {
  return {
    id: org.id,
    name: org.fullName ?? org.companyName ?? org.email ?? "Unknown",
    email: org.email ?? "",
    phone: org.phoneNumber ?? "",
    plan: org.selectedPlan ?? "Free",
    status: mapStatusToUI(org.status),
    joinDate: org.createdAt ? org.createdAt.substring(0, 10) : "—",
    lastActive: org.updatedAt ? org.updatedAt.substring(0, 10) : "—",
    mrr: planPriceMap[org.selectedPlan ?? "Free"] ?? 0,
    company: org.companyName ?? undefined,
    isLocked: org.isLocked ?? false,
    organizationId: org.organizationId,
    planExpiryDate: org.planExpiryDate,
    planGracePeriodEnd: org.planGracePeriodEnd,
  };
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [changingPlanUser, setChangingPlanUser] = useState<User | null>(null);
  const [newPlan, setNewPlan] = useState<string>("");

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    plan: "Free",
    status: "active" as User["status"]
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const [orgsRes, plansRes] = await Promise.allSettled([
        orgService.getAll(),
        plansService.getAll(),
      ]);

      const planPriceMap: Record<string, number> = {};
      let fetchedPlans: PlanOption[] = [];
      if (plansRes.status === "fulfilled" && Array.isArray(plansRes.value.data)) {
        fetchedPlans = plansRes.value.data.filter((p: any) => p.isActive !== false);
        fetchedPlans.forEach((p: any) => {
          planPriceMap[p.planName] = parseFloat(p.price as any) || 0;
        });
      }
      setPlans(fetchedPlans);

      const data = orgsRes.status === "fulfilled" && Array.isArray(orgsRes.value.data?.Clients)
        ? orgsRes.value.data.Clients : [];
      setUsers(data.map(org => mapOrgToUser(org, planPriceMap)));
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      setError(err?.response?.data?.message ?? "Failed to load users from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalMRR = users.reduce((sum, u) => sum + u.mrr, 0);

  const stats = [
    { label: "Total Users", value: users.length, gradient: "from-[#422462] to-[#5A4079]" },
    { label: "Active", value: users.filter(u => u.status === "active").length, gradient: "from-[#5A4079] to-[#937CB4]" },
    { label: "Locked", value: users.filter(u => u.isLocked).length, gradient: "from-red-600 to-red-400" },
    { label: "Total MRR", value: `₹${totalMRR.toLocaleString("en-IN")}`, gradient: "from-[#422462] to-[#937CB4]" },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = filterPlan === "all" || user.plan === filterPlan;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      company: user.company || "",
      plan: user.plan,
      status: user.status
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser || !userForm.name || !userForm.email) return;
    setSaving(true);
    try {
      const payload: Partial<ApiOrg> = {
        fullName: userForm.name,
        email: userForm.email,
        phoneNumber: userForm.phone,
        status: mapStatusToDB(userForm.status),
        selectedPlan: userForm.plan,
      };
      await orgService.update(editingUser.id, payload);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? {
        ...u,
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        status: userForm.status as any,
        plan: userForm.plan
      } : u));
      setShowUserModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to update user.");
    } finally {
      setSaving(false);
    }
  };

  const handleSuspendUser = async (user: User) => {
    const newStatus = user.status === "suspended" ? "active" : "suspended";
    try {
      await orgService.update(user.id, { status: mapStatusToDB(newStatus) });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus as any } : u));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to update user status.");
    }
  };

  const handleUnlockUser = async (user: User) => {
    if (!user.organizationId) {
      alert("Cannot unlock: no linked organization found for this user.");
      return;
    }
    try {
      await orgService.unlockOrg(user.organizationId);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isLocked: false } : u));
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to unlock organization.");
    }
  };

  const handleChangePlan = (user: User) => {
    setChangingPlanUser(user);
    setNewPlan(user.plan);
    setShowPlanModal(true);
  };

  const handleSavePlanChange = async () => {
    if (!changingPlanUser) return;
    setSaving(true);
    try {
      await orgService.renewPlan(changingPlanUser.id, { selectedPlan: newPlan });
      setUsers(prev => prev.map(u => u.id === changingPlanUser.id ? { ...u, plan: newPlan } : u));
      setShowPlanModal(false);
      setChangingPlanUser(null);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to change plan.");
    } finally {
      setSaving(false);
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "Free": return "bg-[#958CA7] text-white";
      case "Basic": return "bg-[#937CB4] text-white";
      case "Pro": return "bg-[#5A4079] text-white";
      case "Enterprise": return "bg-[#422462] text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500 text-white";
      case "inactive": return "bg-gray-500 text-white";
      case "suspended": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const planOptions = plans.length > 0
    ? plans
    : [
        { id: 0, planName: "Free", price: "0", duration: "", isActive: true },
        { id: 1, planName: "Basic", price: "999", duration: "", isActive: true },
        { id: 2, planName: "Pro", price: "2999", duration: "", isActive: true },
        { id: 3, planName: "Enterprise", price: "9999", duration: "", isActive: true },
      ];

  const uniquePlanNames = Array.from(new Set(planOptions.map(p => p.planName)));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-xl border border-[#937CB4]/20 bg-white/90 backdrop-blur-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
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
          <Button size="sm" variant="outline" className="border-red-300 hover:bg-red-100 text-red-700" onClick={fetchUsers}>
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <Card className="gradient-card border-[#937CB4]/30">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A4079]" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#937CB4]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#937CB4] text-[#200B43]"
                />
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <select
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[#937CB4]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#937CB4] text-[#200B43]"
              >
                <option value="all">All Plans</option>
                {uniquePlanNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[#937CB4]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#937CB4] text-[#200B43]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>

              <Button variant="outline" className="border-[#937CB4]/30 hover:bg-[#F0E9FF] hover:text-[#200B43] text-[#5A4079]">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              <Button variant="outline" className="border-[#937CB4]/30 hover:bg-[#F0E9FF] hover:text-[#200B43] text-[#5A4079]" onClick={fetchUsers}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#937CB4] mx-auto mb-3" />
            <p className="text-[#5A4079] text-sm">Loading users from server...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className={`gradient-card gradient-card-hover border-[#937CB4]/30 ${user.isLocked ? "border-red-300 bg-red-50/30" : ""}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${user.isLocked ? "bg-red-500" : "bg-gradient-to-br from-[#422462] to-[#5A4079]"}`}>
                      {user.isLocked
                        ? <Lock className="h-5 w-5" />
                        : user.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                      }
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg text-[#200B43]">{user.name}</h3>
                        <Badge className={getPlanBadgeColor(user.plan)}>{user.plan}</Badge>
                        <Badge className={getStatusBadgeColor(user.status)}>{user.status}</Badge>
                        {user.isLocked && (
                          <Badge className="bg-red-600 text-white flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Locked
                          </Badge>
                        )}
                      </div>

                      {user.company && (
                        <div className="flex items-center gap-1 text-sm text-[#5A4079] font-medium mb-2">
                          <Building2 className="h-3 w-3" />
                          {user.company}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-[#5A4079]">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#5A4079]">
                          <Phone className="h-4 w-4" />
                          <span>{user.phone || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#5A4079]">
                          <Calendar className="h-4 w-4" />
                          <span>Joined: {user.joinDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#5A4079]">
                          <CreditCard className="h-4 w-4" />
                          <span>MRR: ₹{user.mrr.toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      {user.planExpiryDate && (
                        <div className="mt-2 text-xs text-[#958CA7]">
                          Plan expires: {user.planExpiryDate.substring(0, 10)}
                          {user.planGracePeriodEnd && (
                            <span className="ml-2">· Grace until: {user.planGracePeriodEnd.substring(0, 10)}</span>
                          )}
                        </div>
                      )}

                      <div className="mt-1 text-xs text-[#958CA7]">
                        Last updated: {user.lastActive}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap justify-end">
                    {user.isLocked && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 bg-red-50 hover:bg-red-100 text-red-700"
                        onClick={() => handleUnlockUser(user)}
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        Unlock
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#937CB4]/30 hover:bg-[#F0E9FF] hover:text-[#200B43] text-[#5A4079]"
                      onClick={() => handleChangePlan(user)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Change Plan
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#937CB4]/30 hover:bg-[#F0E9FF] hover:text-[#200B43] text-[#5A4079]"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`border-[#937CB4]/30 hover:text-[#200B43] text-[#5A4079] ${user.status === "suspended" ? "bg-green-50 hover:bg-green-100" : "bg-yellow-50 hover:bg-yellow-100"}`}
                      onClick={() => handleSuspendUser(user)}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredUsers.length === 0 && !loading && (
            <Card className="gradient-card border-[#937CB4]/30">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-[#937CB4] mx-auto mb-4" />
                <p className="text-[#5A4079]">No users found matching your filters</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {showUserModal && editingUser && (
        <Modal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          title="Edit Organization"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#200B43] mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-[#937CB4]/30 focus:outline-none focus:ring-2 focus:ring-[#937CB4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#200B43] mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-[#937CB4]/30 focus:outline-none focus:ring-2 focus:ring-[#937CB4]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#200B43] mb-2">Phone</label>
              <input
                type="tel"
                value={userForm.phone}
                onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-[#937CB4]/30 focus:outline-none focus:ring-2 focus:ring-[#937CB4]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#200B43] mb-2">Status</label>
                <select
                  value={userForm.status}
                  onChange={(e) => setUserForm({ ...userForm, status: e.target.value as User["status"] })}
                  className="w-full px-4 py-2 rounded-lg border border-[#937CB4]/30 focus:outline-none focus:ring-2 focus:ring-[#937CB4]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#200B43] mb-2">Plan</label>
                <select
                  value={userForm.plan}
                  onChange={(e) => setUserForm({ ...userForm, plan: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-[#937CB4]/30 focus:outline-none focus:ring-2 focus:ring-[#937CB4]"
                >
                  {planOptions.map(p => (
                    <option key={p.id || p.planName} value={p.planName}>{p.planName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowUserModal(false)}>Cancel</Button>
              <Button
                className="bg-gradient-to-r from-[#422462] to-[#5A4079] text-white"
                onClick={handleSaveUser}
                disabled={!userForm.name || !userForm.email || saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Update User
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Change Plan Modal */}
      {showPlanModal && changingPlanUser && (
        <Modal
          isOpen={showPlanModal}
          onClose={() => setShowPlanModal(false)}
          title="Change Subscription Plan"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-[#F0E9FF] border border-[#937CB4]/30">
              <p className="text-sm text-[#5A4079]">Changing plan for:</p>
              <p className="font-semibold text-[#200B43]">{changingPlanUser.name}</p>
              <p className="text-sm text-[#5A4079]">{changingPlanUser.email}</p>
              <p className="text-sm font-medium text-[#200B43] mt-1">
                Current plan: <span className="text-[#5A4079]">{changingPlanUser.plan}</span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#200B43] mb-2">New Plan</label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#937CB4]/30 focus:outline-none focus:ring-2 focus:ring-[#937CB4]"
              >
                {planOptions.map(p => (
                  <option key={p.id || p.planName} value={p.planName}>
                    {p.planName} — ₹{parseFloat(p.price).toLocaleString("en-IN")}/{p.duration || "mo"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowPlanModal(false)}>Cancel</Button>
              <Button
                className="bg-gradient-to-r from-[#422462] to-[#5A4079] text-white"
                onClick={handleSavePlanChange}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                Change Plan
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
