import { createBrowserRouter, Navigate } from "react-router";
import { NotFound } from "./components/not-found";
import AppLayout from "./layouts/app-layout";
import EmployeeLayout from "./layouts/employee-layout";
import AdminLayout from "./layouts/admin-layout";
import { SignupPage } from "./components/signup";
import { PricingPage } from "./components/pricing-page";
import { PaymentComplete } from "./components/payment-complete";
import { Login } from "./components/login";

// Main App Components
import { Dashboard } from "./components/dashboard";
import { BusinessDevelopment } from "./components/business-development";
import { BizDevProposal } from "./components/bizdev-proposal";
import { ProposalPreview } from "./components/proposal/proposal-preview";
import { BizDevInvoice } from "./components/bizdev-invoice";
import { InvoicePreview } from "./components/invoice/invoice-preview";
import { BizDevBilling } from "./components/bizdev-billing";
import { Marketing } from "./components/marketing";
import { MarketingCalendar } from "./components/marketing-calendar";
import { MarketingStrategies } from "./components/marketing-strategies";
import { MarketingBlogs } from "./components/marketing-blogs";
import { MarketingMeetings } from "./components/marketing-meetings";
import { Finance } from "./components/finance";
import { FinanceExpense } from "./components/finance-expense";
import { FinanceFinancial } from "./components/finance-financial";
import { FinanceRevenue } from "./components/finance-revenue";
import { HumanResources } from "./components/human-resources";
import { HRAttendance } from "./components/hr-attendance";
import { HRSelfService } from "./components/hr-self-service";
import { HRExpenses } from "./components/hr-expenses";
import { ProjectManagement } from "./components/project-management";
import { ProjectKanban } from "./components/project-kanban";
import { ProjectCompleted } from "./components/project-completed";
import { ProjectTasks } from "./components/project-tasks";
import { LeadGeneration } from "./components/lead-generation";
import { Support } from "./components/support";
import { Notes } from "./components/notes";
import { Chat } from "./components/chat";
import { Notifications } from "./components/notifications";
import { Profile } from "./components/profile";
import { HRJobManagement } from "./components/hr-job-management";
import { HROrgResignationManagement } from "./components/hr-org-management";
import { HROrgHRPanel } from "./components/hr-panel-config";
import { HROrgLeaveManagement } from "./components/hr-leave-system";
import { HROrgAttendanceManagement } from "./components/hr-attendance-system";
import { HROrgOnboarding } from "./components/hr-onboarding-system";
import { HRSalariesManagement } from "./components/hr-salaries-management";
import { HRTeamPerformanceManagement } from "./components/hr-team-performance";
import { HROrgSalaryAdvance } from "./components/hr-org-management";
import { Diagnostics } from "./components/diagnostics";
import { HRPerformanceMetrics, HRSalaryStructure, HRResignation } from "./components/hr-all-remaining";
import { OrganizationSettings } from "./components/organization-settings";
import { BillingSubscription } from "./components/billing-subscription";

// Admin Components
import { AdminDashboard } from "./components/admin/admin-dashboard";
import { AdminUsers } from "./components/admin/admin-users";
import { AdminFinancials } from "./components/admin/admin-financials";
import { AdminPlans } from "./components/admin/admin-plans";
import { AdminCoupons } from "./components/admin/admin-coupons";
import { AdminQueries } from "./components/admin/admin-queries";
import { AdminSettings } from "./components/admin/admin-settings";

