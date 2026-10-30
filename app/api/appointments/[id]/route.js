import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Appointment from "@/models/Appointment";
import TimeSlot from "@/models/TimeSlot";
import { getSession } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const s = await getSession();
  if (!s) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const { status, reason } = await req.json();
  await db();

  const appt = await Appointment.findById(params.id);
  if (!appt) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  // Check authorization: must be admin or the appointment owner
  const appointmentUserId = String(appt.user?._id || appt.user);
  if (s.role !== "admin" && appointmentUserId !== String(s.uid)) {
    return NextResponse.json({ error: "Unauthorized to modify this appointment." }, { status: 403 });
  }

  // Patients can only cancel their own appointment
  if (s.role !== "admin" && status !== "cancelled") {
    return NextResponse.json({ error: "Patients may only request cancellation." }, { status: 400 });
  }

  const update = { status };
  if (reason) update.reason = reason;

  const updated = await Appointment.findByIdAndUpdate(params.id, update);

  // If appointment is cancelled, release the time slot so another patient can book
  if (status === "cancelled" && appt.slot) {
    const slotId = String(appt.slot?._id || appt.slot);
    await TimeSlot.findByIdAndUpdate(slotId, { isBooked: false });
  }

  return NextResponse.json({ ok: true, appointment: updated });
}
