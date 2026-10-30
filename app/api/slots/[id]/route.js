import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import TimeSlot from "@/models/TimeSlot";
import Appointment from "@/models/Appointment";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { date, time } = await req.json();
  await db();
  const slot = await TimeSlot.findById(params.id);
  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (slot.isBooked) return NextResponse.json({ error: "Booked slots can't be edited. Cancel the booking first." }, { status: 409 });
  if (date) slot.date = date;
  if (time) slot.time = time;
  await slot.save();
  return NextResponse.json(slot);
}

export async function DELETE(_req, { params }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await db();
  await Appointment.updateMany({ slot: params.id }, { status: "cancelled" });
  await TimeSlot.findByIdAndDelete(params.id);
  return NextResponse.json({ ok: true });
}
