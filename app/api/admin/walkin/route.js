import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import User from "@/models/User";
import TimeSlot from "@/models/TimeSlot";
import Appointment from "@/models/Appointment";
import { requireAdmin } from "@/lib/auth";

export async function POST(req) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden. Admin only." }, { status: 403 });
  }

  const { name, phone, slotId, treatment = "General Consultation", reason = "Walk-in consultation" } = await req.json();

  if (!name || !phone || !slotId) {
    return NextResponse.json({ error: "Please enter patient name, phone and select a slot." }, { status: 400 });
  }

  await db();

  // Find or create walk-in patient user
  const emailPlaceholder = `walkin_${phone}@khetandental.local`;
  let user = await User.findOne({ phone });
  if (!user) {
    const dummyHash = await bcrypt.hash(`Walkin@${phone.slice(-4)}`, 10);
    user = await User.create({
      name,
      email: emailPlaceholder,
      phone,
      passwordHash: dummyHash,
      role: "patient",
    });
  }

  // Claim slot
  const slot = await TimeSlot.findOneAndUpdate({ _id: slotId, isBooked: false }, { isBooked: true }, { new: true });
  if (!slot) {
    return NextResponse.json({ error: "This slot is already booked or unavailable." }, { status: 409 });
  }

  const appt = await Appointment.create({
    user: user._id,
    slot: slot._id,
    treatment,
    reason,
    status: "confirmed",
  });

  return NextResponse.json({ ok: true, appointment: appt, date: slot.date, time: slot.time });
}

