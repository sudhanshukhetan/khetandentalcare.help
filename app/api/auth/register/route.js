import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import User from "@/models/User";
import { signSession, setSessionCookie } from "@/lib/auth";

export async function POST(req) {
  const { name, email, phone, password } = await req.json();
  if (!name || !email || !/^[6-9]\d{9}$/.test(phone || "") || (password || "").length < 8)
    return NextResponse.json({ error: "Enter a name, valid email, 10-digit phone and a password of 8+ characters." }, { status: 400 });
  await db();
  if (email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase())
    return NextResponse.json({ error: "This email is reserved." }, { status: 409 });
  if (await User.findOne({ email: email.toLowerCase() }))
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  const user = await User.create({ name, email, phone, passwordHash: await bcrypt.hash(password, 12) });
  const res = NextResponse.json({ role: "patient" });
  setSessionCookie(res, await signSession({ uid: String(user._id), role: "patient", name }));
  return res;
}
