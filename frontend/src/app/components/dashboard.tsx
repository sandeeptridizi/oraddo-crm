import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Activity, CheckCircle2, TrendingUp, Users, DollarSign, Target, Briefcase, UserPlus, Calendar, Clock, Cake, UserCheck, UserX, Gift, Sparkles, FileText, User, X, Filter, RefreshCcw, Download, Search, ChevronRight, AlertCircle, Phone, Mail, LogIn, LogOut, Timer } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart } from "recharts";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { attendanceService } from "../services/attendanceService";
import { leadService } from "../services/leadService";
import { projectService } from "../services/projectService";
import { employeeService } from "../services/employeeService";
import { invoiceService, revenueService } from "../services/revenueService";
import { meetingService } from "../services/meetingService";
import { jobService } from "../services/jobService";

// Component Constants
const statusColors = {
  leads: ["#5A4079", "#422462", "#937CB4", "#200B43"],
  projects: ["#422462", "#937CB4", "#5A4079"]
};

export function Dashboard({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [punchActivity, setPunchActivity] = useState<any[]>([]);
  const [jobOpenings, setJobOpenings] = useState<any[]>([]);
  const [leadData, setLeadData] = useState<any[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [projectData, setProjectData] = useState<any[]>([
    { status: "On Track", count: 0, color: "#422462" },
    { status: "At Risk", count: 0, color: "#937CB4" },
    { status: "Delayed", count: 0, color: "#5A4079" },
  ]);
  
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    male: 0,
    female: 0
  });

  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    currentMonthRevenue: 0,
    currentMonthExpenses: 0,
    previousMonthRevenue: 0,
    revenueTrendPct: 0
  });

  const [selectedBirthday, setSelectedBirthday] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showPunchInModal, setShowPunchInModal] = useState(false);
  const [showPunchOutModal, setShowPunchOutModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState<Date | null>(null);
  const [punchOutTime, setPunchOutTime] = useState<Date | null>(null);
  const [workingHours, setWorkingHours] = useState("00:00:00");

  const [currentUser, setCurrentUser] = useState<{
    name: string;
    employeeId: string;
    department: string;
    designation: string;
    email: string;
    phone: string;
    organizationId?: number;
  }>({
    name: "Loading...",
    employeeId: "EMP-000",
    department: "...",
    designation: "...",
    email: "...",
    phone: "..."
  });

  const { totalRevenue, totalExpenses, currentMonthRevenue } = revenueStats;
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : "0.0";

  const totalLeads = leadData.reduce((sum, item) => sum + (item.count || 0), 0);
  const totalProjects = projectData.reduce((sum, item) => sum + (item.count || 0), 0);
  const totalApplications = jobOpenings.reduce((sum, item) => sum + (item.applications_count || 0), 0);

  // Initials for the topbar avatar — derived from the logged-in user's name
  const currentUserInitials = currentUser.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "U";

  const genderData = [
    { name: "Male", value: employeeStats.male, color: "#422462" },
    { name: "Female", value: employeeStats.female, color: "#937CB4" },
  ];

  // Unique departments for the filter dropdown — derived from the punch activity feed
  const availableDepartments = Array.from(
    new Set(punchActivity.map((a) => a.department).filter(Boolean))
  );

  useEffect(() => {
    const data = sessionStorage.getItem("userData");
    if (data) {
      const parsedUser = JSON.parse(data);
      setCurrentUser({
        name: parsedUser.fullName,
        employeeId: `EMP-${parsedUser.id}`,
        department: parsedUser.department || "General",
        designation: parsedUser.role || "User",
        email: parsedUser.email,
        phone: parsedUser.phoneNumber || "N/A",
        organizationId: parsedUser.organizationId
      });
    }
  }, []);

  useEffect(() => {
    if (currentUser.organizationId !== undefined) {
      fetchDashboardData();
    }
  }, [currentUser.organizationId]);

  const fetchDashboardData = async () => {
    if (!currentUser.organizationId) return;
    
    setIsRefreshing(true);
    try {
      const orgId = typeof currentUser.organizationId === 'string' ? parseInt(currentUser.organizationId) : currentUser.organizationId;

      // Parallel data fetching — settled independently so one restricted/failing
      // widget (e.g. a plan-gated module) doesn't blank out the whole dashboard.
      const sourceNames = ["attendance", "leads", "projects", "employees", "invoices", "revenue", "meetings", "jobs"];
      const settled = await Promise.allSettled([
        attendanceService.getTodaysTeamStatus(orgId),
        leadService.getLeadsByOrg(orgId),
        projectService.getProjectsByOrg(orgId),
        employeeService.getEmployeesByOrg(orgId),
        invoiceService.getByOrg(orgId),
        revenueService.getByOrg(orgId),
        meetingService.getMeetingsByOrg(orgId),
        jobService.getJobsByOrg(orgId)
      ]);

      const [
        attendanceRes,
        leadsRes,
        projectsRes,
        empRes,
        invoiceRes,
        revenueRes,
        meetingRes,
        jobRes
      ] = settled.map((result, i) => {
        if (result.status === "rejected") {
          console.error(`Dashboard: ${sourceNames[i]} fetch failed`, result.reason);
          return { data: [] };
        }
        return result.value;
      });

      // 1. Process Employees & Demographics
      const allEmps = empRes.data || [];
      const maleCount = allEmps.filter((e: any) => e.gender?.toLowerCase() === 'male').length;
      const femaleCount = allEmps.length - maleCount;
      
      setEmployeeStats({
        total: allEmps.length,
        present: attendanceRes.data?.length || 0,
        absent: Math.max(0, allEmps.length - (attendanceRes.data?.length || 0)),
        male: maleCount,
        female: femaleCount
      });

      // 2. Process Birthday List
      const today = new Date();
      const todayBirthdays = allEmps.filter((e: any) => {
        if (!e.date_of_birth) return false;
        const dob = new Date(e.date_of_birth);
        return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
      }).map((e: any) => ({
        id: e.id,
        name: e.emp_name,
        department: e.department,
        age: today.getFullYear() - new Date(e.date_of_birth).getFullYear(),
        avatar: e.emp_name.split(' ').map((n:any) => n[0]).join(''),
        email: e.personal_email,
        phone: e.phone_number,
        wished: false
      }));
      setBirthdays(todayBirthdays);

      // 3. Process Leads
      // getLeadsByOrg returns { data, totalRows, ... }, so the rows live under .data.data.
      const leads = leadsRes.data?.data || leadsRes.data || [];
      const leadCounts = [
        { status: "New", count: leads.filter((l:any) => l.status === 'New').length, color: "#5A4079" },
        { status: "Qualified", count: leads.filter((l:any) => l.status === 'Qualified').length, color: "#422462" },
        { status: "Contacted", count: leads.filter((l:any) => l.status === 'Contacted').length, color: "#937CB4" },
        { status: "Converted", count: leads.filter((l:any) => l.status === 'Converted').length, color: "#200B43" },
      ];
      setLeadData(leadCounts);

      // 4. Process Projects
      const projects = projectsRes.data || [];
      const projCounts = [
        { status: "On Track", count: projects.filter((p:any) => p.status === 'On Track').length, color: "#422462" },
        { status: "At Risk", count: projects.filter((p:any) => p.status === 'At Risk').length, color: "#937CB4" },
        { status: "Delayed", count: projects.filter((p:any) => p.status === 'Delayed').length, color: "#5A4079" },
      ];
      setProjectData(projCounts);

      // 5. Process Attendance Feed
      // Build a quick lookup of employees by name so we can pull real department
      const empByName = new Map<string, any>();
      allEmps.forEach((e: any) => {
        if (e.emp_name) empByName.set(String(e.emp_name).trim().toLowerCase(), e);
      });
      const activities = attendanceRes.data?.map((a: any) => {
        const emp = a.emp_name
          ? empByName.get(String(a.emp_name).trim().toLowerCase())
          : null;
        return {
          id: a.id,
          name: a.emp_name,
          type: a.punch_out_time ? "out" : "in",
          time: formatTime(a.punch_in_time),
          status: "on-time",
          department: emp?.department || a.department || "General"
        };
      }) || [];
      setPunchActivity(activities);

      // 6. Process Revenue & Chart (Rolling 6 Months)
      // getByOrg returns { invoices, totalInvoice }, so the rows live under .data.invoices.
      const invoices = invoiceRes.data?.invoices || invoiceRes.data || [];
      const revenues = revenueRes.data || [];
      
      const totalRevValue = invoices.reduce((sum: number, inv: any) => sum + (parseFloat(inv.Total) || 0), 0);
      const totalExpValue = revenues.reduce((sum: number, rev: any) => sum + (parseFloat(rev.total_debit) || 0), 0);

      // Calculate Current Month
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const currentMonthRevenue = invoices
        .filter((inv: any) => {
          const invDate = new Date(inv.Date);
          return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
        })
        .reduce((sum: number, inv: any) => sum + (parseFloat(inv.Total) || 0), 0);

      // Previous month revenue for trend %
      const prevDate = new Date(currentYear, currentMonth - 1, 1);
      const previousMonthRevenue = invoices
        .filter((inv: any) => {
          const invDate = new Date(inv.Date);
          return invDate.getMonth() === prevDate.getMonth() && invDate.getFullYear() === prevDate.getFullYear();
        })
        .reduce((sum: number, inv: any) => sum + (parseFloat(inv.Total) || 0), 0);

      const revenueTrendPct = previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : 0;

      setRevenueStats({
        totalRevenue: totalRevValue,
        totalExpenses: totalExpValue,
        currentMonthRevenue,
        currentMonthExpenses: 0, // Default or calculate similarly from revenues
        previousMonthRevenue,
        revenueTrendPct
      });

      // Rolling 6-month aggregation
      const rollingData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const m = d.getMonth();
        const y = d.getFullYear();

        const monthRev = invoices
          .filter((inv: any) => {
            const invDate = new Date(inv.Date || inv.createdAt);
            return invDate.getMonth() === m && invDate.getFullYear() === y;
          })
          .reduce((sum: number, inv: any) => sum + (parseFloat(inv.Total) || 0), 0);

        const monthExp = revenues
          .filter((rev: any) => {
            const revDate = new Date(rev.date || rev.createdAt);
            return revDate.getMonth() === m && revDate.getFullYear() === y;
          })
          .reduce((sum: number, rev: any) => sum + (parseFloat(rev.total_debit) || 0), 0);

        rollingData.push({ month: monthName, revenue: monthRev, expenses: monthExp });
      }
      setRevenueChartData(rollingData);

      // 7. Process Meetings & Events
      // getMeetingsByOrg returns { success, data }, so the rows live under .data.data.
      const meetings = meetingRes.data?.data || meetingRes.data || [];
      setEvents(meetings.map((m: any) => ({
        id: m.id,
        title: m.summary || m.title || 'Untitled Meeting',
        time: formatTime(m.start_time),
        type: 'meeting',
        attendees: m.attendees ?? m.participants ?? 0,
        location: m.location || 'Online',
        status: m.status || 'upcoming'
      })));

      // 8. Process Jobs
      const jobs = jobRes.data || [];
      setJobOpenings(jobs.map((j: any) => ({
        id: j.id,
        title: j.title,
        applications: j.applications_count || 0,
        department: j.department,
        status: j.status,
        posted: j.posted_date
      })));

    } catch (error) {
      console.error("Dashboard data fetch failed", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchDashboardData();
    }, 60000); // Refresh every minute
    return () => clearInterval(refreshInterval);
  }, [currentUser.organizationId]);

  // Tick the working-hours counter every second while punched in
  useEffect(() => {
    if (!isPunchedIn || !punchInTime) {
      setWorkingHours("00:00:00");
      return;
    }
    const tick = () => {
      const diffMs = Date.now() - punchInTime.getTime();
      const totalSec = Math.max(0, Math.floor(diffMs / 1000));
      const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
      const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
      const s = String(totalSec % 60).padStart(2, "0");
      setWorkingHours(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isPunchedIn, punchInTime]);

  const handleWishBirthday = (id: number) => {
    setBirthdays(birthdays.map(b => 
      b.id === id ? { ...b, wished: true } : b
    ));
    setSelectedBirthday(null);
    alert(`Birthday wish sent to ${birthdays.find(b => b.id === id)?.name}! 🎉`);
  };

  const handleEventAction = (id: number, action: string) => {
    setEvents(events.map(e => 
      e.id === id ? { ...e, status: action } : e
    ));
    setSelectedEvent(null);
    alert(`You have ${action === 'accepted' ? 'accepted' : 'declined'} the event!`);
  };

  const handleViewApplications = (job: any) => {
    setSelectedJob(job);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleExport = () => {
    const data = {
      timestamp: currentTime.toISOString(),
      employees: employeeStats,
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: profit,
      leads: totalLeads,
      projects: totalProjects
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${currentTime.toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('Dashboard report exported successfully!');
  };

  const handlePunchIn = async () => {
    try {
      if (!currentUser.organizationId) {
        alert("Organization ID not found. Please log in again.");
        return;
      }
      const empId = parseInt(currentUser.employeeId.split('-')[1]);
      await attendanceService.punchIn({ 
        employeeId: empId, 
        organizationId: currentUser.organizationId 
      });
      
      const now = new Date();
      setPunchInTime(now);
      setIsPunchedIn(true);
      setPunchOutTime(null);
      setShowPunchInModal(true);
      fetchDashboardData(); // Refresh list
    } catch (error) {
      console.error("Punch in failed", error);
      alert("Punch in failed. Please try again.");
    }
  };

  const handlePunchOut = async () => {
    try {
      if (!currentUser.organizationId) return;
      const empId = parseInt(currentUser.employeeId.split('-')[1]);
      await attendanceService.punchOut({ 
        employeeId: empId, 
        organizationId: currentUser.organizationId 
      });

      const now = new Date();
      setPunchOutTime(now);
      setIsPunchedIn(false);
      setShowPunchOutModal(true);
      fetchDashboardData(); // Refresh list
    } catch (error) {
      console.error("Punch out failed", error);
      alert("Punch out failed. Please try again.");
    }
  };

  const filteredPunchActivity = punchActivity.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || activity.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const formatTime = (date: Date | null | undefined) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#200B43] via-[#422462] to-[#937CB4] bg-clip-text text-transparent">
            Business Intelligence Dashboard
          </h1>
          <div className="flex items-center gap-3 text-sm text-[#5A4079] mt-2">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(currentTime)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTime(currentTime)}
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              Live
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-[#F0E9FF] to-transparent border border-[#937CB4]/30">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#422462] to-[#937CB4] flex items-center justify-center text-white text-sm font-bold shadow-lg">
              {currentUserInitials}
            </div>
            <div>
              <p className="text-sm font-bold text-[#200B43]">{currentUser.name}</p>
              <p className="text-xs text-[#5A4079]">{currentUser.employeeId}</p>
            </div>
            {isPunchedIn && (
              <div className="ml-3 pl-3 border-l border-[#937CB4]/30">
                <p className="text-xs text-blue-700 font-semibold">Working</p>
                <p className="text-sm font-bold text-blue-900 font-mono">{workingHours}</p>
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            className="border-[#937CB4] text-[#422462] hover:bg-[#F0E9FF]"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {!isPunchedIn ? (
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg"
              onClick={handlePunchIn}
            >
              <LogIn className="h-5 w-5 mr-2" />
              Punch In
            </Button>
          ) : (
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg"
              onClick={handlePunchOut}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Punch Out
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="gradient-card gradient-card-hover border-[#937CB4]/30 cursor-pointer transform transition-all hover:scale-105"
          onClick={() => setShowAttendanceModal(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#200B43]">Total Employees</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#422462] to-[#200B43] flex items-center justify-center shadow-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#200B43]">{employeeStats.total}</div>
            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1 text-green-600 font-semibold">
                <UserCheck className="h-3 w-3" />
                {employeeStats.present} Present
              </span>
              <span className="flex items-center gap-1 text-red-600 font-semibold">
                <UserX className="h-3 w-3" />
                {employeeStats.absent} Absent
              </span>
            </div>
            <div className="mt-2 text-xs text-[#5A4079]">
              Male: {employeeStats.male} • Female: {employeeStats.female}
            </div>
          </CardContent>
        </Card>

        <Card 
          className="gradient-card gradient-card-hover border-[#937CB4]/30 cursor-pointer transform transition-all hover:scale-105"
          onClick={() => onNavigate?.('finance-revenue')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#200B43]">Total Revenue</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#5A4079] to-[#422462] flex items-center justify-center shadow-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#200B43]">₹{(totalRevenue / 1000000).toFixed(2)}M</div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`flex items-center gap-1 text-xs font-semibold ${
                  revenueStats.revenueTrendPct >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                <TrendingUp className="h-3 w-3" />
                {revenueStats.revenueTrendPct >= 0 ? "+" : ""}
                {revenueStats.revenueTrendPct.toFixed(1)}%
              </span>
              <span className="text-xs text-[#5A4079]">vs last month</span>
            </div>
            <div className="mt-2 text-xs text-[#5A4079]">
              This month: ₹{(currentMonthRevenue / 1000).toFixed(0)}K
            </div>
          </CardContent>
        </Card>
        <Card 
          className="gradient-card gradient-card-hover border-[#937CB4]/30 cursor-pointer transform transition-all hover:scale-105"
          onClick={() => onNavigate?.('lead-generation')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#200B43]">Total Leads</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#937CB4] to-[#5A4079] flex items-center justify-center shadow-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#200B43]">{totalLeads}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                <CheckCircle2 className="h-3 w-3" />
                {leadData.find((l) => l.status === "Qualified")?.count ?? 0} Qualified
              </span>
            </div>
            <div className="mt-2 text-xs text-[#5A4079]">
              Conversion: {totalLeads > 0
                ? Math.round(
                    ((leadData.find((l) => l.status === "Converted")?.count || 0) /
                      totalLeads) *
                      100
                  )
                : 0}
              % • {leadData.find((l) => l.status === "Converted")?.count ?? 0} Converted
            </div>
          </CardContent>
        </Card>

        <Card 
          className="gradient-card gradient-card-hover border-[#937CB4]/30 cursor-pointer transform transition-all hover:scale-105"
          onClick={() => onNavigate?.('project-kanban')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[#200B43]">Active Projects</CardTitle>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#422462] to-[#937CB4] flex items-center justify-center shadow-lg animate-gradient">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#200B43]">{totalProjects}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                <CheckCircle2 className="h-3 w-3" />
                {projectData[0].count} On Track
              </span>
            </div>
            <div className="mt-2 text-xs text-[#5A4079]">
              {projectData[1].count} at risk • {projectData[2].count} delayed
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        <Card className="gradient-card border-[#937CB4]/30">
          <CardHeader>
            <CardTitle className="text-lg text-[#200B43] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#422462]" />
              Gender Distribution
            </CardTitle>
            <CardDescription className="text-[#5A4079]">Employee demographics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`gender-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  key="gender-tooltip"
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '2px solid #937CB4',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {genderData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-[#F0E9FF]/30">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-[#200B43]">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-[#422462]">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-[#937CB4]/30 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-[#200B43] flex items-center gap-2">
              <Cake className="h-5 w-5 text-[#422462]" />
              Today's Birthdays ({birthdays.length})
            </CardTitle>
            <CardDescription className="text-[#5A4079]">Celebrate with your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {birthdays.map((person) => (
                <div key={person.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#F0E9FF] to-transparent border border-[#937CB4]/20 hover:border-[#937CB4]/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#422462] to-[#937CB4] flex items-center justify-center text-white font-bold shadow-lg">
                      {person.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-[#200B43]">{person.name}</p>
                      <p className="text-xs text-[#5A4079]">{person.department} • {person.age} years</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-[#937CB4] text-[#422462]"
                      onClick={() => setSelectedBirthday(person)}
                    >
                      <User className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      className={`${person.wished ? 'bg-green-600' : 'bg-gradient-to-r from-[#422462] to-[#937CB4]'} text-white`}
                      onClick={() => !person.wished && handleWishBirthday(person.id)}
                      disabled={person.wished}
                    >
                      <Gift className="h-4 w-4 mr-2" />
                      {person.wished ? 'Wished!' : 'Wish'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="gradient-card border-[#937CB4]/30">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-lg text-[#200B43] flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#422462]" />
                Recent Attendance Activity
              </CardTitle>
              <CardDescription className="text-[#5A4079]">Real-time punch tracking</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#5A4079]" />
                <Input 
                  placeholder="Search employee..." 
                  className="pl-8 w-48 border-[#937CB4]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="px-3 py-2 border border-[#937CB4] rounded-md text-sm text-[#422462] bg-white"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="all">All Departments</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {filteredPunchActivity.map((activity) => (
              <div key={activity.id} className="p-4 rounded-xl bg-gradient-to-br from-[#F0E9FF]/50 to-transparent border border-[#937CB4]/20 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    activity.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {activity.type === 'in' ? 'Punch In' : 'Punch Out'}
                  </div>
                  <span className={`text-xs font-semibold ${
                    activity.status === 'on-time' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {activity.status === 'on-time' ? '✓ On Time' : '⚠ Late'}
                  </span>
                </div>
                <p className="font-semibold text-[#200B43] mb-1">{activity.name}</p>
                <p className="text-xs text-[#5A4079] mb-2">{activity.department}</p>
                <div className="flex items-center gap-1 text-xs text-[#5A4079]">
                  <Clock className="h-3 w-3" />
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
          {filteredPunchActivity.length === 0 && (
            <div className="text-center py-8 text-[#5A4079]">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No attendance records found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gradient-card border-[#937CB4]/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-[#200B43] flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#422462]" />
                Revenue & Expenses Overview
              </CardTitle>
              <CardDescription className="text-[#5A4079] mt-1">6-month financial performance (INR)</CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#5A4079]">Net Profit</p>
              <p className="text-2xl font-bold text-green-600">₹{(profit / 1000).toFixed(0)}K</p>
              <p className="text-xs text-[#5A4079]">Margin: {profitMargin}%</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={revenueChartData}>
              <defs key="revenue-defs">
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#422462" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#422462" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid key="revenue-grid" strokeDasharray="3 3" stroke="#937CB4" opacity={0.1} />
              <XAxis key="revenue-xaxis" dataKey="month" stroke="#5A4079" style={{ fontSize: '12px' }} />
              <YAxis key="revenue-yaxis" stroke="#5A4079" style={{ fontSize: '12px' }} />
              <Tooltip 
                key="revenue-tooltip"
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '2px solid #937CB4',
                  borderRadius: '10px',
                  padding: '10px',
                  boxShadow: '0 4px 12px rgba(147, 124, 180, 0.15)'
                }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
              <Legend key="revenue-legend" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area key="revenue-area" type="monotone" dataKey="revenue" stroke="#422462" fill="url(#revenueGradient)" strokeWidth={2} name="Revenue" />
              <Bar key="expenses-bar" dataKey="expenses" fill="#937CB4" radius={[6, 6, 0, 0]} name="Expenses" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gradient-card border-[#937CB4]/30">
          <CardHeader>
            <CardTitle className="text-lg text-[#200B43] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#422462]" />
              Upcoming Meetings & Events ({events.filter(e => e.status === 'upcoming').length})
            </CardTitle>
            <CardDescription className="text-[#5A4079]">Today's schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#F0E9FF]/50 to-transparent border border-[#937CB4]/20 hover:border-[#937CB4]/40 transition-all cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    event.type === 'meeting' ? 'bg-gradient-to-br from-[#5A4079] to-[#422462]' : 'bg-gradient-to-br from-[#937CB4] to-[#5A4079]'
                  } text-white shadow-md`}>
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[#200B43]">{event.title}</p>
                    <div className="flex items-center gap-3 text-xs text-[#5A4079] mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.attendees}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      event.type === 'meeting' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {event.type}
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#937CB4]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-[#937CB4]/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-[#200B43] flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#422462]" />
                  Job Openings ({jobOpenings.length})
                </CardTitle>
                <CardDescription className="text-[#5A4079]">Active positions</CardDescription>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#422462]">{totalApplications}</p>
                <p className="text-xs text-[#5A4079]">Applications</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobOpenings.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-[#F0E9FF]/50 to-transparent border border-[#937CB4]/20 hover:border-[#937CB4]/40 transition-all">
                  <div className="flex-1">
                    <p className="font-semibold text-[#200B43]">{job.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-[#5A4079]">{job.department}</p>
                      <span className="text-xs text-[#937CB4]">• {job.posted}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#422462]">{job.applications}</p>
                      <p className="text-xs text-[#5A4079]">Applications</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-[#422462] to-[#937CB4] text-white"
                      onClick={() => handleViewApplications(job)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="gradient-card border-[#937CB4]/30">
          <CardHeader>
            <CardTitle className="text-lg text-[#200B43] flex items-center gap-2">
              <Target className="h-5 w-5 text-[#422462]" />
              Lead Management ({totalLeads})
            </CardTitle>
            <CardDescription className="text-[#5A4079]">Lead pipeline status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leadData.map((item, index) => {
                const percentage = ((item.count / totalLeads) * 100).toFixed(1);
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="font-semibold text-[#200B43]">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-[#5A4079]">{percentage}%</span>
                        <span className="text-lg font-bold text-[#422462]">{item.count}</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#F0E9FF] rounded-full h-2 cursor-pointer hover:h-3 transition-all">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: item.color 
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-[#937CB4]/30">
          <CardHeader>
            <CardTitle className="text-lg text-[#200B43] flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#422462]" />
              Project Overview ({totalProjects})
            </CardTitle>
            <CardDescription className="text-[#5A4079]">Current project status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={projectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {projectData.map((entry, index) => (
                      <Cell key={`project-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    key="project-tooltip"
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '2px solid #937CB4',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-2">
                {projectData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-[#F0E9FF]/30 hover:bg-[#F0E9FF]/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-[#200B43]">{item.status}</span>
                    </div>
                    <span className="text-sm font-bold text-[#422462]">{item.count} Projects</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedBirthday} onOpenChange={() => setSelectedBirthday(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#200B43] flex items-center gap-2">
              <User className="h-5 w-5 text-[#422462]" />
              Employee Details
            </DialogTitle>
          </DialogHeader>
          {selectedBirthday && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#422462] to-[#937CB4] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedBirthday.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#200B43]">{selectedBirthday.name}</h3>
                  <p className="text-sm text-[#5A4079]">{selectedBirthday.department}</p>
                  <div className="flex items-center gap-1 text-sm text-[#422462] mt-1">
                    <Cake className="h-4 w-4" />
                    {selectedBirthday.age} years old today
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 pt-4 border-t border-[#937CB4]/20">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-[#5A4079]" />
                  <span className="text-[#200B43]">{selectedBirthday.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-[#5A4079]" />
                  <span className="text-[#200B43]">{selectedBirthday.phone}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  className="flex-1 bg-gradient-to-r from-[#422462] to-[#937CB4] text-white"
                  onClick={() => handleWishBirthday(selectedBirthday.id)}
                  disabled={selectedBirthday.wished}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  {selectedBirthday.wished ? 'Wished!' : 'Send Birthday Wish'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#200B43] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#422462]" />
              {selectedEvent?.type === 'meeting' ? 'Meeting Details' : 'Event Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="text-xl font-bold text-[#200B43] mb-2">{selectedEvent.title}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-[#5A4079]" />
                    <span className="text-[#200B43]">{selectedEvent.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-[#5A4079]" />
                    <span className="text-[#200B43]">{selectedEvent.attendees} attendees</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-[#5A4079]" />
                    <span className="text-[#200B43]">{selectedEvent.location}</span>
                  </div>
                </div>
              </div>

              {selectedEvent.status === 'upcoming' && (
                <div className="flex gap-2 pt-4 border-t border-[#937CB4]/20">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-[#422462] to-[#937CB4] text-white"
                    onClick={() => handleEventAction(selectedEvent.id, 'accepted')}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 border-[#937CB4] text-[#422462]"
                    onClick={() => handleEventAction(selectedEvent.id, 'declined')}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              )}
              {selectedEvent.status !== 'upcoming' && (
                <div className={`p-3 rounded-lg text-center ${
                  selectedEvent.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  You have {selectedEvent.status} this {selectedEvent.type}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#200B43] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#422462]" />
              Job Applications
            </DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="text-xl font-bold text-[#200B43] mb-1">{selectedJob.title}</h3>
                <p className="text-sm text-[#5A4079] mb-4">{selectedJob.department} • Posted {selectedJob.posted}</p>
                
                <div className="p-4 rounded-lg bg-gradient-to-br from-[#F0E9FF] to-transparent border border-[#937CB4]/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[#5A4079]">Total Applications</span>
                    <span className="text-2xl font-bold text-[#422462]">{selectedJob.applications}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#5A4079]">Shortlisted:</span>
                      <span className="font-semibold text-green-600">{Math.floor(selectedJob.applications * 0.3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5A4079]">Under Review:</span>
                      <span className="font-semibold text-blue-600">{Math.floor(selectedJob.applications * 0.5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#5A4079]">New:</span>
                      <span className="font-semibold text-orange-600">{Math.floor(selectedJob.applications * 0.2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-[#422462] to-[#937CB4] text-white"
                onClick={async () => {
                  if (!selectedJob?.id) {
                    setSelectedJob(null);
                    return;
                  }
                  try {
                    const res = await jobService.getJobById(selectedJob.id);
                    const detail = (res as any)?.data;
                    if (detail) {
                      setJobOpenings((prev) =>
                        prev.map((j) =>
                          j.id === selectedJob.id
                            ? { ...j, ...detail, applications: detail.applications_count ?? detail.applicants ?? j.applications }
                            : j
                        )
                      );
                    }
                  } catch (err) {
                    console.warn("Could not load full job details", err);
                  } finally {
                    setSelectedJob(null);
                    if (onNavigate) onNavigate("hr-job-management");
                  }
                }}
              >
                <ChevronRight className="h-4 w-4 mr-2" />
                View All Applications
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAttendanceModal} onOpenChange={setShowAttendanceModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#200B43] flex items-center gap-2">
              <Users className="h-5 w-5 text-[#422462]" />
              Employee Attendance Details
            </DialogTitle>
            <DialogDescription>
              Live attendance tracking for {formatDate(currentTime)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-gradient-to-br from-[#F0E9FF] to-transparent text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-[#422462]" />
                <p className="text-2xl font-bold text-[#200B43]">{employeeStats.total}</p>
                <p className="text-xs text-[#5A4079]">Total</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-transparent text-center">
                <UserCheck className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{employeeStats.present}</p>
                <p className="text-xs text-[#5A4079]">Present</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-transparent text-center">
                <UserX className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{employeeStats.absent}</p>
                <p className="text-xs text-[#5A4079]">Absent</p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-[#937CB4]/20">
              <h4 className="font-semibold text-[#200B43] mb-3">Attendance Rate</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#5A4079]">Present</span>
                  <span className="font-semibold text-[#200B43]">{((employeeStats.present / employeeStats.total) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-[#F0E9FF] rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all" 
                    style={{ width: `${(employeeStats.present / employeeStats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#937CB4]/20">
              <h4 className="font-semibold text-[#200B43] mb-3">Gender Distribution</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-[#F0E9FF] to-transparent">
                  <p className="text-sm text-[#5A4079] mb-1">Male Employees</p>
                  <p className="text-xl font-bold text-[#422462]">{employeeStats.male}</p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-[#F0E9FF] to-transparent">
                  <p className="text-sm text-[#5A4079] mb-1">Female Employees</p>
                  <p className="text-xl font-bold text-[#937CB4]">{employeeStats.female}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPunchInModal} onOpenChange={setShowPunchInModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#200B43] flex items-center gap-2">
              <LogIn className="h-5 w-5 text-[#422462]" />
              Punch In Confirmation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#422462] to-[#937CB4] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                HS
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#200B43]">{currentUser.name}</h3>
                <p className="text-sm text-[#5A4079]">{currentUser.department}</p>
                <div className="flex items-center gap-1 text-sm text-[#422462] mt-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(punchInTime!)}
                </div>
              </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-[#937CB4]/20">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-[#5A4079]" />
                <span className="text-[#200B43]">{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-[#5A4079]" />
                <span className="text-[#200B43]">{currentUser.phone}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-gradient-to-r from-[#422462] to-[#937CB4] text-white"
                onClick={() => setShowPunchInModal(false)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Punch In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPunchOutModal} onOpenChange={setShowPunchOutModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#200B43] flex items-center gap-2">
              <LogOut className="h-5 w-5 text-[#422462]" />
              Punch Out Confirmation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#422462] to-[#937CB4] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                HS
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#200B43]">{currentUser.name}</h3>
                <p className="text-sm text-[#5A4079]">{currentUser.department}</p>
                <div className="flex items-center gap-1 text-sm text-[#422462] mt-1">
                  <Clock className="h-4 w-4" />
                  {formatTime(punchOutTime!)}
                </div>
              </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t border-[#937CB4]/20">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-[#5A4079]" />
                <span className="text-[#200B43]">{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-[#5A4079]" />
                <span className="text-[#200B43]">{currentUser.phone}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1 bg-gradient-to-r from-[#422462] to-[#937CB4] text-white"
                onClick={() => setShowPunchOutModal(false)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm Punch Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}