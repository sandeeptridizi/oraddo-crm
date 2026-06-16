import { useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Button } from "./components/ui/button";
import { LogOut } from "lucide-react";
import { Login } from "./components/login";
import { Signup } from "./components/signup";
import api from "./api";

type UserType = "organization" | "admin" | "employee";
type AuthScreen =
  | "login"
  | "signup";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [signupRole, setSignupRole] = useState<"user" | "admin" | "employee">("user");

  const handleLogin = (type: UserType) => {
    setUserType(type);
    setIsAuthenticated(true);
    // Store in sessionStorage for persistence
    sessionStorage.setItem("userType", type);
    sessionStorage.setItem("isAuthenticated", "true");
    
    // Navigate to appropriate portal based on user type
    if (type === "admin") {
      window.location.href = "/admin/dashboard";
    } else if (type === "employee") {
      window.location.href = "/employee/dashboard";
    } else {
      window.location.href = "/app/dashboard";
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/signout");
    } catch (error) {
      console.error("Signout failed", error);
    }

    setIsAuthenticated(false);
    setUserType(null);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userType");
    sessionStorage.removeItem("isAuthenticated");
    window.location.href = "/";
  };

  // Check sessionStorage on mount
  useEffect(() => {
    const storedAuth = sessionStorage.getItem("isAuthenticated");
    const storedUserType = sessionStorage.getItem("userType");
    if (storedAuth === "true" && storedUserType) {
      setIsAuthenticated(true);
      setUserType(storedUserType as "organization" | "admin" | "employee");
    }
  }, []);

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    if (authScreen === "login") {
      return (
        <Login
          onLogin={handleLogin}
          onShowSignup={() => setAuthScreen("signup")}
        />
      );
    }

    return (
      <Signup
        role={signupRole}
        onShowLogin={() => setAuthScreen("login")}
        onSwitchRole={(role) => setSignupRole(role)}
      />
    );
  }

  // Provide auth context to router
  return (
    <>
      <RouterProvider router={router} />
      
      {/* Global Logout Button - Fixed in bottom left */}
      <Button
        onClick={handleLogout}
        className="fixed bottom-6 left-6 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-2xl shadow-red-600/50 px-6 py-3 rounded-full"
        title="Logout"
      >
        <LogOut className="h-5 w-5 mr-2" />
        Logout
      </Button>
    </>
  );
}
