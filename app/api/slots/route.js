import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import TimeSlot from "@/models/TimeSlot";
import Appointment from "@/models/Appointment";
import { getSession, requireAdmin } from "@/lib/auth";

// Helper: Calculate current date and time in India Standard Time (IST, UTC+5:30)
function getIndiaTime() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const todayStr = istDate.toISOString().slice(0, 10);
  const currentTimeStr = istDate.toISOString().slice(11, 16);
  return { todayStr, currentTimeStr };
}

// GET: Returns open future slots for visitors/patients, or all slots + bookings for Admin
export async function GET(req) {
  const s = await getSession();
  await db();

  const { todayStr, currentTimeStr } = getIndiaTime();

  if (s?.role === "admin") {
    const slots = await TimeSlot.find({ date: { $gte: todayStr } }).sort({ date: 1, time: 1 }).lean();
    const appts = await Appointment.find().populate("user", "name phone email").lean();
    const bySlot = Object.fromEntries(
      appts.map(a => [String(a.slot?._id || a.slot), a])
    );

    return NextResponse.json(
      slots.map(x => ({
        ...x,
        appointment: bySlot[String(x._id)] || null,
      }))
    );
  }

  // Open future slots for patients (excluding already passed hours of today)
  const rawSlots = await TimeSlot.find({ date: { $gte: todayStr }, isBooked: false })
    .sort({ date: 1, time: 1 })
    .select("date time")
    .lean();

  const availableSlots = rawSlots.filter(s => {
    if (s.date === todayStr && s.time <= currentTimeStr) {
      return false; // Skip already elapsed time slots for today
    }
    return true;
  });

  return NextResponse.json(availableSlots);
}

// POST: Admin generates slots (single day, multi-day, or specific slots)
export async function POST(req) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  const body = await req.json();
  const { date, dates = [], start = "10:00", end = "19:00", intervalMin = 30, excludeBreak = true } = body;

  const targetDates = dates.length ? dates : (date ? [date] : []);
  if (!targetDates.length) {
    return NextResponse.json({ error: "Please provide a valid date." }, { status: 400 });
  }

  const toMin = t => +t.slice(0, 2) * 60 + +t.slice(3, 5);
  const fmt = m => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  const startM = toMin(start);
  const endM = toMin(end);
  const step = Math.max(10, +intervalMin || 30);

  const docs = [];
  for (const d of targetDates) {
    for (let m = startM; m + step <= endM; m += step) {
      // Skip lunch break (1:30 PM - 3:30 PM = 810 to 930) if requested
      if (excludeBreak && m >= 810 && m < 930) {
        continue;
      }
      docs.push({ date: d, time: fmt(m) });
    }
  }

  await db();
  let createdCount = 0;
  try {
    const result = await TimeSlot.insertMany(docs, { ordered: false });
    createdCount = typeof result === "number" ? result : (result?.length || docs.length);
  } catch (e) {
    // Skip duplicate slots gracefully
  }

  return NextResponse.json({ ok: true, created: createdCount, totalGenerated: docs.length });
}