// Pick the right landing page based on the current auth state. The session is
// stored in sessionStorage by login.tsx and pricing-page.tsx on success.
function RootRoute() {
  const authed = sessionStorage.getItem("isAuthenticated") === "true";
  const userType = sessionStorage.getItem("userType");
  if (!authed) {
    return (
      <Login
        onLogin={(type) => {
          if (type === "admin") window.location.href = "/admin/dashboard";
          else if (type === "employee") window.location.href = "/employee/dashboard";
          else window.location.href = "/app/dashboard";
        }}
        onShowSignup={() => { window.location.href = "/signup"; }}
      />
    );
  }
  if (userType === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (userType === "employee") return <Navigate to="/employee/dashboard" replace />;
  return <Navigate to="/app/dashboard" replace />;
}

export const router = createBrowserRouter([
  // Root: pick a destination based on auth state. Authenticated users go to
  // their portal; everyone else gets the login screen with a "Create account"
  // link that navigates to /signup.
  { index: true, path: "/", element: <RootRoute /> },

  // Main App Routes
  {
    path: "app",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      
      // Business Development
      { path: "business-development", element: <BusinessDevelopment /> },
      { path: "business-development/proposal", element: <BizDevProposal /> },
      { path: "business-development/proposal/:id", element: <ProposalPreview /> },
      { path: "business-development/invoice", element: <BizDevInvoice /> },
      { path: "business-development/invoice/:id", element: <InvoicePreview /> },
      { path: "business-development/billing", element: <BizDevBilling /> },

      // Marketing
      { path: "marketing", element: <Marketing /> },
      { path: "marketing/calendar", element: <MarketingCalendar /> },
      { path: "marketing/strategies", element: <MarketingStrategies /> },
      { path: "marketing/blogs", element: <MarketingBlogs /> },
      { path: "marketing/meetings", element: <MarketingMeetings /> },

      // HR
      { path: "hr", element: <HumanResources /> },
      { path: "hr/attendance", element: <HRAttendance /> },
      { path: "hr/self-service", element: <HRSelfService /> },
      { path: "hr/performance-metrics", element: <HRPerformanceMetrics /> },
      { path: "hr/salary-structure", element: <HRSalaryStructure /> },
      { path: "hr/resignation", element: <HRResignation /> },
      { path: "hr/expenses", element: <HRExpenses /> },
      { path: "hr/job-management", element: <HRJobManagement /> },
      
      // HR Organization Management
      { path: "hr/organization/resignation-management", element: <HROrgResignationManagement /> },
      { path: "hr/organization/hr-panel", element: <HROrgHRPanel /> },
      { path: "hr/organization/leave-management", element: <HROrgLeaveManagement /> },
      { path: "hr/organization/attendance-management", element: <HROrgAttendanceManagement /> },
      { path: "hr/organization/onboarding", element: <HROrgOnboarding /> },
      { path: "hr/organization/salaries", element: <HRSalariesManagement /> },
      { path: "hr/organization/team-performance", element: <HRTeamPerformanceManagement /> },
      { path: "hr/organization/salary-advance", element: <HROrgSalaryAdvance /> },
      
      // Finance
      { path: "finance", element: <Finance /> },
      { path: "finance/expense", element: <FinanceExpense /> },
      { path: "finance/financial", element: <FinanceFinancial /> },
      { path: "finance/revenue", element: <FinanceRevenue /> },
      
      // Project Management
      { path: "project", element: <ProjectManagement /> },
      { path: "project/kanban", element: <ProjectKanban /> },
      { path: "project/completed", element: <ProjectCompleted /> },
      { path: "project/tasks", element: <ProjectTasks /> },
      
      // Lead Generation
      { path: "lead-generation", element: <LeadGeneration /> },
      
      // Utilities
      { path: "notes", element: <Notes /> },
      { path: "chat", element: <Chat /> },
      { path: "notifications", element: <Notifications /> },
      { path: "profile", element: <Profile /> },
      { path: "settings/organization", element: <OrganizationSettings /> },
      { path: "settings/billing", element: <BillingSubscription /> },
      { path: "support", element: <Support /> },
      { path: "diagnostics", element: <Diagnostics /> },
    ],
  },

  // Employee Portal Routes (No Finance, No Organization Management)
  {
    path: "employee",
    element: <EmployeeLayout />,
    children: [
      { index: true, element: <Navigate to="/employee/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      
      // Business Development
      { path: "business-development", element: <BusinessDevelopment /> },
      { path: "business-development/proposal", element: <BizDevProposal /> },
      { path: "business-development/invoice", element: <BizDevInvoice /> },
      { path: "business-development/invoice/:id", element: <InvoicePreview /> },
      { path: "business-development/billing", element: <BizDevBilling /> },

      // Marketing
      { path: "marketing", element: <Marketing /> },
      { path: "marketing/calendar", element: <MarketingCalendar /> },
      { path: "marketing/strategies", element: <MarketingStrategies /> },
      { path: "marketing/blogs", element: <MarketingBlogs /> },
      { path: "marketing/meetings", element: <MarketingMeetings /> },

      // HR (No Organization Management)
      { path: "hr", element: <HumanResources /> },
      { path: "hr/attendance", element: <HRAttendance /> },
      { path: "hr/performance-metrics", element: <HRPerformanceMetrics /> },
      { path: "hr/salary-structure", element: <HRSalaryStructure /> },
      { path: "hr/resignation", element: <HRResignation /> },
      { path: "hr/expenses", element: <HRExpenses /> },
      { path: "hr/job-management", element: <HRJobManagement /> },
      
      // Project Management
      { path: "project", element: <ProjectManagement /> },
      { path: "project/kanban", element: <ProjectKanban /> },
      { path: "project/completed", element: <ProjectCompleted /> },
      { path: "project/tasks", element: <ProjectTasks /> },
      
      // Lead Generation
      { path: "lead-generation", element: <LeadGeneration /> },
      
      // Utilities
      { path: "notes", element: <Notes /> },
      { path: "chat", element: <Chat /> },
      { path: "notifications", element: <Notifications /> },
      { path: "profile", element: <Profile /> },
      { path: "support", element: <Support /> },
    ],
  },

  // Admin Portal Routes
  {
    path: "admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "users", element: <AdminUsers /> },
      { path: "financials", element: <AdminFinancials /> },
      { path: "plans", element: <AdminPlans /> },
      { path: "coupons", element: <AdminCoupons /> },
      { path: "queries", element: <AdminQueries /> },
      { path: "settings", element: <AdminSettings /> },
    ],
  },

  // Public signup funnel — mounted at the top level so unauthenticated visitors
  // can reach them via direct navigation. SignupPage self-guards by checking
  // sessionStorage for an existing signupToken and forwarding to /pricing.
  { path: "signup", element: <SignupPage /> },
  { path: "pricing", element: <PricingPage /> },
  { path: "payment-complete", element: <PaymentComplete /> },

  // 404 Not Found
  { path: "*", element: <NotFound /> },
]);