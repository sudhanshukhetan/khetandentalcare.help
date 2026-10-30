"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MyAppointmentsClient({ sessionUser }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAppointments(data);
      }
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!confirm("Are you sure you want to cancel this appointment? Your slot will be freed for other patients.")) {
      return;
    }
    setCancellingId(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", reason: "Cancelled by patient" }),
      });
      if (res.ok) {
        setActionMsg({ ok: true, text: "Appointment cancelled successfully." });
        fetchAppointments();
      } else {
        const d = await res.json();
        setActionMsg({ ok: false, text: d.error || "Failed to cancel appointment." });
      }
    } catch (err) {
      setActionMsg({ ok: false, text: "Network error occurred." });
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Confirmed</span>;
      case "completed":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Completed</span>;
      case "cancelled":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">My Appointments</h1>
          <p className="text-sm text-ink/70 mt-1">
            Logged in as <span className="font-semibold text-ink">{sessionUser?.name}</span>
          </p>
        </div>
        <Link
          href="/book"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-teal text-white font-semibold text-sm hover:bg-teal/90 shadow-sm transition-all"
        >
          + Book New Appointment
        </Link>
      </div>

      {actionMsg && (
        <div
          role="status"
          className={`p-4 mb-6 rounded-lg text-sm flex items-center justify-between ${
            actionMsg.ok ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-xs font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-ink/60 text-sm">Loading your appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 bg-mist/60 rounded-xl border border-mist p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-teal/10 rounded-full flex items-center justify-center text-3xl">
            📅
          </div>
          <h3 className="text-xl font-bold text-ink">No appointments found</h3>
          <p className="text-ink/70 max-w-md mx-auto mt-2 text-sm">
            You don't have any booked visits with Dr. Prachi Khetan yet. Ready for your gentle dental checkup?
          </p>
          <Link
            href="/book"
            className="inline-block mt-6 px-6 py-3 rounded-md bg-ink text-white font-semibold text-sm hover:bg-ink/90 shadow-sm"
          >
            Book Your First Visit
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const slotDate = appt.slot?.date || "N/A";
            const slotTime = appt.slot?.time || "N/A";
            const isConfirmed = appt.status === "confirmed";

            return (
              <div
                key={appt._id}
                className="bg-white border border-mist rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-ink">
                        {slotDate} at {slotTime}
                      </span>
                      {getStatusBadge(appt.status)}
                    </div>

                    <div className="text-sm text-ink/80">
                      <span className="font-semibold text-teal">{appt.treatment || "General Consultation"}</span>
                      {appt.reason && (
                        <p className="text-ink/60 text-xs mt-1 italic">
                          Notes: "{appt.reason}"
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-ink/50 pt-1">
                      Doctor: <span className="font-medium text-ink/70">Dr. Prachi Khetan (BDS)</span> · Raha New Charali Clinic
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t md:border-t-0 pt-3 md:pt-0">
                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 rounded-md border border-ink/20 text-xs font-semibold text-ink hover:bg-mist transition-colors"
                      title="Print or save booking receipt"
                    >
                      Print Slip
                    </button>

                    {isConfirmed && (
                      <button
                        onClick={() => handleCancel(appt._id)}
                        disabled={cancellingId === appt._id}
                        className="px-3.5 py-1.5 rounded-md bg-gum/10 text-xs font-semibold text-gum hover:bg-gum/20 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === appt._id ? "Cancelling..." : "Cancel Visit"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clinic Help Box */}
      <div className="mt-12 p-5 bg-mist rounded-xl border border-mist/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-ink">Need assistance or have tooth pain?</h4>
          <p className="text-xs text-ink/70 mt-0.5">
            Call or WhatsApp our clinic desk directly at <span className="font-semibold">9101616156</span>.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="tel:9101616156"
            className="px-4 py-2 rounded-md bg-ink text-white font-medium text-xs hover:bg-ink/90 transition-colors"
          >
            Call 9101616156
          </a>
          <a
            href="https://wa.me/919101616156?text=Hello%20Dr.%20Prachi,%20I%20have%20an%20appointment%20query."
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-md bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1"
          >
            WhatsApp Clinic
          </a>
        </div>
      </div>
    </div>
  );
}

