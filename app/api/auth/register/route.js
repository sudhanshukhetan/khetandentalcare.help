import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import User from "@/models/User";
import { signSession, setSessionCookie } from "@/lib/auth";

export async function POST(req) {
  const { name = "", email = "", phone = "", password = "" } = await req.json();

  const cleanName = name.trim();
  const cleanEmail = email.toLowerCase().trim();
  const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);

  if (!cleanName || !cleanEmail || !/^[6-9]\d{9}$/.test(cleanPhone) || password.length < 8) {
    return NextResponse.json(
      { error: "Please enter your name, a valid email, a 10-digit mobile number, and a password with at least 8 characters." },
      { status: 400 }
    );
  }

  await db();

  const adminEmail = (process.env.ADMIN_EMAIL || "dr.prachikhetan.bds18@gmail.com").toLowerCase().trim();
  if (cleanEmail === adminEmail) {
    return NextResponse.json({ error: "This email address is reserved." }, { status: 409 });
  }

  if (await User.findOne({ email: cleanEmail })) {
    return NextResponse.json({ error: "An account with this email address already exists. Please log in." }, { status: 409 });
  }

  const user = await User.create({
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    passwordHash: await bcrypt.hash(password, 12),
  });

  const res = NextResponse.json({ role: "patient", ok: true });
  setSessionCookie(res, await signSession({ uid: String(user._id), role: "patient", name: cleanName }));
  return res;
}
