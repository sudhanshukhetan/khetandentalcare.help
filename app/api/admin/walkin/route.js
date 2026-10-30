import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import User from "@/models/User";
import TimeSlot from "@/models/TimeSlot";
import Appointment from "@/models/Appointment";
import { requireAdmin } from "@/lib/auth";
import { validatePhone } from "@/lib/validation";

export async function POST(req) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Forbidden. Admin only." }, { status: 403 });
    }

    const { name = "", phone = "", slotId = "", treatment = "General Consultation", reason = "Walk-in consultation" } = await req.json();

    if (!name.trim() || !slotId) {
      return NextResponse.json({ error: "Please enter patient name and select an open slot." }, { status: 400 });
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
    }
    const cleanPhone = phoneValidation.cleanPhone;

    await db();

    // Find or create walk-in patient user
    const emailPlaceholder = `${cleanPhone}@patient.khetandental.com`;
    let user = await User.findOne({ phone: cleanPhone });
    if (!user) {
      const dummyHash = await bcrypt.hash(`Walkin@${cleanPhone.slice(-4)}`, 10);
      user = await User.create({
        name: name.trim(),
        email: emailPlaceholder,
        phone: cleanPhone,
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
  } catch (err) {
    console.error("[Walkin Booking API Error]:", err);
    return NextResponse.json(
      { error: "Server error occurred while registering walk-in booking." },
      { status: 500 }
    );
  }
}
