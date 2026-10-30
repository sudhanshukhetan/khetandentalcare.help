import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import MyAppointmentsClient from "@/components/MyAppointmentsClient";

export const metadata = {
  title: "My Appointments | Khetan Dental Care",
  description: "View and manage your dental appointments with Dr. Prachi Khetan.",
};

export default async function MyAppointmentsPage() {
  const s = await getSession();
  if (!s) redirect("/login");
  if (s.role === "admin") redirect("/admin");

  return <MyAppointmentsClient sessionUser={s} />;
}

