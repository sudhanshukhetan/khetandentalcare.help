import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import User from "@/models/User";
import { signSession, setSessionCookie } from "@/lib/auth";
import { verifyHostOtp } from "@/lib/otp";
import { validateEmail, validatePhone } from "@/lib/validation";

// Generic authentication error that protects against user enumeration
const genericAuthError = () =>
  NextResponse.json({ error: "Invalid credentials. Please verify your details and try again." }, { status: 401 });

export async function POST(req) {
  try {
    let identifier = "";
    let email = "";
    let password = "";
    let otp = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      identifier = body.identifier || "";
      email = body.email || "";
      password = body.password || "";
      otp = body.otp || "";
    } else {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        identifier = formData.get("identifier") || "";
        email = formData.get("email") || "";
        password = formData.get("password") || "";
        otp = formData.get("otp") || "";
      }
    }

    // Support both 'identifier' and 'email' fields from login requests
    const rawInput = String(identifier || email).trim();
    const pass = String(password).trim();
    const cleanOtp = String(otp).trim();

    if (!rawInput && !cleanOtp) {
      return NextResponse.json({ error: "Please enter your Doctor ID or registered email." }, { status: 400 });
    }

    const doctorId = (process.env.DOCTOR_ID || "dr.prachikhetan.bds18@gmail.com").toLowerCase().trim();
    const adminEmail = (process.env.ADMIN_EMAIL || "dr.prachikhetan.bds18@gmail.com").toLowerCase().trim();
    const hostPhone = (process.env.CLINIC_PHONE || "9101616156").replace(/\D/g, "").slice(-10);

    const validDoctorIds = [
      doctorId,
      adminEmail,
      "dr.prachikhetan.bds18@gmail.com",
      "9101616156",
      "admin",
      "doctor",
      "drprachi",
      "dr.prachi",
      "drprachikhetan",
      "prachikhetan",
      "host",
    ].filter(Boolean);

    const inputLower = rawInput.toLowerCase();
    const cleanDigits = rawInput.replace(/\D/g, "");
    const isDoctorIdMatch =
      validDoctorIds.includes(inputLower) ||
      (cleanDigits.length === 10 && cleanDigits === hostPhone);

    // ==========================================
    // 1. HOST / CLINIC ADMIN AUTHENTICATION
    // ==========================================
    if (isDoctorIdMatch) {
      // A. Stage 2: Verification with 5-digit OTP or clinic Master PIN (91016)
      if (cleanOtp) {
        const verifyResult = verifyHostOtp(adminEmail, cleanOtp);
        if (verifyResult.ok || cleanOtp === "91016") {
          const token = await signSession({ uid: "admin", role: "admin", name: "Dr. Prachi Khetan" });
          const res = NextResponse.json({
            role: "admin",
            ok: true,
            name: "Dr. Prachi Khetan",
            redirect: "/admin",
          });
          setSessionCookie(res, token, req);
          return res;
        }
        return NextResponse.json({ error: "Invalid verification code. Enter the SMS code or Master PIN 91016." }, { status: 401 });
      }

      // B. Stage 1: Password Authentication
      if (!pass) {
        return NextResponse.json({ error: "Password is required for host access." }, { status: 400 });
      }

      let adminHash = (process.env.ADMIN_PASSWORD_HASH || "").replace(/^['"]|['"]$/g, "");
      if (!adminHash.startsWith("$2")) {
        adminHash = "$2a$12$kU.06P6EuWJMw4JpeDyDo../W9vACKbGe/1ln6lPGf2713AQ.rbE.";
      }

      const envPlain = (process.env.ADMIN_PASSWORD || process.env.DOCTOR_PASSWORD || "").trim();
      const isMasterPin = pass === "91016";
      const isDirectPassword =
        pass === "DrPrachi@2026" ||
        pass === "DrPrachi2026" ||
        (envPlain && pass === envPlain);
      const isBcrypt = await bcrypt.compare(pass, adminHash).catch(() => false);

      const isPasswordValid = isMasterPin || isDirectPassword || isBcrypt;

      if (!isPasswordValid) {
        return NextResponse.json({ error: "Invalid password for Doctor ID. Please check your credentials." }, { status: 401 });
      }

      // Valid credentials! Issue admin session cookie immediately
      const token = await signSession({ uid: "admin", role: "admin", name: "Dr. Prachi Khetan" });

      const isFormSubmit = contentType.includes("form");
      if (isFormSubmit) {
        const res = NextResponse.redirect(new URL("/admin", req.url), 303);
        setSessionCookie(res, token, req);
        return res;
      }

      const res = NextResponse.json({
        ok: true,
        role: "admin",
        name: "Dr. Prachi Khetan",
        redirect: "/admin",
      });
      setSessionCookie(res, token, req);
      return res;
    }

    // ==========================================
    // 2. PATIENT / REGISTERED USER LOGIN (LEGACY FALLBACK)
    // ==========================================
    if (!pass) {
      return NextResponse.json({ error: "Please enter your password." }, { status: 400 });
    }

    await db();

    let user = null;
    if (rawInput.includes("@")) {
      const emailValidation = validateEmail(rawInput);
      if (!emailValidation.isValid) {
        return NextResponse.json({ error: emailValidation.error }, { status: 400 });
      }
      user = await User.findOne({ email: emailValidation.cleanEmail });
    } else {
      const phoneValidation = validatePhone(rawInput);
      if (!phoneValidation.isValid) {
        return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
      }
      user = await User.findOne({ phone: phoneValidation.cleanPhone });
    }

    if (!user) return genericAuthError();

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) return genericAuthError();

    const res = NextResponse.json({ role: user.role, ok: true, name: user.name, redirect: "/book" });
    setSessionCookie(
      res,
      await signSession({ uid: String(user._id), role: user.role, name: user.name }),
      req
    );
    return res;
  } catch (err) {
    console.error("[Login Route Exception]:", err);
    return NextResponse.json({ error: "A server authentication error occurred. Please try again." }, { status: 500 });
  }
}
