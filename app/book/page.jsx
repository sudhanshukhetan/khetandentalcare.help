import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import BookingFlow from "@/components/BookingFlow";

export const metadata = {
  title: "Book Appointment | Khetan Dental Care",
  description: "Schedule your consultation or treatment with Dr. Prachi Khetan in Raha, Nagaon.",
};

export default async function Book() {
  const s = await getSession();
  // If doctor/host is currently logged in, route to admin dashboard
  if (s?.role === "admin") redirect("/admin");

  // Patients book directly without login
  return <BookingFlow sessionUser={s || null} />;
}
