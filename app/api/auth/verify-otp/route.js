import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import User from "@/models/User";
import { verifyOtp } from "@/lib/otp";
import { signSession, setSessionCookie } from "@/lib/auth";
import { validatePhone } from "@/lib/validation";

export async function POST(req) {
  try {
    const { phone = "", otp = "", name = "" } = await req.json();

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
    }
    const cleanPhone = phoneValidation.cleanPhone;

    if (!otp || String(otp).trim().length !== 5) {
      return NextResponse.json({ error: "Please enter the complete 5-digit verification code." }, { status: 400 });
    }

    // Verify OTP against identifier
    const verifyResult = verifyOtp(cleanPhone, otp);
    if (!verifyResult.ok) {
      return NextResponse.json({ error: verifyResult.error }, { status: 401 });
    }

    // Connect to database safely
    await db();

    // Check if host/admin verification
    const adminPhone = (process.env.CLINIC_PHONE || "9101616156").replace(/\D/g, "").slice(-10);
    if (cleanPhone === adminPhone && verifyResult.metadata?.role === "admin") {
      const res = NextResponse.json({ success: true, role: "admin", name: "Dr. Prachi Khetan" });
      setSessionCookie(res, await signSession({ uid: "admin", role: "admin", name: "Dr. Prachi Khetan" }));
      return res;
    }

    // Look up or initialize patient record
    let user = await User.findOne({ phone: cleanPhone });
    if (!user) {
      const fallbackName = name ? name.trim() : `Patient ${cleanPhone.slice(-4)}`;
      const fallbackEmail = `${cleanPhone}@patient.khetandental.com`;
      user = await User.create({
        name: fallbackName,
        email: fallbackEmail,
        phone: cleanPhone,
        passwordHash: "otp_authenticated",
        role: "patient",
      });
    }

    const res = NextResponse.json({
      success: true,
      role: "patient",
      name: user.name,
    });

    setSessionCookie(res, await signSession({ uid: String(user._id), role: "patient", name: user.name }));
    return res;
  } catch (err) {
    console.error("[Verify OTP API Error]:", err);
    return NextResponse.json(
      { error: "Server error occurred while verifying code. Please try again." },
      { status: 500 }
    );
  }
}

