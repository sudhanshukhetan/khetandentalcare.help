"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [otpState, setOtpState] = useState(null); // { phone, simulatedOtp } | null
  const [otpInput, setOtpInput] = useState("");
  const [err, setErr] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Handle Initial Login or Register Submit
  async function submit(e) {
    e.preventDefault();
    setErr("");
    setInfoMsg("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Authentication failed. Please check your details.");
      } else if (data.requireOtp) {
        // Host login requires 5-digit OTP sent to 9101616156
        setOtpState({
          phone: data.phone || "9101616156",
          simulatedOtp: data.simulatedOtp,
        });
        setInfoMsg(`A 5-digit verification code was sent to ${data.phone || "9101616156"}.`);
        if (data.simulatedOtp) {
          setOtpInput(data.simulatedOtp); // Auto-fill for seamless local development
        }
      } else {
        router.push(data.role === "admin" ? "/admin" : "/book");
        router.refresh();
      }
    } catch {
      setErr("Network connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Handle OTP Verification Submit
  async function submitOtp(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    if (otpInput.trim().length !== 5) {
      setErr("Please enter the complete 5-digit verification code.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: f.email,
          otp: otpInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Invalid 5-digit verification code.");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setErr("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
  async function resendOtp() {
    setErr("");
    setInfoMsg("Resending 5-digit code to 9101616156...");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (res.ok && data.requireOtp) {
        setOtpState({ phone: data.phone, simulatedOtp: data.simulatedOtp });
        setInfoMsg(`New 5-digit code sent to ${data.phone}!`);
        if (data.simulatedOtp) setOtpInput(data.simulatedOtp);
      } else {
        setErr(data.error || "Failed to resend code.");
      }
    } catch {
      setErr("Failed to contact server.");
    }
  }

  // Quick fill helper for demo/testing
  const fillDemo = (email, pass) => {
    setMode("login");
    setOtpState(null);
    setF({ ...f, email, password: pass });
  };

  const inputStyle =
    "w-full border border-ink/20 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal transition-all";

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-mist rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* VIEW 1: 5-DIGIT OTP VERIFICATION SCREEN */}
        {otpState ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-teal/10 text-teal rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                🔐
              </div>
              <span className="text-[11px] font-bold tracking-widest text-teal uppercase bg-teal/10 px-2.5 py-0.5 rounded-full">
                Two-Factor Security
              </span>
              <h1 className="text-2xl font-extrabold text-ink mt-2">Enter Host Verification Code</h1>
              <p className="text-xs text-ink/70 mt-1">
                A 5-digit security code has been dispatched to{" "}
                <span className="font-bold text-ink">+{otpState.phone}</span>
              </p>
            </div>

            {err && (
              <div role="alert" className="p-3 rounded-lg bg-gum/10 border border-gum/30 text-gum text-xs font-semibold">
                {err}
              </div>
            )}

            {infoMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                {infoMsg}
              </div>
            )}

            {otpState.simulatedOtp && (
              <div className="p-3 bg-mist/60 rounded-lg border border-mist text-center">
                <span className="text-[11px] text-ink/60 block">Host OTP Code (Development SMS Preview):</span>
                <span className="font-mono text-xl font-black text-teal tracking-widest mt-0.5 block">
                  {otpState.simulatedOtp}
                </span>
              </div>
            )}

            <form onSubmit={submitOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1 text-center">
                  5-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={5}
                  inputMode="numeric"
                  pattern="[0-9]{5}"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • •"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 border-2 border-teal/40 rounded-xl bg-white focus:outline-none focus:border-teal focus:ring-4 focus:ring-teal/10 transition-all"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpInput.length !== 5}
                className="w-full bg-teal text-white py-3 rounded-xl font-bold text-sm hover:bg-teal/90 transition-all shadow-md disabled:opacity-50"
              >
                {loading ? "Verifying Code..." : "Verify & Enter Dashboard →"}
              </button>
            </form>

            <div className="flex items-center justify-between pt-2 border-t border-mist text-xs">
              <button
                type="button"
                onClick={() => {
                  setOtpState(null);
                  setErr("");
                  setInfoMsg("");
                }}
                className="text-ink/60 hover:text-ink font-medium"
              >
                ← Back to Login
              </button>

              <button
                type="button"
                onClick={resendOtp}
                className="text-teal font-bold hover:underline"
              >
                Resend 5-digit Code
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 2: NORMAL LOGIN & REGISTRATION SCREEN */
          <>
            {/* Tab Switcher */}
            <div className="flex border-b border-mist mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErr("");
                }}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                  mode === "login" ? "border-teal text-teal" : "border-transparent text-ink/50 hover:text-ink"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErr("");
                }}
                className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                  mode === "register" ? "border-teal text-teal" : "border-transparent text-ink/50 hover:text-ink"
                }`}
              >
                New Patient Register
              </button>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-ink">
                {mode === "login" ? "Welcome Back" : "Create Patient Account"}
              </h1>
              <p className="text-xs text-ink/60 mt-1">
                {mode === "login"
                  ? "Access appointment bookings and history with Dr. Prachi Khetan."
                  : "Register once to schedule visits and track your dental appointments."}
              </p>
            </div>

            {err && (
              <div role="alert" className="mb-4 p-3 rounded-lg bg-gum/10 border border-gum/30 text-gum text-xs font-semibold">
                {err}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">Full Name</label>
                    <input
                      className={inputStyle}
                      placeholder="e.g. Rahul Bora"
                      value={f.name}
                      onChange={set("name")}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1">Mobile Phone</label>
                    <input
                      className={inputStyle}
                      type="tel"
                      placeholder="10-digit mobile number"
                      inputMode="numeric"
                      pattern="^[6-9]\d{9}$"
                      value={f.phone}
                      onChange={set("phone")}
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Email Address</label>
                <input
                  className={inputStyle}
                  type="email"
                  placeholder="e.g. patient@gmail.com"
                  value={f.email}
                  onChange={set("email")}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-ink">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-teal font-semibold hover:underline"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  className={inputStyle}
                  type={showPassword ? "text" : "password"}
                  placeholder="8+ characters"
                  value={f.password}
                  onChange={set("password")}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-ink text-white py-3 rounded-lg font-bold text-sm hover:bg-ink/90 transition-all shadow-sm disabled:opacity-50"
              >
                {loading ? "Processing..." : mode === "login" ? "Log In" : "Register & Continue"}
              </button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-8 pt-6 border-t border-mist/80">
              <p className="text-[11px] font-bold text-ink/50 uppercase tracking-wider mb-2">
                Quick Sign-In (Click to Auto-fill):
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillDemo("dr.prachikhetan.bds18@gmail.com", "DrPrachi@2026")}
                  className="p-2.5 rounded-lg border border-teal/30 bg-teal/5 text-left hover:bg-teal/10 transition-colors"
                >
                  <div className="font-bold text-teal">👩‍⚕️ Doctor / Admin</div>
                  <div className="text-[10px] text-ink/60 mt-0.5 truncate">dr.prachikhetan...</div>
                  <div className="text-[9px] text-teal font-semibold mt-1">2FA OTP to 9101616156</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemo("rahul@gmail.com", "Password@123")}
                  className="p-2.5 rounded-lg border border-mist bg-mist/40 text-left hover:bg-mist transition-colors"
                >
                  <div className="font-bold text-ink">👤 Demo Patient</div>
                  <div className="text-[10px] text-ink/60 mt-0.5 truncate">rahul@gmail.com</div>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-xs text-ink/60 hover:text-teal transition-colors">
                ← Back to Homepage
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
