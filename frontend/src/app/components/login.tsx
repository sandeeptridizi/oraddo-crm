import React, { useState } from "react";
import { Button } from "./ui/button";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import api from "../api";

type UserType = "organization" | "admin" | "employee";

interface LoginProps {
  onLogin: (userType: UserType) => void;
  onShowSignup?: () => void;
}

export function Login({ onLogin, onShowSignup }: LoginProps) {
const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

 
const getUserTypeFromRole = (role: string): UserType => {
    const r = String(role).toLowerCase();
    if (r.includes("admin")) return "admin";
    if (r.includes("organization")) return "organization";
    if (r.includes("manager") || r.includes("employee")) return "employee";
    return "organization";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.post("/api/auth/unified-login", { email, password });
      
      const responseData = response?.data as {
        token?: string;
        role?: string;
        user?: {
          id: number;
          fullName: string;
          email: string;
        };
      };

      if (responseData.token) {
        sessionStorage.setItem("token", responseData.token);
      }

      if (responseData.user) {
        sessionStorage.setItem("userData", JSON.stringify(responseData.user));
      }

      const nextType = getUserTypeFromRole(responseData.role || "organization");
      onLogin(nextType);
    } catch (error: any) {
      console.error("Signin failed", error);
      alert(error?.response?.data?.message || "Login failed. Please check your credentials.");
    }
  };

return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#F0E9FF] via-white to-[#F0E9FF]">
 
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#937CB4] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#5A4079] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-[#422462] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="absolute inset-0 ai-grid-bg opacity-30"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
 
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src="/favicon.png" alt="Oraddo" className="h-16 w-16 object-contain" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-4xl font-bold gradient-text">Oraddo</h1>
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-[#937CB4] to-[#5A4079] text-xs font-bold text-white shadow-lg">
                AI
              </div>
            </div>
            <p className="text-[#5A4079] text-sm">Intelligent Business Management System</p>
          </div>
 
          <div className="relative overflow-hidden rounded-2xl border border-[#937CB4]/20 bg-white/90 backdrop-blur-xl shadow-2xl p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#937CB4]/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-[#200B43] mb-2">
                Welcome Back
              </h2>
              <p className="text-[#5A4079] text-sm mb-6">
                Sign in to access your Oraddo workspace
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
 
                <div>
                  <label className="block text-sm font-medium text-[#200B43] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5A4079] z-10 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-[#937CB4]/20 bg-white/90 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-[#937CB4] text-[#200B43] transition-all"
                    />
                  </div>
                </div>
 
                <div>
                  <label className="block text-sm font-medium text-[#200B43] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5A4079] z-10 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-11 pr-12 py-3 rounded-lg border border-[#937CB4]/20 bg-white/90 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-[#937CB4] text-[#200B43] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-[#5A4079] hover:text-[#422462] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
 
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-[#937CB4]/30 text-[#422462] focus:ring-[#937CB4]"
                    />
                    <span className="text-sm text-[#5A4079]">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-[#422462] hover:text-[#200B43] font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
 
                <Button
                  type="submit"
                  className="w-full py-3 text-white shadow-lg transition-all bg-gradient-to-r from-[#200B43] to-[#422462] hover:from-[#422462] hover:to-[#200B43] shadow-[#422462]/30"
                >
                  Sign In
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
 

<div className="text-center text-sm text-[#5A4079]">
                  <span>New to Oraddo? </span>
                  <button
                    type="button"
                    onClick={onShowSignup}
                    className="font-semibold text-[#422462] hover:text-[#200B43] transition-colors"
                  >
                    Create account
                  </button>
                </div>
              </form>
            </div>
          </div>
 
          <div className="mt-6 text-center text-xs text-[#5A4079]">
            <p>© 2024 Oraddo AI. All rights reserved.</p>
            <p className="mt-1">Made in India 🇮🇳</p>
          </div>
        </div>
      </div>
    </div>
  );
}