import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import TimeSlot from "@/models/TimeSlot";
import Appointment from "@/models/Appointment";
import User from "@/models/User";
import { getSession } from "@/lib/auth";
import { notifyClinic } from "@/lib/sms";

export async function POST(req) {
  const s = await getSession();
  if (!s || s.role !== "patient") {
    return NextResponse.json({ error: "Please log in as a patient to book an appointment." }, { status: 401 });
  }

  const { slotId, reason = "", treatment = "General Consultation" } = await req.json();
  if (!slotId) {
    return NextResponse.json({ error: "Please select an appointment time slot." }, { status: 400 });
  }

  await db();

  // Atomic claim: only one request can flip isBooked false -> true (prevents race conditions / double booking)
  const slot = await TimeSlot.findOneAndUpdate({ _id: slotId, isBooked: false }, { isBooked: true }, { new: true });
  if (!slot) {
    return NextResponse.json({ error: "That slot was just booked by another patient. Please choose another time." }, { status: 409 });
  }

  const user = await User.findById(s.uid);
  if (!user) {
    return NextResponse.json({ error: "Patient account not found." }, { status: 404 });
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
}
