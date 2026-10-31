import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import TimeSlot from "@/models/TimeSlot";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import { getSession } from "@/lib/auth";
import { notifyClinic } from "@/lib/sms";
import { validatePhone } from "@/lib/validation";

export async function POST(req) {
  try {
    const s = await getSession();
    const body = await req.json().catch(() => ({}));
    let { slotId, name = "", phone = "", reason = "", treatment = "General Consultation" } = body;

    if (!slotId) {
      return NextResponse.json({ error: "Please select an appointment time slot." }, { status: 400 });
    }

    // Default to session attributes if patient is already logged in
    if (s && s.role === "patient") {
      name = name.trim() || s.name || "Patient";
      phone = phone.trim() || s.phone || "";
    }

    name = String(name).trim();
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Please enter your full name (at least 2 characters)." }, { status: 400 });
    }

    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
    }
    const cleanPhone = phoneValidation.cleanPhone;

    await db();

    // Find or create patient user record
    let user = null;
    if (s && s.uid && s.role === "patient") {
      user = await User.findById(s.uid);
    }
    if (!user) {
      user = await User.findOne({ phone: cleanPhone });
    }

    if (!user) {
      const dummyHash = await bcrypt.hash(`Patient@${cleanPhone.slice(-4)}`, 10);
      user = await User.create({
        name,
        email: `${cleanPhone}@patient.khetandental.com`,
        phone: cleanPhone,
        passwordHash: dummyHash,
        role: "patient",
      });
    } else if (name && user.name !== name) {
      user.name = name;
      if (typeof user.save === "function") {
        await user.save();
      } else {
        await User.findByIdAndUpdate(user._id, { name });
      }
    }

    // Atomic claim: only one request can flip isBooked false -> true (prevents double booking)
    const slot = await TimeSlot.findOneAndUpdate({ _id: slotId, isBooked: false }, { isBooked: true }, { new: true });
    if (!slot) {
      return NextResponse.json({ error: "That slot was just booked by another patient. Please choose another time." }, { status: 409 });
    }

    const appt = await Appointment.create({
      user: user._id,
      slot: slot._id,
      treatment: String(treatment).slice(0, 80),
      reason: String(reason).slice(0, 500),
      status: "confirmed",
    });

    const sent = await notifyClinic({
      patientName: user.name,
      patientPhone: user.phone,
      date: slot.date,
      time: slot.time,
      treatment,
    });

    if (sent) {
      await Appointment.findByIdAndUpdate(appt._id, { smsSent: true });
    }

    return NextResponse.json({
      ok: true,
      appointmentId: String(appt._id),
      date: slot.date,
      time: slot.time,
      patientName: user.name,
      patientPhone: user.phone,
      treatment,
    });
  } catch (err) {
    console.error("[Booking API Exception]:", err);
    return NextResponse.json(
      { error: "A server connection error occurred while reserving your slot. Please try again." },
      { status: 500 }
    );
  }
}
