import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import User from "@/models/User";
import { signSession, setSessionCookie } from "@/lib/auth";
import { validateEmail, validatePhone } from "@/lib/validation";

export async function POST(req) {
  try {
    const { name = "", email = "", phone = "", password = "" } = await req.json();

    const cleanName = String(name).trim();
    if (!cleanName || cleanName.length < 2) {
      return NextResponse.json({ error: "Please enter your full name (minimum 2 characters)." }, { status: 400 });
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return NextResponse.json({ error: emailValidation.error }, { status: 400 });
    }
    const cleanEmail = emailValidation.cleanEmail;

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
    }
    const cleanPhone = phoneValidation.cleanPhone;

    const cleanPassword = String(password).trim();
    if (!cleanPassword || cleanPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    await db();

    const adminEmail = (process.env.ADMIN_EMAIL || "dr.prachikhetan.bds18@gmail.com").toLowerCase().trim();
    if (cleanEmail === adminEmail) {
      return NextResponse.json({ error: "This email address is reserved." }, { status: 409 });
    }

    // Check if account already exists with email or phone
    const existingByEmail = await User.findOne({ email: cleanEmail });
    if (existingByEmail) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in." },
        { status: 409 }
      );
    }

    const existingByPhone = await User.findOne({ phone: cleanPhone });
    if (existingByPhone) {
      return NextResponse.json(
        { error: "An account with this mobile number already exists. Please log in." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 12);
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash: hashedPassword,
      role: "patient",
    });

    const res = NextResponse.json({ role: "patient", ok: true, name: cleanName });
    setSessionCookie(res, await signSession({ uid: String(user._id), role: "patient", name: cleanName }));
    return res;
  } catch (err) {
    console.error("[Register API Exception]:", err);
    return NextResponse.json(
      { error: "A server connection error occurred while creating your account. Please try again." },
      { status: 500 }
    );
  }
}
