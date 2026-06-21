import { useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Button } from "./components/ui/button";
import { LogOut } from "lucide-react";
import api from "./api";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authHydrated, setAuthHydrated] = useState(false);

  // Hydrate auth from sessionStorage on mount (refresh-safe). The router's
  // RootRoute also reads sessionStorage directly, but tracking state here
  // controls the global Logout button visibility.
  useEffect(() => {
    const storedAuth = sessionStorage.getItem("isAuthenticated");
    if (storedAuth === "true") {
      setIsAuthenticated(true);
    }
    setAuthHydrated(true);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/signout");
    } catch (error) {
      console.error("Signout failed", error);
    }
    setIsAuthenticated(false);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userData");
    sessionStorage.removeItem("userType");
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("signupPending");
    window.location.href = "/";
  };

  return (
    <>
      <RouterProvider router={router} />

      {authHydrated && isAuthenticated && (
        <Button
          onClick={handleLogout}
          className="fixed bottom-6 left-6 z-50 bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-2xl shadow-red-600/50 px-6 py-3 rounded-full"
          title="Logout"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </Button>
      )}
    </>
  );
}
