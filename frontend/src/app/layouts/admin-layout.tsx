import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../components/ui/dropdown-menu";
import { logout } from "../api";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  DollarSign,
  CreditCard,
  Tag,
  MessageSquare,
  Settings,
  ChevronDown,
  Bell,
  Search,
  Sparkles,
  LogOut
} from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminInfo, setAdminInfo] = useState({ fullName: "Super Admin", email: "admin@company.com" });

  useEffect(() => {
    const storedAdmin = sessionStorage.getItem("adminData");
    if (storedAdmin) {
      try {
        const data = JSON.parse(storedAdmin);
        setAdminInfo({
          fullName: data.fullName || "Super Admin",
          email: data.email || "admin@company.com"
        });
      } catch (e) {
        console.error("Error parsing adminData", e);
      }
    }
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { id: "dashboard", path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "users", path: "/admin/users", icon: Users, label: "Users" },
    { id: "financials", path: "/admin/financials", icon: DollarSign, label: "Financials" },
    { id: "plans", path: "/admin/plans", icon: CreditCard, label: "Plans" },
    { id: "coupons", path: "/admin/coupons", icon: Tag, label: "Coupons" },
    { id: "queries", path: "/admin/queries", icon: MessageSquare, label: "Queries" },
    { id: "settings", path: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const getViewTitle = () => {
    const titles: Record<string, { title: string; subtitle: string }> = {
      "/admin/dashboard": { title: "Super Admin Dashboard", subtitle: "Overview of platform metrics and analytics" },
      "/admin/users": { title: "User Management", subtitle: "Manage all platform users and their accounts" },
      "/admin/financials": { title: "Financial Management", subtitle: "Revenue, transactions, and financial analytics" },
      "/admin/plans": { title: "Subscription Plans", subtitle: "Manage pricing plans and user subscriptions" },
      "/admin/coupons": { title: "Coupon Management", subtitle: "Create and manage discount codes and promotions" },
      "/admin/queries": { title: "Inbound Queries", subtitle: "Manage customer inquiries and support tickets" },
      "/admin/settings": { title: "Admin Settings", subtitle: "Configure platform settings and preferences" },
    };
    return titles[location.pathname] || { title: "Super Admin Portal", subtitle: "Platform Management System" };
  };

  const viewInfo = getViewTitle();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0E9FF] via-white to-[#F0E9FF]">
   
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-[#937CB4]/20 z-50 shadow-lg shadow-[#937CB4]/10">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-[#F0E9FF]"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#422462] blur-xl opacity-40 animate-pulse"></div>
                <img src="/favicon.png" alt="Oraddo" className="h-8 w-8 relative z-10 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#422462] via-[#5A4079] to-[#937CB4] bg-clip-text text-transparent">
                  Super Admin Portal
                </h1>
                <p className="text-xs text-[#5A4079]">Platform Management System</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A4079]" />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 rounded-lg border border-[#937CB4]/20 bg-white/90 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-[#937CB4] text-[#200B43] text-sm"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="relative hover:bg-[#F0E9FF]"
            >
              <Bell className="h-5 w-5 text-[#5A4079]" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#422462]/10 to-[#5A4079]/10 border border-[#937CB4]/20 cursor-pointer hover:bg-[#F0E9FF]/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#422462] to-[#5A4079] flex items-center justify-center text-white font-bold text-sm">
                    SA
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold text-[#200B43]">{adminInfo.fullName}</p>
                    <p className="text-xs text-[#5A4079]">{adminInfo.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#5A4079]" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => logout()} variant="destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
 
      <div className={`fixed left-0 top-16 bottom-0 w-64 bg-white/90 backdrop-blur-xl border-r border-[#937CB4]/20 transition-all duration-300 z-40 overflow-y-auto shadow-xl shadow-[#937CB4]/10 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link key={item.id} to={item.path}>
              <Button
                variant="ghost"
                className={`w-full justify-start transition-all duration-300 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-[#422462] to-[#5A4079] text-white hover:from-[#422462] hover:to-[#5A4079] shadow-lg shadow-[#937CB4]/30'
                    : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                <span>{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </div>
 
      <div className={`transition-all duration-300 pt-16 ${sidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <div className="p-6">
    
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-[#937CB4] blur-xl opacity-30 animate-pulse"></div>
                <Sparkles className="h-6 w-6 text-[#422462] relative z-10 animate-pulse-glow" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">{viewInfo.title}</h1>
            </div>
            <p className="text-[#5A4079] ml-9">{viewInfo.subtitle}</p>
          </div>
 
          <div className="relative">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-[#937CB4]/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-tl from-[#422462]/10 to-transparent rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
