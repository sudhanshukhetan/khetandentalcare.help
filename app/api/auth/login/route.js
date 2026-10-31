import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import User from "@/models/User";
import { signSession, setSessionCookie } from "@/lib/auth";
import { generateFiveDigitOtp, saveHostOtp, verifyHostOtp } from "@/lib/otp";
import { sendHostOtp } from "@/lib/sms";
import { validateEmail, validatePhone } from "@/lib/validation";

// Generic authentication error that protects against user enumeration
const genericAuthError = () =>
  NextResponse.json({ error: "Invalid credentials. Please verify your details and try again." }, { status: 401 });

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email = "", identifier = "", password = "", otp = "" } = body;

    // Support both 'identifier' and 'email' fields from login requests
    const rawInput = String(identifier || email).trim();
    const pass = String(password).trim();

    if (!rawInput) {
      return NextResponse.json({ error: "Please enter your email or 10-digit mobile number." }, { status: 400 });
    }

    const doctorId = (process.env.DOCTOR_ID || process.env.ADMIN_EMAIL || "dr.prachikhetan.bds18@gmail.com").toLowerCase().trim();
    const adminEmail = (process.env.ADMIN_EMAIL || "dr.prachikhetan.bds18@gmail.com").toLowerCase().trim();
    let adminHash = (process.env.ADMIN_PASSWORD_HASH || "").replace(/^['"]|['"]$/g, "");
    if (!adminHash.startsWith("$2")) {
      adminHash = "$2a$12$kU.06P6EuWJMw4JpeDyDo../W9vACKbGe/1ln6lPGf2713AQ.rbE.";
    }
    const hostPhone = (process.env.CLINIC_PHONE || "9101616156").replace(/\D/g, "").slice(-10);

    const inputLower = rawInput.toLowerCase();

    // ==========================================
    // 1. HOST / CLINIC ADMIN LOGIN FLOW
    // ==========================================
    if (inputLower === doctorId || inputLower === adminEmail || rawInput === hostPhone) {
      // Stage 2: Host Submits 5-Digit OTP
      if (otp) {
        const verifyResult = verifyHostOtp(adminEmail, otp);
        if (!verifyResult.ok) {
          return NextResponse.json({ error: verifyResult.error }, { status: 401 });
        }

        // OTP Verified Successfully -> Issue Admin Session Cookie
        const res = NextResponse.json({ role: "admin", ok: true, name: "Dr. Prachi Khetan" });
        setSessionCookie(res, await signSession({ uid: "admin", role: "admin", name: "Dr. Prachi Khetan" }));
        return res;
      }

      // Stage 1: Password Check -> Dispatch 5-Digit OTP to 9101616156
      if (!pass) {
        return NextResponse.json({ error: "Password is required for host authentication." }, { status: 400 });
      }

      const isPasswordMatch = await bcrypt.compare(pass, adminHash);
      if (!isPasswordMatch) return genericAuthError();

      const generatedOtp = generateFiveDigitOtp();
      saveHostOtp(adminEmail, generatedOtp, { role: "admin", phone: hostPhone });

      // Dispatch OTP to clinic mobile number
      await sendHostOtp({ phone: hostPhone, otp: generatedOtp });

      // SECURE RESPONSE: OTP is never returned to frontend
      return NextResponse.json({
        requireOtp: true,
        phone: hostPhone,
        message: `A 5-digit verification code has been dispatched to +91 ${hostPhone}.`,
      });
    }

    // ==========================================
    // 2. PATIENT LOGIN FLOW
    // ==========================================
    if (!pass) {
      return NextResponse.json({ error: "Please enter your account password." }, { status: 400 });
    }

    // Connect to database
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

    // Consistent timing and generic error if user does not exist
    if (!user) {
      // Fake compare to maintain constant time resistance to timing attacks
      await bcrypt.compare(pass, "$2a$12$e8z90e09fe09wf0e9wf0e9wfe09wf0e9wfe09wf0e9wf0e9wfe09w");
      return genericAuthError();
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      return genericAuthError();
    }

    // Patient login successful -> issue session cookie
    const res = NextResponse.json({
      role: user.role || "patient",
      ok: true,
      name: user.name,
    });

    setSessionCookie(
      res,
      await signSession({
        uid: String(user._id),
        role: user.role || "patient",
        name: user.name,
      })
    );

    return res;
  } catch (err) {
    console.error("[Login API Route Exception]:", err);
    return NextResponse.json(
      { error: "A server connection error occurred. Please try again." },
      { status: 500 }
    );
  }
}
