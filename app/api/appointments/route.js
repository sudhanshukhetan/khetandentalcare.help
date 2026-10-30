import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Appointment from "@/models/Appointment";
import TimeSlot from "@/models/TimeSlot";
import { getSession } from "@/lib/auth";

export async function GET(req) {
  const s = await getSession();
  if (!s) {
    return NextResponse.json({ error: "Please log in to view appointments." }, { status: 401 });
  }

  await db();

  if (s.role === "admin") {
    const appts = await Appointment.find()
      .populate("user", "name phone email")
      .populate("slot")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(appts);
  }

  // Patient appointments
  const appts = await Appointment.find({ user: s.uid })
    .populate("slot")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(appts);
}

