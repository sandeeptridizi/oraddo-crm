import { Outlet } from "react-router";
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { Button } from "../components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "../components/ui/dropdown-menu";
import { logout } from "../api";
import {
  Menu,
  X, 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  Megaphone, 
  FolderKanban, 
  UserPlus, 
  StickyNote, 
  MessageCircle, 
  Bell,
  ChevronRight,
  ChevronDown, 
  FileText, 
  Receipt, 
  CreditCard, 
  CalendarDays, 
  ListChecks, 
  Check,
  Headphones,
  BarChart3, 
  LogOut,
  DollarSign,
  Video
} from "lucide-react";

export default function EmployeeLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [employeeInfo, setEmployeeInfo] = useState({ fullName: "Employee", role: "Employee" });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hrMenuExpanded, setHrMenuExpanded] = useState(false);
  const [bizDevExpanded, setBizDevExpanded] = useState(false);
  const [marketingExpanded, setMarketingExpanded] = useState(false);
  const [projectExpanded, setProjectExpanded] = useState(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("userData");
    const storedType = sessionStorage.getItem("userType");

    if (!storedUser) return;

    try {
      const parsed = JSON.parse(storedUser);
      const displayRole =
        storedType === "admin" ? "Admin" : storedType === "employee" ? "Employee" : "User";

      setEmployeeInfo({
        fullName: parsed?.fullName || parsed?.emp_name || "Employee",
        role: displayRole,
      });
    } catch (error) {
      console.error("Failed to parse userData from sessionStorage", error);
    }
  }, []);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isSectionActive = (prefix: string) => location.pathname.includes(prefix);

  const getViewTitle = () => {
    const path = location.pathname;
    const titles: Record<string, { title: string; subtitle: string }> = {
      "/employee/dashboard": { title: "AI Dashboard", subtitle: "Intelligent overview of your business processes and performance metrics" },
      "/employee/business-development/proposal": { title: "Proposal Quotation", subtitle: "Create and manage business proposals and quotations" },
      "/employee/business-development/invoice": { title: "Invoice Generation", subtitle: "Generate and track invoices for your clients" },
      "/employee/business-development/billing": { title: "Billing Management", subtitle: "Manage billing cycles and payment tracking" },
      "/employee/marketing/calendar": { title: "Marketing Calendar", subtitle: "Plan and schedule your marketing campaigns" },
      "/employee/marketing/strategies": { title: "Marketing Strategies", subtitle: "Develop and execute marketing strategies" },
      "/employee/marketing/blogs": { title: "Blogs", subtitle: "Create and manage blog content" },
      "/employee/marketing/meetings": { title: "Meetings", subtitle: "Schedule and manage client and team meetings" },
      "/employee/project/kanban": { title: "Kanban Board", subtitle: "Visualize and manage project workflows" },
      "/employee/project/completed": { title: "Completed Projects", subtitle: "Review completed project history" },
      "/employee/project/tasks": { title: "Tasks", subtitle: "Manage project tasks and assignments" },
      "/employee/lead-generation": { title: "Lead Generation", subtitle: "Capture and manage potential customers" },
      "/employee/support": { title: "Support", subtitle: "Customer support and ticket management" },
      "/employee/notes": { title: "Notes", subtitle: "Create and organize your notes" },
      "/employee/chat": { title: "Chat", subtitle: "Team communication and collaboration" },
      "/employee/notifications": { title: "Notifications", subtitle: "Stay updated with system alerts" },
      "/employee/profile": { title: "My Profile", subtitle: "Manage your personal information and preferences" },
      "/employee/hr/attendance": { title: "Attendance", subtitle: "Monitor employee attendance and leave" },
      "/employee/hr/performance-metrics": { title: "My Performance Metrics", subtitle: "Track your monthly performance and achievements" },
      "/employee/hr/salary-structure": { title: "My Salary Structure", subtitle: "View your salary breakdown and compensation details" },
      "/employee/hr/resignation": { title: "Resignation Process", subtitle: "Submit and track your resignation application" },
      "/employee/hr/expenses": { title: "Expenses", subtitle: "Submit and track expense claims" },
      "/employee/hr/job-management": { title: "Job Management", subtitle: "Manage job postings and recruitment" },
    };
    return titles[path] || { title: "Employee Portal", subtitle: "Intelligent Business Management" };
  };

  const viewInfo = getViewTitle();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0E9FF] via-white to-[#F0E9FF]">
      {/* Top Navigation Bar */}
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
                  Employee Portal
                </h1>
                <p className="text-xs text-[#5A4079]">AI-Powered Business Management</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="relative hover:bg-[#F0E9FF]"
              onClick={() => navigate("/employee/notifications")}
            >
              <Bell className="h-5 w-5 text-[#5A4079]" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#422462]/10 to-[#5A4079]/10 border border-[#937CB4]/20 cursor-pointer hover:bg-[#F0E9FF]/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#422462] to-[#5A4079] flex items-center justify-center text-white font-bold text-sm">
                    {employeeInfo.fullName
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "E"}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold text-[#200B43]">{employeeInfo.fullName}</p>
                    <p className="text-xs text-[#5A4079]">{employeeInfo.role}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#5A4079]" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/employee/profile")}>
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
          <Link to="/employee/dashboard" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
            <Button
              variant="ghost"
              className={`w-full justify-start transition-all duration-300 group relative ${
                isActive("/employee/dashboard")
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
                w-full justify-start transition-all duration-300 group relative
                ${isSectionActive('business-development') 
                  ? 'bg-gradient-to-r from-[#422462] to-[#5A4079] text-white hover:from-[#422462] hover:to-[#5A4079] shadow-lg shadow-[#937CB4]/30' 
                  : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'
                }
              `}
              onClick={() => setBizDevExpanded(!bizDevExpanded)}
            >
              <TrendingUp className="mr-3 h-5 w-5" />
              <span className="relative z-10 flex-1 text-left min-w-0 truncate">Business Development</span>
              {bizDevExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>

            <div className={`overflow-hidden transition-all duration-300 ${bizDevExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="ml-2 space-y-1">
                <Link to="/employee/business-development/proposal" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start transition-all duration-300 ${isActive("/employee/business-development/proposal") ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <FileText className="mr-2 h-4 w-4" /><span className="text-sm">Proposal Quotation</span>
                  </Button>
                </Link>
                <Link to="/employee/business-development/invoice" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start transition-all duration-300 ${isActive("/employee/business-development/invoice") ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <Receipt className="mr-2 h-4 w-4" /><span className="text-sm">Invoice Generation</span>
                  </Button>
                </Link>
                <Link to="/employee/business-development/billing" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start transition-all duration-300 ${isActive("/employee/business-development/billing") ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <CreditCard className="mr-2 h-4 w-4" /><span className="text-sm">Billing Management</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
 
          <div>
            <Button
              variant="ghost"
              className={`w-full justify-start transition-all duration-300 group relative ${isSectionActive('marketing') ? 'bg-gradient-to-r from-[#422462] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}
              onClick={() => setMarketingExpanded(!marketingExpanded)}
            >
              <Megaphone className="mr-3 h-5 w-5" />
              <span className="relative z-10 flex-1 text-left min-w-0 truncate">Marketing</span>
              {marketingExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>

            <div className={`overflow-hidden transition-all duration-300 ${marketingExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="ml-2 space-y-1">
                <Link to="/employee/marketing/calendar" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/employee/marketing/calendar") ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <CalendarDays className="mr-2 h-4 w-4" /><span className="text-sm">Marketing Calendar</span>
                  </Button>
                </Link>
                <Link to="/employee/marketing/strategies" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/employee/marketing/strategies") ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <ListChecks className="mr-2 h-4 w-4" /><span className="text-sm">Marketing Strategies</span>
                  </Button>
                </Link>
                <Link to="/employee/marketing/blogs" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/employee/marketing/blogs") ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <FileText className="mr-2 h-4 w-4" /><span className="text-sm">Blogs</span>
                  </Button>
                </Link>
                <Link to="/employee/marketing/meetings" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/employee/marketing/meetings") ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <MessageCircle className="mr-2 h-4 w-4" /><span className="text-sm">Meetings</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
 
          <div>
            <Button
              variant="ghost"
              className={`w-full justify-start transition-all duration-300 group relative ${location.pathname.includes('/hr') ? 'bg-gradient-to-r from-[#422462] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}
              onClick={() => setHrMenuExpanded(!hrMenuExpanded)}
            >
              <Users className="mr-3 h-5 w-5" />
              <span className="relative z-10 flex-1 text-left min-w-0 truncate">Human Resources</span>
              {hrMenuExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>

            <div className={`overflow-hidden transition-all duration-300 ${hrMenuExpanded ? 'max-h-[1000px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="ml-2 space-y-1">
                {/* Attendance — not needed in the individual employee view
                <Link to="/employee/hr/attendance" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/employee/hr/attendance") ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <Calendar className="mr-2 h-4 w-4" /><span className="text-sm">Attendance</span>
                  </Button>
                </Link>
                */}
                <Link to="/employee/hr/performance-metrics" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/employee/hr/performance-metrics") ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <BarChart3 className="mr-2 h-4 w-4" /><span className="text-sm">My Performance Metrics</span>
                  </Button>
                </Link>
                <Link to="/employee/hr/salary-structure" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/employee/hr/salary-structure") ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <DollarSign className="mr-2 h-4 w-4" /><span className="text-sm">My Salary Structure</span>
                  </Button>
                </Link>
                <Link to="/employee/hr/resignation" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/employee/hr/resignation") ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <LogOut className="mr-2 h-4 w-4" /><span className="text-sm">Resignation Process</span>
                  </Button>
                </Link>
                {/* Job Management — HR/recruiter feature, not needed in the individual employee view
                <Link to="/employee/hr/job-management" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive('/employee/hr/job-management') ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <Briefcase className="mr-2 h-4 w-4" /><span className="text-sm">Job Management</span>
                  </Button>
                </Link>
                */}
                {/* Expenses — not needed in the individual employee view
                <Link to="/employee/hr/expenses" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive('/employee/hr/expenses') ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <ClipboardList className="mr-2 h-4 w-4" /><span className="text-sm">Expenses</span>
                  </Button>
                </Link>
                */}
              </div>
            </div>
          </div>
 
          <div>
            <Button
              variant="ghost"
              className={`w-full justify-start transition-all duration-300 group relative ${isSectionActive('project') ? 'bg-gradient-to-r from-[#422462] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}
              onClick={() => setProjectExpanded(!projectExpanded)}
            >
              <FolderKanban className="mr-3 h-5 w-5" />
              <span className="relative z-10 flex-1 text-left min-w-0 truncate">Project Management</span>
              {projectExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>

            <div className={`overflow-hidden transition-all duration-300 ${projectExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="ml-2 space-y-1">
                <Link to="/employee/project/kanban" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/employee/project/kanban") ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <FolderKanban className="mr-2 h-4 w-4" /><span className="text-sm">Kanban Board</span>
                  </Button>
                </Link>
                <Link to="/employee/project/completed" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/employee/project/completed") ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <Check className="mr-2 h-4 w-4" /><span className="text-sm">Completed Projects</span>
                  </Button>
                </Link>
                <Link to="/employee/project/tasks" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
                  <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/employee/project/tasks") ? 'bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
                    <ListChecks className="mr-2 h-4 w-4" /><span className="text-sm">Tasks</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
 
          <Link to="/employee/lead-generation" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
            <Button variant="ghost" className={`w-full justify-start transition-all duration-300 ${isActive("/employee/lead-generation") ? 'bg-gradient-to-r from-[#422462] to-[#5A4079] text-white' : 'text-[#200B43] hover:bg-[#F0E9FF]/70 hover:text-[#200B43]'}`}>
              <UserPlus className="mr-3 h-5 w-5" /><span className="relative z-10">Lead Generation</span>
            </Button>
          </Link>
 
          <div className="border-t border-[#937CB4]/20 my-2"></div>
 
          <Link to="/employee/notes" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
            <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/employee/notes") ? 'bg-[#F0E9FF] text-[#422462]' : 'text-[#5A4079] hover:bg-[#F0E9FF]/50 hover:text-[#5A4079]'}`}>
              <StickyNote className="mr-2 h-4 w-4" /><span className="text-sm">Notes</span>
            </Button>
          </Link>
          <Link to="/employee/chat" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
            <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/employee/chat") ? 'bg-[#F0E9FF] text-[#422462]' : 'text-[#5A4079] hover:bg-[#F0E9FF]/50 hover:text-[#5A4079]'}`}>
              <MessageCircle className="mr-2 h-4 w-4" /><span className="text-sm">Chat</span>
            </Button>
          </Link>
          <Link to="/employee/support" onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}>
            <Button variant="ghost" size="sm" className={`w-full justify-start ${isActive("/employee/support") ? 'bg-[#F0E9FF] text-[#422462]' : 'text-[#5A4079] hover:bg-[#F0E9FF]/50 hover:text-[#5A4079]'}`}>
              <Headphones className="mr-2 h-4 w-4" /><span className="text-sm">Support</span>
            </Button>
          </Link>
        </div>
      </div>
 
      <div className={`transition-all duration-300 pt-16 ${sidebarOpen ? 'lg:pl-64' : 'pl-0'}`}>
        <div className="p-6">
 
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