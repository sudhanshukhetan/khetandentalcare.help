import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import TimeSlot from "@/models/TimeSlot";
import Appointment from "@/models/Appointment";
import { getSession } from "@/lib/auth";

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
      })),
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
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

  return NextResponse.json(availableSlots, {
    headers: {
      "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
    },
  });
}

// POST: Generate slots for multiple dates (Admin only)
export async function POST(req) {
  const s = await getSession();
  if (s?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const {
    dates = [],
    date,
    start = "10:00",
    end = "19:00",
    intervalMin = 30,
    excludeBreak = true,
  } = await req.json();

  const targetDates = Array.isArray(dates) && dates.length > 0 ? dates : date ? [date] : [];

  if (targetDates.length === 0) {
    return NextResponse.json({ error: "Please provide at least one valid date." }, { status: 400 });
  }

  await db();

  const toMins = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const toStr = (m) => {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const startM = toMins(start);
  const endM = toMins(end);

  const times = [];
  for (let m = startM; m < endM; m += intervalMin) {
    // Break 13:30 - 16:00 (Assam clinic standard lunch / afternoon break)
    if (excludeBreak && m >= toMins("13:30") && m < toMins("16:00")) continue;
    times.push(toStr(m));
  }

  let totalCreated = 0;
  for (const d of targetDates) {
    for (const t of times) {
      try {
        await TimeSlot.create({ date: d, time: t, isBooked: false });
        totalCreated++;
      } catch (e) {
        // Skip duplicate slot combinations
      }
    }
  }

  return NextResponse.json({ ok: true, created: totalCreated });
}
