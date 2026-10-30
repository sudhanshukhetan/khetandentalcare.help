import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import User from "@/models/User";
import { signSession, setSessionCookie } from "@/lib/auth";
import { generateFiveDigitOtp, saveHostOtp, verifyHostOtp } from "@/lib/otp";
import { sendHostOtp } from "@/lib/sms";

const fail = (msg = "Incorrect email or password.") =>
  NextResponse.json({ error: msg }, { status: 401 });

export async function POST(req) {
  const { email = "", password = "", otp = "" } = await req.json();
  const e = email.toLowerCase().trim();
  const pass = String(password).trim();

  const adminEmail = (process.env.ADMIN_EMAIL || "dr.prachikhetan.bds18@gmail.com").toLowerCase().trim();
  let adminHash = (process.env.ADMIN_PASSWORD_HASH || "").replace(/^['"]|['"]$/g, "");
  if (!adminHash.startsWith("$2")) {
    adminHash = "$2a$12$kU.06P6EuWJMw4JpeDyDo../W9vACKbGe/1ln6lPGf2713AQ.rbE.";
  }
  const hostPhone = process.env.CLINIC_PHONE || "9101616156";

  // HOST / ADMIN LOGIN FLOW
  if (e === adminEmail) {
    // Stage 2: OTP Verification
    if (otp) {
      const verifyResult = verifyHostOtp(e, otp);
      if (!verifyResult.ok) {
        return NextResponse.json({ error: verifyResult.error }, { status: 401 });
      }

      // OTP verified successfully -> Issue Admin Session Cookie
      const res = NextResponse.json({ role: "admin", ok: true });
      setSessionCookie(res, await signSession({ uid: "admin", role: "admin", name: "Dr. Prachi Khetan" }));
      return res;
    }

    // Stage 1: Password Check -> Trigger 5-Digit OTP to 9101616156
    const ok = await bcrypt.compare(pass, adminHash);
    if (!ok) return fail();

    const generatedOtp = generateFiveDigitOtp();
    saveHostOtp(e, generatedOtp, hostPhone);

    // Send OTP to 9101616156
    await sendHostOtp({ phone: hostPhone, otp: generatedOtp });

    return NextResponse.json({
      requireOtp: true,
      phone: hostPhone,
      message: `A 5-digit verification code has been sent to ${hostPhone}.`,
      simulatedOtp: !process.env.FAST2SMS_API_KEY ? generatedOtp : undefined,
    });
  }

  // PATIENT LOGIN FLOW (Allow logging in with either email or 10-digit mobile number)
  await db();
  let user = null;
  if (e.includes("@")) {
    user = await User.findOne({ email: e });
  } else {
    const cleanPhone = e.replace(/\D/g, "").slice(-10);
    user = await User.findOne({ phone: cleanPhone });
  }

  if (!user || !(await bcrypt.compare(pass, user.passwordHash))) return fail();

  const res = NextResponse.json({ role: "patient", ok: true });
  setSessionCookie(res, await signSession({ uid: String(user._id), role: "patient", name: user.name }));
  return res;
}
