"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateEmail, validatePhone, validateIdentifier } from "@/lib/validation";

export default function Login() {
  const router = useRouter();

  // "login" (default SSR mode) | "register" | "otp_login"
  const [mode, setMode] = useState("login");

  // Form values
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");

  // OTP Login & Host Verification states
  const [otpState, setOtpState] = useState(null); // { identifier, phone, role } | null
  const [otpInput, setOtpInput] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Clear specific field errors on user typing
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

  // Validate form fields client-side before dispatching network requests
  const validateCurrentForm = () => {
    const errors = {};

    if (mode === "login") {
      const idCheck = validateIdentifier(identifier);
      if (!idCheck.isValid) {
        errors.identifier = idCheck.error;
      }
      if (!password) {
        errors.password = "Password is required.";
      }
    } else if (mode === "register") {
      if (!name || name.trim().length < 2) {
        errors.name = "Full name must be at least 2 characters.";
      }
      const emailCheck = validateEmail(regEmail);
      if (!emailCheck.isValid) {
        errors.regEmail = emailCheck.error;
      }
      const phoneCheck = validatePhone(regPhone);
      if (!phoneCheck.isValid) {
        errors.regPhone = phoneCheck.error;
      }
      if (!password || password.length < 8) {
        errors.password = "Password must be at least 8 characters long.";
      }
    } else if (mode === "otp_login") {
      const phoneCheck = validatePhone(identifier);
      if (!phoneCheck.isValid) {
        errors.identifier = phoneCheck.error;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Password Login or Registration
  async function submitAuth(e) {
    e.preventDefault();
    setErr("");
    setInfoMsg("");

    if (!validateCurrentForm()) return;

    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: identifier.trim(), password }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setErr(data?.error || "Invalid credentials. Please verify your details and try again.");
        } else if (data?.requireOtp) {
          // Host / Doctor login requires 5-digit verification sent to clinic phone
          setOtpState({
            identifier: identifier.trim(),
            phone: data.phone || "9101616156",
            role: "admin",
          });
          setInfoMsg(`A 5-digit verification code has been dispatched to +91 ${data.phone || "9101616156"}.`);
        } else {
          router.push(data?.role === "admin" ? "/admin" : "/book");
          router.refresh();
        }
      } else if (mode === "register") {
        const phoneValidation = validatePhone(regPhone);
        const emailValidation = validateEmail(regEmail);

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: emailValidation.cleanEmail,
            phone: phoneValidation.cleanPhone,
            password,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setErr(data?.error || "Unable to complete registration. Please check your details.");
        } else {
          router.push("/book");
          router.refresh();
        }
      }
    } catch (networkErr) {
      console.error("[Auth Fetch Exception]:", networkErr);
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

    const phoneCheck = validatePhone(identifier);
    if (!phoneCheck.isValid) {
      setFieldErrors({ identifier: phoneCheck.error });
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
        setErr(data?.error || "Failed to dispatch verification SMS. Please try again.");
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

    if (otpInput.trim().length !== 5) {
      setErr("Please enter the complete 5-digit verification code.");
      return;
    }

    setLoading(true);

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
          ? { email: otpState.identifier, password }
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

  const inputStyle = (hasError) =>
    `w-full border rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none transition-all disabled:bg-mist/30 disabled:cursor-not-allowed ${
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
              <div className="w-14 h-14 bg-teal/10 text-teal rounded-full flex items-center justify-center text-2xl mx-auto mb-3" aria-hidden="true">
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
              <div role="status" className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                {infoMsg}
              </div>
            )}

            <form onSubmit={submitOtp} className="space-y-4">
              <div>
                <label htmlFor="otp-input" className="block text-xs font-bold text-ink mb-1 text-center">
                  Enter 5-Digit SMS Code
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
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify & Continue →</span>
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
            {/* Semantic Tab Switcher */}
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
                Mobile OTP
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
                {mode === "otp_login" && "Sign In with Mobile OTP"}
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

            {infoMsg && (
              <div role="status" className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                {infoMsg}
              </div>
            )}

            {/* FORM A: PASSWORD LOGIN & REGISTER (Clean Semantic SSR Form) */}
            {mode !== "otp_login" ? (
              <form onSubmit={submitAuth} className="space-y-4" noValidate>
                {mode === "register" && (
                  <>
                    <div>
                      <label htmlFor="reg-name" className="block text-xs font-bold text-ink mb-1">
                        Full Name
                      </label>
                      <input
                        id="reg-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        className={inputStyle(fieldErrors.name)}
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null });
                        }}
                        disabled={loading}
                        required
                      />
                      {fieldErrors.name && (
                        <p className="text-[11px] text-gum mt-1">{fieldErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="reg-phone" className="block text-xs font-bold text-ink mb-1">
                        Mobile Number (10 Digits)
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-ink/20 bg-mist/50 text-xs font-semibold text-ink/70">
                          +91
                        </span>
                        <input
                          id="reg-phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel-national"
                          inputMode="numeric"
                          maxLength={10}
                          className={`${inputStyle(fieldErrors.regPhone)} rounded-l-none`}
                          placeholder="10-digit mobile number"
                          value={regPhone}
                          onChange={(e) => {
                            setRegPhone(e.target.value);
                            if (fieldErrors.regPhone) setFieldErrors({ ...fieldErrors, regPhone: null });
                          }}
                          disabled={loading}
                          required
                        />
                      </div>
                      {fieldErrors.regPhone && (
                        <p className="text-[11px] text-gum mt-1">{fieldErrors.regPhone}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="reg-email" className="block text-xs font-bold text-ink mb-1">
                        Email Address
                      </label>
                      <input
                        id="reg-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        className={inputStyle(fieldErrors.regEmail)}
                        placeholder="yourname@example.com"
                        value={regEmail}
                        onChange={(e) => {
                          setRegEmail(e.target.value);
                          if (fieldErrors.regEmail) setFieldErrors({ ...fieldErrors, regEmail: null });
                        }}
                        disabled={loading}
                        required
                      />
                      {fieldErrors.regEmail && (
                        <p className="text-[11px] text-gum mt-1">{fieldErrors.regEmail}</p>
                      )}
                    </div>
                  </>
                )}

                {mode === "login" && (
                  <div>
                    <label htmlFor="identifier" className="block text-xs font-bold text-ink mb-1">
                      Email or 10-Digit Mobile Number
                    </label>
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="username"
                      className={inputStyle(fieldErrors.identifier)}
                      placeholder="Email address or 10-digit mobile number"
                      value={identifier}
                      onChange={handleIdentifierChange}
                      disabled={loading}
                      required
                    />
                    {fieldErrors.identifier && (
                      <p className="text-[11px] text-gum mt-1">{fieldErrors.identifier}</p>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-xs font-bold text-ink">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                      aria-pressed={showPassword}
                      className="text-[11px] text-teal font-semibold hover:underline"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className={inputStyle(fieldErrors.password)}
                    placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"}
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    required
                  />
                  {fieldErrors.password && (
                    <p className="text-[11px] text-gum mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                {mode === "login" && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-xs text-teal font-medium hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

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
                      <span>{mode === "login" ? "Authenticating..." : "Creating Account..."}</span>
                    </>
                  ) : (
                    <span>{mode === "login" ? "Log In" : "Register & Continue"}</span>
                  )}
                </button>
              </form>
            ) : (
              /* FORM B: PATIENT MOBILE OTP LOGIN */
              <form onSubmit={requestPatientOtp} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="otp-mobile" className="block text-xs font-bold text-ink mb-1">
                    Registered Mobile Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-ink/20 bg-mist/50 text-xs font-semibold text-ink/70">
                      +91
                    </span>
                    <input
                      id="otp-mobile"
                      name="phone"
                      type="tel"
                      autoComplete="tel-national"
                      inputMode="numeric"
                      maxLength={10}
                      className={`${inputStyle(fieldErrors.identifier)} rounded-l-none`}
                      placeholder="10-digit mobile number"
                      value={identifier}
                      onChange={handleIdentifierChange}
                      disabled={loading}
                      required
                    />
                  </div>
                  {fieldErrors.identifier && (
                    <p className="text-[11px] text-gum mt-1">{fieldErrors.identifier}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal text-white py-3 rounded-lg font-bold text-sm hover:bg-teal/90 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Sending SMS Code...</span>
                    </>
                  ) : (
                    <span>Send 5-Digit Verification Code</span>
                  )}
                </button>
              </form>
            )}

            {/* Helper links */}
            <div className="mt-8 pt-6 border-t border-mist/80 text-center space-y-3">
              <p className="text-xs text-ink/70">
                Don't have an account?{" "}
                <Link href="/book" className="text-teal font-bold hover:underline">
                  Book an appointment or Register
                </Link>
              </p>
              <div>
                <Link href="/" className="text-xs text-ink/50 hover:text-teal transition-colors">
                  ← Back to Homepage
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Forgot Password Accessible Modal */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-mist space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="forgot-modal-title" className="text-lg font-bold text-ink">
                Password Reset Help
              </h2>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-ink/40 hover:text-ink text-lg font-bold"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-ink/70 leading-relaxed">
              If you have forgotten your password, you can sign in directly using the{" "}
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setMode("otp_login");
                }}
                className="text-teal font-bold underline"
              >
                Mobile OTP Login
              </button>{" "}
              tab with your registered phone number.
            </p>
            <div className="p-3 bg-mist/50 rounded-xl text-xs space-y-1">
              <span className="font-bold text-ink block">Need Assistance?</span>
              <p className="text-ink/70">Contact Dr. Prachi Khetan's clinic reception:</p>
              <div className="pt-2 flex items-center gap-3">
                <a
                  href="tel:9101616156"
                  className="px-3 py-1.5 bg-ink text-white rounded-md text-xs font-bold hover:bg-ink/90"
                >
                  📞 Call 9101616156
                </a>
                <a
                  href="https://wa.me/919101616156?text=Hello%20Dr.%20Prachi,%20I%20need%20assistance%20resetting%20my%20patient%20portal%20password."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-bold hover:bg-emerald-700"
                >
                  WhatsApp
                </a>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2 bg-mist text-ink text-xs font-semibold rounded-lg hover:bg-mist/80"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
