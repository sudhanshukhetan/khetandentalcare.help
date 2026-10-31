import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import BookingFlow from "@/components/BookingFlow";
import { db } from "@/lib/db";
import TimeSlot from "@/models/TimeSlot";

export const metadata = {
  title: "Book Appointment Online | Khetan Dental Care, Raha",
  description: "Direct online dental appointment booking with Dr. Prachi Khetan in Raha, Nagaon. Painless root canals, dental implants, scaling and general consultations.",
};

// Calculate current date and time in India Standard Time (IST, UTC+5:30)
function getIndiaTime() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const todayStr = istDate.toISOString().slice(0, 10);
  const currentTimeStr = istDate.toISOString().slice(11, 16);
  return { todayStr, currentTimeStr };
}

export default async function Book() {
  const s = await getSession();
  // If doctor/host is currently logged in, route to admin dashboard
  if (s?.role === "admin") redirect("/admin");

  let initialSlots = [];
  try {
    await db();
    const { todayStr, currentTimeStr } = getIndiaTime();
    const rawSlots = await TimeSlot.find({ date: { $gte: todayStr }, isBooked: false })
      .sort({ date: 1, time: 1 })
      .select("date time")
      .lean();

    initialSlots = (rawSlots || [])
      .filter((slot) => {
        if (slot.date === todayStr && slot.time <= currentTimeStr) {
          return false;
        }
        return true;
      })
      .map((slot) => ({
        _id: String(slot._id),
        date: slot.date,
        time: slot.time,
      }));
  } catch (err) {
    console.warn("[SSR Slots Warning]:", err.message);
  }

  // Patients book directly without login
  return <BookingFlow sessionUser={s || null} initialSlots={initialSlots} />;
}
