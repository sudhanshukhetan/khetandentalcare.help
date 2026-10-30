import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import AdminSlots from "@/components/AdminSlots";

export const metadata = {
  title: "Doctor & Clinic Dashboard | Khetan Dental Care",
  description: "Appointment schedules, patient list, and slot management for Dr. Prachi Khetan.",
};

export default async function Admin() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");
  return <AdminSlots admin={admin} />;
}
