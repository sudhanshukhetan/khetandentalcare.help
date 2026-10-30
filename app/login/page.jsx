"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateEmail, validatePhone } from "@/lib/validation";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register" | "otp_login"
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [otpState, setOtpState] = useState(null); // { identifier, phone, role } | null
  const [otpInput, setOtpInput] = useState("");
  const [err, setErr] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const router = useRouter();

  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    if (fieldErrors[k]) {
      setFieldErrors({ ...fieldErrors, [k]: null });
    }
    setErr("");
  };

  // Validate form fields client-side before dispatching network requests
  const validateForm = () => {
    const errors = {};

    if (mode === "register") {
      if (!f.name || f.name.trim().length < 2) {
        errors.name = "Full name must be at least 2 characters.";
      }
      const emailCheck = validateEmail(f.email);
      if (!emailCheck.isValid) errors.email = emailCheck.error;

      const phoneCheck = validatePhone(f.phone);
      if (!phoneCheck.isValid) errors.phone = phoneCheck.error;

      if (!f.password || f.password.length < 8) {
        errors.password = "Password must be at least 8 characters.";
      }
    } else if (mode === "login") {
      if (!f.email || !f.email.trim()) {
        errors.email = "Please enter your registered email or 10-digit mobile number.";
      } else if (f.email.includes("@")) {
        const emailCheck = validateEmail(f.email);
        if (!emailCheck.isValid) errors.email = emailCheck.error;
      } else {
        const phoneCheck = validatePhone(f.email);
        if (!phoneCheck.isValid) errors.email = phoneCheck.error;
      }

      if (!f.password) {
        errors.password = "Password is required.";
      }
    } else if (mode === "otp_login") {
      const phoneCheck = validatePhone(f.phone);
      if (!phoneCheck.isValid) errors.phone = phoneCheck.error;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Password Login or Registration
  async function submit(e) {
    e.preventDefault();
    setErr("");
    setInfoMsg("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(data?.error || "Unable to complete login. Please check your credentials.");
      } else if (data?.requireOtp) {
        // Host / Doctor login requires 5-digit verification sent to clinic phone
        setOtpState({
          identifier: f.email,
          phone: data.phone || "9101616156",
          role: "admin",
        });
        setInfoMsg(`A 5-digit verification code has been dispatched to +91 ${data.phone || "9101616156"}.`);
      } else {
        router.push(data?.role === "admin" ? "/admin" : "/book");
        router.refresh();
      }
    } catch (networkErr) {
      console.error("[Login Fetch Exception]:", networkErr);
      setErr("Network connection failed. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Request Patient OTP Login (SMS to patient mobile number)
  async function requestPatientOtp(e) {
    e.preventDefault();
    setErr("");
    setInfoMsg("");

    const phoneCheck = validatePhone(f.phone);
    if (!phoneCheck.isValid) {
      setFieldErrors({ phone: phoneCheck.error });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneCheck.cleanPhone, role: "patient" }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(data?.error || "Failed to send verification SMS. Please try again.");
      } else {
        setOtpState({
          identifier: phoneCheck.cleanPhone,
          phone: phoneCheck.cleanPhone,
          role: "patient",
        });
        setInfoMsg(`A 5-digit verification code has been sent via SMS to +91 ${phoneCheck.cleanPhone}.`);
      }
    } catch (networkErr) {
      console.error("[Send OTP Fetch Exception]:", networkErr);
      setErr("Network connection error while requesting verification code.");
    } finally {
      setLoading(false);
    }
  }

  // Submit 5-digit OTP Verification
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
      const endpoint = otpState.role === "admin" ? "/api/auth/login" : "/api/auth/verify-otp";
      const payload =
        otpState.role === "admin"
          ? { email: otpState.identifier, otp: otpInput.trim() }
          : { phone: otpState.phone, otp: otpInput.trim() };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(data?.error || "Invalid or expired verification code.");
      } else {
        router.push(data?.role === "admin" ? "/admin" : "/book");
        router.refresh();
      }
    } catch (networkErr) {
      console.error("[Verify OTP Fetch Exception]:", networkErr);
      setErr("Network connection error. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  }

  // Resend 5-digit OTP
  async function resendOtp() {
    setErr("");
    setInfoMsg("Resending 5-digit verification code...");

    try {
      const endpoint = otpState.role === "admin" ? "/api/auth/login" : "/api/auth/send-otp";
      const payload =
        otpState.role === "admin"
          ? { email: otpState.identifier, password: f.password }
          : { phone: otpState.phone, role: "patient" };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setInfoMsg(`A fresh 5-digit code has been dispatched to +91 ${otpState.phone}!`);
      } else {
        setErr(data?.error || "Failed to resend code.");
      }
    } catch {
      setErr("Network error while resending verification code.");
    }
  }

  const fillDemo = (email, pass) => {
    setMode("login");
    setOtpState(null);
    setFieldErrors({});
    setF({ ...f, email, password: pass });
  };

  const inputStyle = (hasError) =>
    `w-full border rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none transition-all ${
      hasError
        ? "border-gum ring-1 ring-gum/30 focus:border-gum focus:ring-gum"
        : "border-ink/20 focus:ring-2 focus:ring-teal focus:border-teal"
    }`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-mist rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* ========================================================= */}
        {/* VIEW 1: SECURE 5-DIGIT OTP VERIFICATION (NO VISIBLE CODE) */}
        {/* ========================================================= */}
        {otpState ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-teal/10 text-teal rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                🔐
              </div>
              <span className="text-[11px] font-bold tracking-widest text-teal uppercase bg-teal/10 px-2.5 py-0.5 rounded-full">
                Security Verification
              </span>
              <h1 className="text-2xl font-extrabold text-ink mt-2">Enter 5-Digit Code</h1>
              <p className="text-xs text-ink/70 mt-1">
                A verification code has been dispatched via SMS to{" "}
                <span className="font-bold text-ink">
                  +91 {otpState.phone.slice(0, 3)}••••{otpState.phone.slice(-3)}
                </span>
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

            <form onSubmit={submitOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1 text-center">
                  Enter 5-Digit SMS Code
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
                {loading ? "Verifying..." : "Verify & Continue →"}
              </button>
            </form>

            <div className="flex items-center justify-between pt-2 border-t border-mist text-xs">
              <button
                type="button"
                onClick={() => {
                  setOtpState(null);
                  setOtpInput("");
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
                Resend SMS Code
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 2: AUTHENTICATION FORMS (LOGIN / REGISTER / SMS OTP) */
          /* ========================================================= */
          <>
            {/* Tab Switcher */}
            <div className="flex border-b border-mist mb-6 text-xs sm:text-sm font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErr("");
                  setFieldErrors({});
                }}
                className={`flex-1 pb-3 border-b-2 transition-all ${
                  mode === "login" ? "border-teal text-teal" : "border-transparent text-ink/50 hover:text-ink"
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("otp_login");
                  setErr("");
                  setFieldErrors({});
                }}
                className={`flex-1 pb-3 border-b-2 transition-all ${
                  mode === "otp_login" ? "border-teal text-teal" : "border-transparent text-ink/50 hover:text-ink"
                }`}
              >
                Mobile OTP Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErr("");
                  setFieldErrors({});
                }}
                className={`flex-1 pb-3 border-b-2 transition-all ${
                  mode === "register" ? "border-teal text-teal" : "border-transparent text-ink/50 hover:text-ink"
                }`}
              >
                Register
              </button>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-ink">
                {mode === "login" && "Log In to Your Account"}
                {mode === "otp_login" && "Login with Mobile OTP"}
                {mode === "register" && "Create Patient Account"}
              </h1>
              <p className="text-xs text-ink/60 mt-1">
                {mode === "login" && "Enter your registered email or 10-digit mobile number and password."}
                {mode === "otp_login" && "We'll send a 5-digit verification code to your Indian mobile number."}
                {mode === "register" && "Register with genuine details to manage your dental appointments."}
              </p>
            </div>

            {err && (
              <div role="alert" className="mb-4 p-3 rounded-lg bg-gum/10 border border-gum/30 text-gum text-xs font-semibold">
                {err}
              </div>
            )}

            {/* FORM A: PASSWORD LOGIN & REGISTER */}
            {mode !== "otp_login" && (
              <form onSubmit={submit} className="space-y-4">
                {mode === "register" && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Full Name</label>
                      <input
                        className={inputStyle(fieldErrors.name)}
                        placeholder="e.g. Rahul Bora"
                        value={f.name}
                        onChange={set("name")}
                        required
                      />
                      {fieldErrors.name && (
                        <p className="text-[11px] text-gum mt-1">{fieldErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Mobile Number (10 Digits)</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-ink/20 bg-mist/50 text-xs font-semibold text-ink/70">
                          +91
                        </span>
                        <input
                          className={`${inputStyle(fieldErrors.phone)} rounded-l-none`}
                          type="tel"
                          placeholder="e.g. 9864012345"
                          inputMode="numeric"
                          maxLength={10}
                          value={f.phone}
                          onChange={set("phone")}
                          required
                        />
                      </div>
                      {fieldErrors.phone && (
                        <p className="text-[11px] text-gum mt-1">{fieldErrors.phone}</p>
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    {mode === "register" ? "Email Address" : "Email or 10-Digit Mobile Number"}
                  </label>
                  <input
                    className={inputStyle(fieldErrors.email)}
                    type="text"
                    placeholder={mode === "register" ? "e.g. rahul@gmail.com" : "e.g. rahul@gmail.com or 9864012345"}
                    value={f.email}
                    onChange={set("email")}
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-[11px] text-gum mt-1">{fieldErrors.email}</p>
                  )}
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
                    className={inputStyle(fieldErrors.password)}
                    type={showPassword ? "text" : "password"}
                    placeholder="8+ characters"
                    value={f.password}
                    onChange={set("password")}
                    required
                  />
                  {fieldErrors.password && (
                    <p className="text-[11px] text-gum mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-ink text-white py-3 rounded-lg font-bold text-sm hover:bg-ink/90 transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? "Processing..." : mode === "login" ? "Log In" : "Register & Continue"}
                </button>
              </form>
            )}

            {/* FORM B: PATIENT MOBILE OTP LOGIN */}
            {mode === "otp_login" && (
              <form onSubmit={requestPatientOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">
                    Your Registered Mobile Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-ink/20 bg-mist/50 text-xs font-semibold text-ink/70">
                      +91
                    </span>
                    <input
                      className={`${inputStyle(fieldErrors.phone)} rounded-l-none`}
                      type="tel"
                      placeholder="e.g. 9864012345"
                      inputMode="numeric"
                      maxLength={10}
                      value={f.phone}
                      onChange={set("phone")}
                      required
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="text-[11px] text-gum mt-1">{fieldErrors.phone}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal text-white py-3 rounded-lg font-bold text-sm hover:bg-teal/90 transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? "Sending SMS Code..." : "Send 5-Digit Verification Code"}
                </button>
              </form>
            )}

            {/* Demo Credentials Auto-Fill for Testing */}
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
                  <div className="text-[9px] text-teal font-semibold mt-1">SMS OTP to 9101616156</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemo("rahul@gmail.com", "Password@123")}
                  className="p-2.5 rounded-lg border border-mist bg-mist/40 text-left hover:bg-mist transition-colors"
                >
                  <div className="font-bold text-ink">👤 Demo Patient</div>
                  <div className="text-[10px] text-ink/60 mt-0.5 truncate">rahul@gmail.com</div>
                  <div className="text-[9px] text-ink/50 font-semibold mt-1">9864012345</div>
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
