import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../components/ui/dropdown-menu";
import { logout } from "../api";
import {
  Menu, 
  X, 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Megaphone, 
  FolderKanban, 
  UserPlus, 
  StickyNote, 
  MessageCircle, 
  Bell,
  ChevronRight,
  ChevronDown, 
  Shield, 
  Building2, 
  FileText, 
  Receipt, 
  CreditCard, 
  CalendarDays, 
  ListChecks, 
  Calendar, 
  Check, 
  ClipboardList, 
  Headphones, 
  BarChart3, 
  LogOut, 
  Briefcase,
  Video
} from "lucide-react";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState({ fullName: "User", role: "User" });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Current user derived from sessionStorage (replaces hardcoded "Haritha Sree / HS")
  useEffect(() => {
    const storedUser = sessionStorage.getItem("userData");
    const storedType = sessionStorage.getItem("userType");

    if (!storedUser) return;

    try {
      const parsed = JSON.parse(storedUser);
      const displayRole =
        parsed?.role ||
        (storedType === "admin"
          ? "Admin"
          : storedType === "organization"
          ? "Organization Admin"
          : "User");

      setUserInfo({
        fullName: parsed?.fullName || parsed?.emp_name || "User",
        role: displayRole,
      });
    } catch (error) {
      console.error("Failed to parse userData from sessionStorage", error);
    }
  }, []);
  const [hrMenuExpanded, setHrMenuExpanded] = useState(false);
  const [bizDevExpanded, setBizDevExpanded] = useState(false);
  const [marketingExpanded, setMarketingExpanded] = useState(false);
  const [financeExpanded, setFinanceExpanded] = useState(false);
  const [projectExpanded, setProjectExpanded] = useState(false);
  const [orgMgmtExpanded, setOrgMgmtExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isSectionActive = (prefix: string) => location.pathname.includes(prefix);
  
 
  const isMeetingAttendScreen = location.pathname.includes('/marketing/meetings') && new URLSearchParams(location.search).get('view') === 'attend';

  const getViewTitle = () => {
    const path = location.pathname;
    const titles: Record<string, { title: string; subtitle: string }> = {
      "/app/dashboard": { title: "AI Dashboard", subtitle: "Intelligent overview of your business processes and performance metrics" },
      "/app/business-development/proposal": { title: "Proposal Quotation", subtitle: "Create and manage business proposals and quotations" },
      "/app/business-development/invoice": { title: "Invoice Generation", subtitle: "Generate and track invoices for your clients" },
      "/app/business-development/billing": { title: "Billing Management", subtitle: "Manage billing cycles and payment tracking" },
      "/app/marketing/calendar": { title: "Marketing Calendar", subtitle: "Plan and schedule your marketing campaigns" },
      "/app/marketing/strategies": { title: "Marketing Strategies", subtitle: "Develop and execute marketing strategies" },
      "/app/marketing/blogs": { title: "Blogs", subtitle: "Create and manage blog content" },
      "/app/marketing/meetings": { title: "Meetings", subtitle: "Schedule and manage client and team meetings" },
      "/app/finance/expense": { title: "Expense Management", subtitle: "Track and manage business expenses" },
      "/app/finance/financial": { title: "Financial Management", subtitle: "Oversee financial operations and budgets" },
      "/app/finance/revenue": { title: "Monthly Revenue", subtitle: "Monitor revenue streams and financial performance" },
      "/app/project/kanban": { title: "Kanban Board", subtitle: "Visualize and manage project workflows" },
      "/app/project/completed": { title: "Completed Projects", subtitle: "Review completed project history" },
      "/app/project/tasks": { title: "Tasks", subtitle: "Manage project tasks and assignments" },
      "/app/lead-generation": { title: "Lead Generation", subtitle: "Capture and manage potential customers" },
      "/app/support": { title: "Support", subtitle: "Customer support and ticket management" },
      "/app/notes": { title: "Notes", subtitle: "Create and organize your notes" },
      "/app/chat": { title: "Chat", subtitle: "Team communication and collaboration" },
      "/app/notifications": { title: "Notifications", subtitle: "Stay updated with system alerts" },
      "/app/profile": { title: "My Profile", subtitle: "Manage your personal information and preferences" },
      "/app/settings/organization": { title: "Organization Settings", subtitle: "Manage your company branding and logo" },
      "/app/settings/billing": { title: "Billing & Subscription", subtitle: "View your active plan, days remaining, and billing history" },
      "/app/hr/attendance": { title: "Attendance", subtitle: "Monitor employee attendance and leave" },
      "/app/hr/performance-metrics": { title: "My Performance Metrics", subtitle: "Track your monthly performance and achievements" },
      "/app/hr/salary-structure": { title: "My Salary Structure", subtitle: "View your salary breakdown and compensation details" },
      "/app/hr/resignation": { title: "Resignation Process", subtitle: "Submit and track your resignation application" },
      "/app/hr/expenses": { title: "Expenses", subtitle: "Submit and track expense claims" },
      "/app/hr/job-management": { title: "Job Management", subtitle: "Manage job postings and recruitment" },
      "/app/hr/organization/resignation-management": { title: "Employee Resignation Management", subtitle: "Manage employee resignation processes" },
      "/app/hr/organization/hr-panel": { title: "HR Panel", subtitle: "Comprehensive HR management dashboard" },
      "/app/hr/organization/leave-management": { title: "Leave Management", subtitle: "Manage employee leave requests and approvals" },
      "/app/hr/organization/attendance-management": { title: "Attendance Management", subtitle: "Manage employee attendance records" },
      "/app/hr/organization/onboarding": { title: "Employee Onboarding", subtitle: "Manage new employee onboarding processes" },
      "/app/hr/organization/salaries": { title: "Salaries Management", subtitle: "Manage employee salaries and payroll" },
      "/app/hr/organization/team-performance": { title: "Team Performance Management", subtitle: "Monitor and evaluate team performance" },
      "/app/hr/organization/salary-advance": { title: "Salaries Advance/Loan Requests", subtitle: "Manage salary advance and loan requests" },
    };
    return titles[path] || { title: "AI ProcessFlow", subtitle: "Intelligent Business Management" };
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
              className="lg:hidden hover:bg-[#F0E9FF]"
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
                  AI ProcessFlow
                </h1>
                <p className="text-xs text-[#5A4079]">AI-Powered Business Management</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-[#F0E9FF]"
              onClick={() => navigate("/app/notes")}
            >
              <StickyNote className="h-5 w-5 text-[#5A4079]" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-[#F0E9FF]"
              onClick={() => navigate("/app/chat")}
            >
              <MessageCircle className="h-5 w-5 text-[#5A4079]" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-[#F0E9FF]"
              onClick={() => navigate("/app/support")}
            >
              <Headphones className="h-5 w-5 text-[#5A4079]" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="relative hover:bg-[#F0E9FF]"
              onClick={() => navigate("/app/notifications")}
            >
              <Bell className="h-5 w-5 text-[#5A4079]" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#422462]/10 to-[#5A4079]/10 border border-[#937CB4]/20 cursor-pointer hover:bg-[#F0E9FF]/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#422462] to-[#5A4079] flex items-center justify-center text-white font-bold text-sm">
                    {userInfo.fullName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "U"}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold text-[#200B43]">{userInfo.fullName}</p>
                    <p className="text-xs text-[#5A4079]">{userInfo.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#5A4079]" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/app/profile")}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} variant="destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
 
      <div className={`fixed left-0 top-16 bottom-0 w-64 bg-white/90 backdrop-blur-xl border-r border-[#937CB4]/20 transition-all duration-300 z-40 overflow-y-auto shadow-xl shadow-[#937CB4]/10 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 space-y-2">
          {/* Dashboard */}
          <Link to="/app/dashboard" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
            <Button
              variant="ghost"
              className={`w-full justify-start transition-all duration-300 group relative overflow-hidden ${
                isActive("/app/dashboard")
                  ? 'bg-gradient-to-r from-[#422462] to-[#5A4079] text-white hover:from-[#422462] hover:to-[#5A4079] shadow-lg shadow-[#937CB4]/30'
                  : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'
              }`}
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              <span className="relative z-10">Dashboard</span>
            </Button>
          </Link>
 
          <div>
            <Button
              variant="ghost"
              className={`
                w-full justify-start transition-all duration-300 group relative overflow-hidden
                ${isSectionActive('business-development') 
                  ? 'bg-gradient-to-r from-[#422462] to-[#5A4079] text-white hover:from-[#422462] hover:to-[#5A4079] shadow-lg shadow-[#937CB4]/30' 
                  : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'
                }
              `}
              onClick={() => setBizDevExpanded(!bizDevExpanded)}
            >
              <TrendingUp className="mr-3 h-5 w-5" />
              <span className="relative z-10 flex-1 text-left min-w-0 truncate">Business Development</span>
              {bizDevExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
            </Button>

            <div className={`overflow-hidden transition-all duration-300 ${bizDevExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="ml-2 space-y-1">
                <Link to="/app/business-development/proposal" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/business-development/proposal") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="text-sm">Proposal Quotation</span>
                  </Button>
                </Link>

                <Link to="/app/business-development/invoice" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/business-development/invoice") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    <span className="text-sm">Invoice Generation</span>
                  </Button>
                </Link>

                <Link to="/app/business-development/billing" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/business-development/billing") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span className="text-sm">Billing Management</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
 
          <div>
            <Button
              variant="ghost"
              className={`
                w-full justify-start transition-all duration-300 group relative overflow-hidden
                ${isSectionActive('marketing') 
                  ? 'bg-gradient-to-r from-[#422462] to-[#5A4079] text-white hover:from-[#422462] hover:to-[#5A4079] shadow-lg shadow-[#937CB4]/30' 
                  : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'
                }
              `}
              onClick={() => setMarketingExpanded(!marketingExpanded)}
            >
              <Megaphone className="mr-3 h-5 w-5" />
              <span className="relative z-10 flex-1 text-left min-w-0 truncate">Marketing</span>
              {marketingExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
            </Button>

            <div className={`overflow-hidden transition-all duration-300 ${marketingExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="ml-2 space-y-1">
                <Link to="/app/marketing/calendar" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/marketing/calendar") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <span className="text-sm">Marketing Calendar</span>
                  </Button>
                </Link>

                <Link to="/app/marketing/strategies" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/marketing/strategies") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <ListChecks className="mr-2 h-4 w-4" />
                    <span className="text-sm">Marketing Strategies</span>
                  </Button>
                </Link>

                <Link to="/app/marketing/blogs" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/marketing/blogs") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="text-sm">Blogs</span>
                  </Button>
                </Link>

                <Link to="/app/marketing/meetings" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/marketing/meetings") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    <span className="text-sm">Meetings</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
 
          <div>
            <Button
              variant="ghost"
              className={`
                w-full justify-start transition-all duration-300 group relative overflow-hidden
                ${location.pathname.includes('/hr') 
                  ? 'bg-gradient-to-r from-[#422462] to-[#5A4079] text-white hover:from-[#422462] hover:to-[#5A4079] shadow-lg shadow-[#937CB4]/30' 
                  : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'
                }
              `}
              onClick={() => setHrMenuExpanded(!hrMenuExpanded)}
            >
              <Users className="mr-3 h-5 w-5" />
              <span className="relative z-10 flex-1 text-left min-w-0 truncate">Human Resources</span>
              {hrMenuExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
            </Button>

            <div className={`overflow-hidden transition-all duration-300 ${hrMenuExpanded ? 'max-h-[2000px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="ml-2 space-y-1">
                
                {/* Attendance */}
                <Link to="/app/hr/attendance" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/hr/attendance") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    <span className="text-sm">Attendance</span>
                  </Button>
                </Link>
 
                <Link to="/app/hr/performance-metrics" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/hr/performance-metrics") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span className="text-sm">My Performance Metrics</span>
                  </Button>
                </Link>
 
                <Link to="/app/hr/salary-structure" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/hr/salary-structure") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span className="text-sm">My Salary Structure</span>
                  </Button>
                </Link>
 
                <Link to="/app/hr/resignation" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/hr/resignation") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="text-sm">Resignation Process</span>
                  </Button>
                </Link>

                <Link to="/app/hr/job-management" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive('/app/hr/job-management') 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span className="text-sm">Job Management</span>
                  </Button>
                </Link>

                <Link to="/app/hr/expenses" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive('/app/hr/expenses') 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    <span className="text-sm">Expenses</span>
                  </Button>
                </Link>
 
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${location.pathname.includes('/hr/organization') 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                    onClick={() => setOrgMgmtExpanded(!orgMgmtExpanded)}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span className="text-sm flex-1 text-left min-w-0 truncate">Organization Management</span>
                    {orgMgmtExpanded ? (
                      <ChevronDown className="h-3 w-3 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 shrink-0" />
                    )}
                  </Button>

                  <div className={`overflow-hidden transition-all duration-300 ${orgMgmtExpanded ? 'max-h-[1000px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                    <div className="ml-4 space-y-1">
                      <Link to="/app/hr/organization/resignation-management" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`
                            w-full justify-start text-xs transition-all duration-300
                            ${isActive('/app/hr/organization/resignation-management') 
                              ? 'bg-[#F0E9FF] text-[#422462]' 
                              : 'text-[#5A4079] hover:bg-[#F0E9FF]/50 hover:text-[#422462]'
                            }
                          `}
                        >
                          Employee Resignation
                        </Button>
                      </Link>

                      <Link to="/app/hr/organization/hr-panel" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`
                            w-full justify-start text-xs transition-all duration-300
                            ${isActive('/app/hr/organization/hr-panel') 
                              ? 'bg-[#F0E9FF] text-[#422462]' 
                              : 'text-[#5A4079] hover:bg-[#F0E9FF]/50 hover:text-[#422462]'
                            }
                          `}
                        >
                          HR Panel
                        </Button>
                      </Link>

                      <Link to="/app/hr/organization/leave-management" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`
                            w-full justify-start text-xs transition-all duration-300
                            ${isActive('/app/hr/organization/leave-management') 
                              ? 'bg-[#F0E9FF] text-[#422462]' 
                              : 'text-[#5A4079] hover:bg-[#F0E9FF]/50 hover:text-[#422462]'
                            }
                          `}
                        >
                          Leave Management
                        </Button>
                      </Link>

                      <Link to="/app/hr/organization/attendance-management" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`
                            w-full justify-start text-xs transition-all duration-300
                            ${isActive('/app/hr/organization/attendance-management') 
                              ? 'bg-[#F0E9FF] text-[#422462]' 
                              : 'text-[#5A4079] hover:bg-[#F0E9FF]/50 hover:text-[#422462]'
                            }
                          `}
                        >
                          Attendance Management
                        </Button>
                      </Link>

                      <Link to="/app/hr/organization/onboarding" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`
                            w-full justify-start text-xs transition-all duration-300
                            ${isActive('/app/hr/organization/onboarding') 
                              ? 'bg-[#F0E9FF] text-[#422462]' 
                              : 'text-[#5A4079] hover:bg-[#F0E9FF]/50 hover:text-[#422462]'
                            }
                          `}
                        >
                          Employee Onboarding
                        </Button>
                      </Link>

                      <Link to="/app/hr/organization/salaries" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`
                            w-full justify-start text-xs transition-all duration-300
                            ${isActive('/app/hr/organization/salaries') 
                              ? 'bg-[#F0E9FF] text-[#422462]' 
                              : 'text-[#5A4079] hover:bg-[#F0E9FF]/50 hover:text-[#422462]'
                            }
                          `}
                        >
                          Salaries Management
                        </Button>
                      </Link>

                      <Link to="/app/hr/organization/team-performance" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`
                            w-full justify-start text-xs transition-all duration-300
                            ${isActive('/app/hr/organization/team-performance') 
                              ? 'bg-[#F0E9FF] text-[#422462]' 
                              : 'text-[#5A4079] hover:bg-[#F0E9FF]/50 hover:text-[#422462]'
                            }
                          `}
                        >
                          Team Performance
                        </Button>
                      </Link>

                      <Link to="/app/hr/organization/salary-advance" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`
                            w-full justify-start text-xs transition-all duration-300
                            ${isActive('/app/hr/organization/salary-advance') 
                              ? 'bg-[#F0E9FF] text-[#422462]' 
                              : 'text-[#5A4079] hover:bg-[#F0E9FF]/50 hover:text-[#422462]'
                            }
                          `}
                        >
                          Salary Advance
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
 
          <div>
            <Button
              variant="ghost"
              className={`
                w-full justify-start transition-all duration-300 group relative overflow-hidden
                ${isSectionActive('finance') 
                  ? 'bg-gradient-to-r from-[#422462] to-[#5A4079] text-white hover:from-[#422462] hover:to-[#5A4079] shadow-lg shadow-[#937CB4]/30' 
                  : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'
                }
              `}
              onClick={() => setFinanceExpanded(!financeExpanded)}
            >
              <DollarSign className="mr-3 h-5 w-5" />
              <span className="relative z-10 flex-1 text-left min-w-0 truncate">Finance</span>
              {financeExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
            </Button>

            <div className={`overflow-hidden transition-all duration-300 ${financeExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="ml-2 space-y-1">
                <Link to="/app/finance/expense" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/finance/expense") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    <span className="text-sm">Expense Management</span>
                  </Button>
                </Link>

                <Link to="/app/finance/financial" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/finance/financial") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="text-sm">Financial Management</span>
                  </Button>
                </Link>

                <Link to="/app/finance/revenue" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/finance/revenue") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span className="text-sm">Monthly Revenue</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
 
          <div>
            <Button
              variant="ghost"
              className={`
                w-full justify-start transition-all duration-300 group relative overflow-hidden
                ${isSectionActive('project') 
                  ? 'bg-gradient-to-r from-[#422462] to-[#5A4079] text-white hover:from-[#422462] hover:to-[#5A4079] shadow-lg shadow-[#937CB4]/30' 
                  : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'
                }
              `}
              onClick={() => setProjectExpanded(!projectExpanded)}
            >
              <FolderKanban className="mr-3 h-5 w-5" />
              <span className="relative z-10 flex-1 text-left min-w-0 truncate">Project Management</span>
              {projectExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
            </Button>

            <div className={`overflow-hidden transition-all duration-300 ${projectExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="ml-2 space-y-1">
                <Link to="/app/project/kanban" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/project/kanban") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <FolderKanban className="mr-2 h-4 w-4" />
                    <span className="text-sm">Kanban Board</span>
                  </Button>
                </Link>

                <Link to="/app/project/completed" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/project/completed") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    <span className="text-sm">Completed Projects</span>
                  </Button>
                </Link>

                <Link to="/app/project/tasks" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      w-full justify-start transition-all duration-300 group relative overflow-hidden
                      ${isActive("/app/project/tasks") 
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md' 
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                      }
                    `}
                  >
                    <ListChecks className="mr-2 h-4 w-4" />
                    <span className="text-sm">Tasks</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
 
          <Link to="/app/lead-generation" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
            <Button
              variant="ghost"
              className={`w-full justify-start transition-all duration-300 group relative overflow-hidden ${
                isActive("/app/lead-generation")
                  ? 'bg-gradient-to-r from-[#422462] to-[#5A4079] text-white hover:from-[#422462] hover:to-[#5A4079] shadow-lg shadow-[#937CB4]/30'
                  : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'
              }`}
            >
              <UserPlus className="mr-3 h-5 w-5" />
              <span className="relative z-10">Lead Generation</span>
            </Button>
          </Link>

          {/* Settings — collapsible group */}
          <div>
            <Button
              variant="ghost"
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              className={`w-full justify-start transition-all duration-300 group relative overflow-hidden ${
                isSectionActive("/app/settings")
                  ? 'bg-gradient-to-r from-[#422462] to-[#5A4079] text-white hover:from-[#422462] hover:to-[#5A4079] shadow-lg shadow-[#937CB4]/30'
                  : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'
              }`}
            >
              <Building2 className="mr-3 h-5 w-5 shrink-0" />
              <span className="relative z-10 flex-1 text-left min-w-0 truncate">Settings</span>
              {settingsExpanded
                ? <ChevronDown className="h-4 w-4 shrink-0" />
                : <ChevronRight className="h-4 w-4 shrink-0" />}
            </Button>

            <div className={`overflow-hidden transition-all duration-300 ${settingsExpanded ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="ml-2 space-y-1">
                <Link to="/app/settings/organization" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start transition-all duration-300 ${
                      isActive("/app/settings/organization")
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md'
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                    }`}
                  >
                    <Building2 className="mr-2 h-4 w-4 shrink-0" />
                    <span className="text-sm">Organization</span>
                  </Button>
                </Link>

                <Link to="/app/settings/billing" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start transition-all duration-300 ${
                      isActive("/app/settings/billing")
                        ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white hover:from-[#937CB4] hover:to-[#5A4079] shadow-md'
                        : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#422462]'
                    }`}
                  >
                    <CreditCard className="mr-2 h-4 w-4 shrink-0" />
                    <span className="text-sm">Billing & Subscription</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      <div className={`transition-all duration-300 pt-16 ${sidebarOpen ? 'lg:pl-64' : 'pl-0'}`}>
        <div className={isMeetingAttendScreen ? '' : 'p-6'}>
          {/* Content */}
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