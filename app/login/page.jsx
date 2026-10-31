"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateIdentifier } from "@/lib/validation";

export default function Login() {
  const router = useRouter();

  // Host Login Form Values
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Host 5-digit OTP state: { identifier, phone } | null
  const [otpState, setOtpState] = useState(null);
  const [otpInput, setOtpInput] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleIdentifierChange = (e) => {
    setIdentifier(e.target.value);
    if (fieldErrors.identifier) setFieldErrors({ ...fieldErrors, identifier: null });
    setErr("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
    setErr("");
  };

  // Stage 1: Submit Host Credentials (ID & Password)
  async function submitHostAuth(e) {
    e.preventDefault();
    setErr("");
    setInfoMsg("");

    const errors = {};
    const idCheck = validateIdentifier(identifier);
    if (!idCheck.isValid) {
      errors.identifier = idCheck.error;
    }
    if (!password) {
      errors.password = "Password is required for host access.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(data?.error || "Invalid credentials. Host access is restricted to clinic administration.");
      } else if (data?.requireOtp) {
        // Host login requires 5-digit verification sent to clinic phone
        setOtpState({
          identifier: identifier.trim(),
          phone: data.phone || "9101616156",
        });
        setInfoMsg(`A 5-digit verification code has been dispatched to clinic hotline +91 ${data.phone || "9101616156"}.`);
      } else {
        router.push(data?.role === "admin" ? "/admin" : "/book");
        router.refresh();
      }
    } catch {
      setErr("Network connection failed. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Stage 2: Submit 5-digit OTP / PIN Verification
  async function submitOtp(e) {
    e.preventDefault();
    setErr("");

    if (otpInput.trim().length !== 5) {
      setErr("Please enter the complete 5-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: otpState.identifier,
          otp: otpInput.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErr(data?.error || "Invalid or expired verification code.");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setErr("Network connection error. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP
  async function resendOtp() {
    setErr("");
    setInfoMsg("Resending 5-digit verification code...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpState.identifier, password }),
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

  const inputStyle = (hasError) =>
    `w-full border rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none transition-all disabled:bg-mist/30 disabled:cursor-not-allowed ${
      hasError
        ? "border-gum ring-1 ring-gum/30 focus:border-gum focus:ring-gum"
        : "border-ink/20 focus:ring-2 focus:ring-teal focus:border-teal"
    }`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* PATIENT NOTICE / QUICK LINK (NO LOGIN REQUIRED) */}
        <div className="bg-gradient-to-r from-teal/10 via-teal/5 to-white border border-teal/30 rounded-2xl p-4 sm:p-5 text-center shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal text-white text-[11px] font-bold uppercase tracking-wider mb-2">
            <span>🦷</span> Patient Portal
          </div>
          <h2 className="text-base font-extrabold text-ink">
            Are you a Patient looking to book?
          </h2>
          <p className="text-xs text-ink/70 mt-1 mb-3">
            Patients do <span className="font-bold text-ink">not</span> need to log in or create an account. You can select your slot and confirm directly in 30 seconds.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-ink text-white text-xs font-bold hover:bg-ink/90 transition-all shadow-sm"
          >
            <span>Book Appointment as Patient (No Login) →</span>
          </Link>
        </div>

        {/* HOST / DOCTOR LOGIN CARD */}
        <div className="bg-white border border-mist rounded-2xl p-6 sm:p-8 shadow-sm">
          {otpState ? (
            /* ========================================================= */
            /* VIEW 1: HOST 5-DIGIT OTP VERIFICATION */
            /* ========================================================= */
            <div className="space-y-6">
              <div className="text-center">
                <div
                  className="w-14 h-14 bg-teal/10 text-teal rounded-full flex items-center justify-center text-2xl mx-auto mb-3"
                  aria-hidden="true"
                >
                  🔐
                </div>
                <span className="text-[11px] font-bold tracking-widest text-teal uppercase bg-teal/10 px-2.5 py-0.5 rounded-full">
                  Host Two-Factor Verification
                </span>
                <h1 className="text-2xl font-extrabold text-ink mt-2">Enter 5-Digit Code</h1>
                <p className="text-xs text-ink/70 mt-1">
                  A verification code has been dispatched to Dr. Prachi Khetan's hotline{" "}
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
                <div role="status" className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                  {infoMsg}
                </div>
              )}

              <form onSubmit={submitOtp} className="space-y-4">
                <div>
                  <label htmlFor="otp-input" className="block text-xs font-bold text-ink mb-1 text-center">
                    Enter 5-Digit SMS Code or Clinic Master PIN
                  </label>
                  <input
                    id="otp-input"
                    name="otp"
                    type="text"
                    maxLength={5}
                    inputMode="numeric"
                    pattern="[0-9]{5}"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • •"
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 border-2 border-teal/40 rounded-xl bg-white focus:outline-none focus:border-teal focus:ring-4 focus:ring-teal/10 transition-all disabled:opacity-50"
                    autoFocus
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpInput.length !== 5}
                  className="w-full bg-teal text-white py-3 rounded-xl font-bold text-sm hover:bg-teal/90 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Verifying Host Session...</span>
                    </>
                  ) : (
                    <span>Verify & Enter Dashboard →</span>
                  )}
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
                  ← Back to Password
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
            /* VIEW 2: HOST / DOCTOR ID & PASSWORD FORM */
            /* ========================================================= */
            <>
              <div className="mb-6 text-center">
                <div
                  className="w-12 h-12 bg-teal/10 text-teal rounded-full flex items-center justify-center text-xl mx-auto mb-2.5 font-bold"
                  aria-hidden="true"
                >
                  🩺
                </div>
                <span className="text-[11px] font-bold tracking-wider text-teal uppercase bg-teal/10 px-2.5 py-0.5 rounded-full">
                  Host & Doctor Portal
                </span>
                <h1 className="text-2xl font-extrabold text-ink mt-2">Clinic Host Login</h1>
                <p className="text-xs text-ink/60 mt-1">
                  Enter your Doctor ID and password to access the schedule & dashboard.
                </p>
              </div>

              {err && (
                <div role="alert" className="mb-4 p-3 rounded-lg bg-gum/10 border border-gum/30 text-gum text-xs font-semibold">
                  {err}
                </div>
              )}

              {infoMsg && (
                <div role="status" className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                  {infoMsg}
                </div>
              )}

              <form onSubmit={submitHostAuth} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="identifier" className="block text-xs font-bold text-ink mb-1">
                    Doctor ID / Email Address
                  </label>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    className={inputStyle(fieldErrors.identifier)}
                    placeholder="dr.prachikhetan.bds18@gmail.com"
                    value={identifier}
                    onChange={handleIdentifierChange}
                    disabled={loading}
                    required
                  />
                  {fieldErrors.identifier && (
                    <p className="text-[11px] text-gum mt-1">{fieldErrors.identifier}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-xs font-bold text-ink">
                      Host Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      className="text-[11px] text-teal font-semibold hover:underline"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className={inputStyle(fieldErrors.password)}
                    placeholder="Enter host password"
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    required
                  />
                  {fieldErrors.password && (
                    <p className="text-[11px] text-gum mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-ink text-white py-3 rounded-lg font-bold text-sm hover:bg-ink/90 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Continue to OTP Verification →</span>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-mist text-center">
                <Link href="/" className="text-xs text-ink/50 hover:text-teal transition-colors">
                  ← Back to Homepage
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
