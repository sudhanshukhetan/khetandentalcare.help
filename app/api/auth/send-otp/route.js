import { NextResponse } from "next/server";
import { generateFiveDigitOtp, saveOtp } from "@/lib/otp";
import { sendOtpSms } from "@/lib/sms";
import { validatePhone, validateEmail } from "@/lib/validation";

export async function POST(req) {
  try {
    const body = await req.json();
    const { phone = "", email = "", role = "patient" } = body;

    // Validate phone number
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
    }
    const cleanPhone = phoneValidation.cleanPhone;

    // Optional email validation if supplied
    if (email) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        return NextResponse.json({ error: emailValidation.error }, { status: 400 });
      }
    }

    // Generate secure 5-digit OTP
    const otp = generateFiveDigitOtp();

    // Save in secure store indexed by clean 10-digit phone
    saveOtp(cleanPhone, otp, { role, email: email ? email.toLowerCase().trim() : undefined });

    // Dispatch SMS to the entered mobile number
    const smsResult = await sendOtpSms({
      phone: cleanPhone,
      otp,
      role,
    });

    if (!smsResult.success && !smsResult.simulated) {
      return NextResponse.json(
        { error: "SMS gateway delivery encountered an issue. Please retry in a few moments." },
        { status: 502 }
      );
    }

    // SECURE RESPONSE: Never expose OTP to the frontend
    return NextResponse.json({
      success: true,
      message: `A 5-digit verification code has been dispatched to +91 ${cleanPhone}.`,
      destination: cleanPhone,
    });
  } catch (err) {
    console.error("[Send OTP API Error]:", err);
    return NextResponse.json(
      { error: "Internal server error while processing verification code request." },
      { status: 500 }
    );
  }
}
