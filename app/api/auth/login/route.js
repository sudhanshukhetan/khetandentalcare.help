import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import User from "@/models/User";
import { signSession, setSessionCookie } from "@/lib/auth";
import { generateFiveDigitOtp, saveHostOtp, verifyHostOtp } from "@/lib/otp";
import { sendHostOtp } from "@/lib/sms";
import { validateEmail, validatePhone } from "@/lib/validation";

const fail = (msg = "Incorrect email/mobile or password.") =>
  NextResponse.json({ error: msg }, { status: 401 });

export async function POST(req) {
  try {
    const body = await req.json();
    const { email = "", password = "", otp = "" } = body;

    const identifier = String(email).trim().toLowerCase();
    const pass = String(password).trim();

    const adminEmail = (process.env.ADMIN_EMAIL || "dr.prachikhetan.bds18@gmail.com").toLowerCase().trim();
    let adminHash = (process.env.ADMIN_PASSWORD_HASH || "").replace(/^['"]|['"]$/g, "");
    if (!adminHash.startsWith("$2")) {
      adminHash = "$2a$12$kU.06P6EuWJMw4JpeDyDo../W9vACKbGe/1ln6lPGf2713AQ.rbE.";
    }
    const hostPhone = (process.env.CLINIC_PHONE || "9101616156").replace(/\D/g, "").slice(-10);

    // ==========================================
    // 1. HOST / CLINIC ADMIN LOGIN FLOW
    // ==========================================
    if (identifier === adminEmail) {
      // Stage 2: Host Submits 5-Digit OTP
      if (otp) {
        const verifyResult = verifyHostOtp(identifier, otp);
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
      if (!isPasswordMatch) return fail();

      const generatedOtp = generateFiveDigitOtp();
      saveHostOtp(identifier, generatedOtp, { role: "admin", phone: hostPhone });

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
    if (identifier.includes("@")) {
      const emailValidation = validateEmail(identifier);
      if (!emailValidation.isValid) {
        return NextResponse.json({ error: emailValidation.error }, { status: 400 });
      }
      user = await User.findOne({ email: emailValidation.cleanEmail });
    } else {
      const phoneValidation = validatePhone(identifier);
      if (!phoneValidation.isValid) {
        return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
      }
      user = await User.findOne({ phone: phoneValidation.cleanPhone });
    }

    if (!user) {
      return fail("No patient account found with these details. Please create an account.");
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      return fail();
    }

    const res = NextResponse.json({ role: "patient", ok: true, name: user.name });
    setSessionCookie(res, await signSession({ uid: String(user._id), role: "patient", name: user.name }));
    return res;
  } catch (err) {
    console.error("[Login API Exception]:", err);
    return NextResponse.json(
      { error: "A server connection error occurred during login. Please try again." },
      { status: 500 }
    );
  }
}
