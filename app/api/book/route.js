import { NextResponse } from "next/server";
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
    if (!s || s.role !== "patient") {
      return NextResponse.json({ error: "Please log in as a patient to book an appointment." }, { status: 401 });
    }

    const body = await req.json();
    const { slotId, reason = "", treatment = "General Consultation" } = body;

    if (!slotId) {
      return NextResponse.json({ error: "Please select an appointment time slot." }, { status: 400 });
    }

    await db();

    const user = await User.findById(s.uid);
    if (!user) {
      return NextResponse.json({ error: "Patient account not found. Please log in again." }, { status: 404 });
    }

    // Verify patient's phone is valid
    const phoneCheck = validatePhone(user.phone);
    if (!phoneCheck.isValid) {
      return NextResponse.json({ error: "Please update your profile with a valid 10-digit mobile number." }, { status: 400 });
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
