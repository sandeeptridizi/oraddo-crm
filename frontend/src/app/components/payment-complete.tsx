import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export function PaymentComplete() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "failure">("loading");
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("status");
    const token = params.get("token");
    const userRaw = params.get("user");
    const failReason = params.get("reason");

    if (paymentStatus === "success" && token) {
      // Fresh signup flow — no existing session yet, so establish one from the token.
      try {
        const user = userRaw ? JSON.parse(decodeURIComponent(userRaw)) : {};
        sessionStorage.setItem("token", decodeURIComponent(token));
        sessionStorage.setItem("userData", JSON.stringify(user));
        sessionStorage.setItem("userType", "organization");
        sessionStorage.setItem("isAuthenticated", "true");
        try {
          localStorage.setItem("token", decodeURIComponent(token));
          localStorage.setItem("userData", JSON.stringify(user));
        } catch {}
        sessionStorage.removeItem("signupPending");
        setStatus("success");
        // Brief delay so user sees the success state before redirect
        setTimeout(() => {
          window.location.href = "/app/dashboard";
        }, 1500);
      } catch {
        setStatus("failure");
      }
    } else if (paymentStatus === "success") {
      // Renewal/upgrade flow — user is already logged in, no new token to apply.
      setStatus("success");
      setTimeout(() => {
        window.location.href = "/app/dashboard";
      }, 1500);
    } else {
      setStatus("failure");
      if (failReason === "already_processed") {
        setReason("This payment was already processed. Please log in.");
      } else if (failReason === "signup_not_found") {
        setReason("Signup record not found. Please register again.");
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FAF6FF] via-white to-[#F2E8FF]">
      <div className="bg-white rounded-3xl shadow-xl border border-[#E5DEF2] p-10 max-w-sm w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-[#937CB4] mx-auto mb-4" />
            <p className="text-[#5A4079] text-sm">Confirming your payment…</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#200B43] mb-2">Payment Successful!</h2>
            <p className="text-[#5A4079] text-sm">Taking you to your dashboard…</p>
          </>
        )}

        {status === "failure" && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#200B43] mb-2">Payment Failed</h2>
            <p className="text-[#5A4079] text-sm mb-6">
              {reason || "Your payment could not be completed. Please try again."}
            </p>
            <button
              type="button"
              onClick={() => navigate("/pricing")}
              className="w-full py-3 rounded-xl bg-[#1f0d3d] text-white text-sm font-semibold hover:bg-[#2a1450] transition-colors"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
