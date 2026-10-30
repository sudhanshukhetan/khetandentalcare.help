"use client";

import { useEffect, useState } from "react";

const json = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export default function AdminSlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appointments"); // "appointments" | "generator" | "slots" | "walkin"
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("all");

  // Single date or multi-day slot generator form
  const [genForm, setGenForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    daysCount: 7,
    start: "10:00",
    end: "19:00",
    intervalMin: 30,
    excludeBreak: true,
  });

  // Walk-in booking form
  const [walkinForm, setWalkinForm] = useState({
    name: "",
    phone: "",
    slotId: "",
    treatment: "General Consultation",
    reason: "Walk-in consultation",
  });

  const [editingSlot, setEditingSlot] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);

  const loadSlots = async () => {
    try {
      const res = await fetch("/api/slots");
      const d = await res.json();
      if (Array.isArray(d)) setSlots(d);
    } catch (e) {
      console.error("Error loading slots:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  // Multi-day Slot Generation
  async function generateSlots(e) {
    e.preventDefault();
    setStatusMsg({ ok: true, text: "Generating slots..." });

    const dates = [];
    const baseDate = new Date(genForm.date + "T00:00:00");
    const count = parseInt(genForm.daysCount, 10) || 1;

    for (let i = 0; i < count; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    try {
      const res = await fetch("/api/slots", json("POST", {
        dates,
        start: genForm.start,
        end: genForm.end,
        intervalMin: +genForm.intervalMin,
        excludeBreak: genForm.excludeBreak,
      }));
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ ok: true, text: `Successfully generated ${data.created} new slots across ${dates.length} days!` });
        loadSlots();
      } else {
        setStatusMsg({ ok: false, text: data.error || "Failed to generate slots." });
      }
    } catch {
      setStatusMsg({ ok: false, text: "Network error occurred." });
    }
  }

  // Walk-in Patient Booking
  async function handleWalkinSubmit(e) {
    e.preventDefault();
    if (!walkinForm.slotId) {
      alert("Please select a slot for the walk-in patient.");
      return;
    }
    try {
      const res = await fetch("/api/admin/walkin", json("POST", walkinForm));
      const d = await res.json();
      if (res.ok) {
        setStatusMsg({ ok: true, text: `Booked walk-in patient ${walkinForm.name} for ${d.date} at ${d.time}!` });
        setWalkinForm({ name: "", phone: "", slotId: "", treatment: "General Consultation", reason: "Walk-in consultation" });
        loadSlots();
        setActiveTab("appointments");
      } else {
        alert(d.error || "Failed to register walk-in patient.");
      }
    } catch {
      alert("Error booking walk-in patient.");
    }
  }

  // Update appointment status (e.g. completed, cancelled)
  async function updateAppointmentStatus(appointmentId, newStatus) {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, json("PATCH", { status: newStatus }));
      if (res.ok) {
        setStatusMsg({ ok: true, text: `Appointment marked as ${newStatus}.` });
        loadSlots();
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Delete slot
  async function removeSlot(id) {
    if (confirm("Delete this slot? Any booked appointment on it will be cancelled.")) {
      await fetch(`/api/slots/${id}`, { method: "DELETE" });
      loadSlots();
    }
  }

  // Edit slot date/time
  async function saveEditSlot() {
    await fetch(`/api/slots/${editingSlot._id}`, json("PATCH", { date: editingSlot.date, time: editingSlot.time }));
    setEditingSlot(null);
    loadSlots();
  }

  const bookedSlots = slots.filter((s) => s.isBooked && s.appointment);
  const openSlots = slots.filter((s) => !s.isBooked);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayBookings = bookedSlots.filter((s) => s.date === todayStr);

  // Filtered Appointments
  const filteredAppointments = bookedSlots.filter((s) => {
    if (filterDate === "today" && s.date !== todayStr) return false;
    if (filterDate === "upcoming" && s.date < todayStr) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const patientName = s.appointment?.user?.name?.toLowerCase() || "";
      const patientPhone = s.appointment?.user?.phone || "";
      const reason = s.appointment?.reason?.toLowerCase() || "";
      return patientName.includes(q) || patientPhone.includes(q) || reason.includes(q);
    }
    return true;
  });

  const inputClass = "border border-ink/20 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header & Overview Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-mist pb-6">
        <div>
          <span className="text-xs font-bold text-teal tracking-wider uppercase bg-teal/10 px-2 py-0.5 rounded">
            Clinic Portal
          </span>
          <h1 className="text-3xl font-extrabold text-ink mt-1">Dr. Prachi Khetan's Dashboard</h1>
          <p className="text-sm text-ink/70">
            Khetan Dental Care, Raha, Nagaon · Clinic Hotline: <span className="font-semibold text-ink">9101616156</span>
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "appointments" ? "bg-ink text-white shadow-sm" : "bg-mist text-ink hover:bg-mist/80"
            }`}
          >
            📋 Appointments ({bookedSlots.length})
          </button>
          <button
            onClick={() => setActiveTab("generator")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "generator" ? "bg-teal text-white shadow-sm" : "bg-mist text-ink hover:bg-mist/80"
            }`}
          >
            ⚙️ Slot Generator
          </button>
          <button
            onClick={() => setActiveTab("walkin")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "walkin" ? "bg-ink text-white shadow-sm" : "bg-mist text-ink hover:bg-mist/80"
            }`}
          >
            ➕ Walk-In Patient
          </button>
          <button
            onClick={() => setActiveTab("slots")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "slots" ? "bg-ink text-white shadow-sm" : "bg-mist text-ink hover:bg-mist/80"
            }`}
          >
            📅 Open Slots ({openSlots.length})
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center justify-between ${
            statusMsg.ok ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-mist/70 p-4 rounded-xl border border-mist">
          <span className="text-xs text-ink/60 font-medium">Today's Visits</span>
          <div className="text-2xl font-black text-teal mt-1">{todayBookings.length}</div>
        </div>
        <div className="bg-mist/70 p-4 rounded-xl border border-mist">
          <span className="text-xs text-ink/60 font-medium">Total Booked</span>
          <div className="text-2xl font-black text-ink mt-1">{bookedSlots.length}</div>
        </div>
        <div className="bg-mist/70 p-4 rounded-xl border border-mist">
          <span className="text-xs text-ink/60 font-medium">Open Available Slots</span>
          <div className="text-2xl font-black text-ink mt-1">{openSlots.length}</div>
        </div>
        <div className="bg-mist/70 p-4 rounded-xl border border-mist">
          <span className="text-xs text-ink/60 font-medium">SMS / WhatsApp Alert</span>
          <div className="text-xs font-bold text-emerald-700 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Active
          </div>
        </div>
      </div>

      {/* TAB 1: APPOINTMENTS LIST */}
      {activeTab === "appointments" && (
        <section className="bg-white rounded-xl border border-mist p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl font-bold text-ink">Booked Patient Appointments</h2>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search patient name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputClass} w-52`}
              />
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className={inputClass}
              >
                <option value="all">All Dates</option>
                <option value="today">Today Only</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-ink/60 text-sm bg-mist/30 rounded-lg">
              No appointments match your filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-mist text-xs font-bold text-ink/60 uppercase">
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="px-3">Patient Details</th>
                    <th className="px-3">Treatment & Notes</th>
                    <th className="px-3">Status</th>
                    <th className="px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {filteredAppointments.map((s) => {
                    const appt = s.appointment;
                    const isToday = s.date === todayStr;

                    return (
                      <tr key={s._id} className={`hover:bg-mist/30 transition-colors ${isToday ? "bg-teal/5" : ""}`}>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-ink">{s.date}</div>
                          <div className="text-xs text-teal font-semibold">{s.time}</div>
                          {isToday && (
                            <span className="text-[10px] font-bold bg-teal/20 text-teal px-1.5 py-0.5 rounded">
                              TODAY
                            </span>
                          )}
                        </td>

                        <td className="px-3">
                          <div className="font-semibold text-ink">{appt?.user?.name || "Patient"}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <a
                              href={`tel:${appt?.user?.phone}`}
                              className="text-xs text-teal font-medium hover:underline"
                            >
                              📞 {appt?.user?.phone}
                            </a>
                            <a
                              href={`https://wa.me/91${appt?.user?.phone}?text=Hello%20${encodeURIComponent(appt?.user?.name || "")},%20regarding%20your%20appointment%20with%20Dr.%20Prachi%20Khetan%20on%20${s.date}%20at%20${s.time}...`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                            >
                              WhatsApp
                            </a>
                          </div>
                        </td>

                        <td className="px-3 max-w-xs">
                          <div className="font-medium text-ink">{appt?.treatment || "Consultation"}</div>
                          {appt?.reason && (
                            <div className="text-xs text-ink/60 mt-0.5 truncate" title={appt.reason}>
                              "{appt.reason}"
                            </div>
                          )}
                        </td>

                        <td className="px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                              appt?.status === "completed"
                                ? "bg-blue-100 text-blue-800"
                                : appt?.status === "cancelled"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {appt?.status || "confirmed"}
                          </span>
                        </td>

                        <td className="px-3 text-right space-x-1.5">
                          {appt?.status !== "completed" && (
                            <button
                              onClick={() => updateAppointmentStatus(appt._id, "completed")}
                              className="text-xs px-2.5 py-1 rounded bg-teal text-white hover:bg-teal/90 font-medium"
                              title="Mark treatment completed"
                            >
                              Complete
                            </button>
                          )}
                          {appt?.status !== "cancelled" && (
                            <button
                              onClick={() => updateAppointmentStatus(appt._id, "cancelled")}
                              className="text-xs px-2.5 py-1 rounded border border-gum text-gum hover:bg-gum/10 font-medium"
                              title="Cancel appointment"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: SLOT GENERATOR */}
      {activeTab === "generator" && (
        <section className="bg-white rounded-xl border border-mist p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-ink">Generate Consultation Time Slots</h2>
            <p className="text-sm text-ink/70 mt-1">
              Quickly create slots for single or multiple consecutive days. Default timings automatically exclude lunch break (1:30 PM - 3:30 PM).
            </p>
          </div>

          <form onSubmit={generateSlots} className="space-y-4 max-w-2xl bg-mist/40 p-6 rounded-xl border border-mist">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Starting Date</label>
                <input
                  type="date"
                  className={`${inputClass} w-full`}
                  value={genForm.date}
                  onChange={(e) => setGenForm({ ...genForm, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Number of Days to Generate</label>
                <select
                  className={`${inputClass} w-full`}
                  value={genForm.daysCount}
                  onChange={(e) => setGenForm({ ...genForm, daysCount: e.target.value })}
                >
                  <option value="1">1 Day Only</option>
                  <option value="3">Next 3 Days</option>
                  <option value="7">Next 7 Days (1 Week)</option>
                  <option value="14">Next 14 Days (2 Weeks)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Opening Time</label>
                <input
                  type="time"
                  className={`${inputClass} w-full`}
                  value={genForm.start}
                  onChange={(e) => setGenForm({ ...genForm, start: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Closing Time</label>
                <input
                  type="time"
                  className={`${inputClass} w-full`}
                  value={genForm.end}
                  onChange={(e) => setGenForm({ ...genForm, end: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Slot Duration</label>
                <select
                  className={`${inputClass} w-full`}
                  value={genForm.intervalMin}
                  onChange={(e) => setGenForm({ ...genForm, intervalMin: e.target.value })}
                >
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes (Standard)</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={genForm.excludeBreak}
                    onChange={(e) => setGenForm({ ...genForm, excludeBreak: e.target.checked })}
                    className="rounded text-teal"
                  />
                  Skip Lunch Break (1:30 PM - 3:30 PM)
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 px-6 py-2.5 bg-teal text-white rounded-lg font-bold text-sm hover:bg-teal/90 shadow-sm"
            >
              Generate Available Slots
            </button>
          </form>
        </section>
      )}

      {/* TAB 3: WALK-IN PATIENT BOOKING */}
      {activeTab === "walkin" && (
        <section className="bg-white rounded-xl border border-mist p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-ink">Book Walk-In or Phone Patient</h2>
            <p className="text-sm text-ink/70 mt-1">
              Directly assign an open clinic slot to a patient who calls or visits in person.
            </p>
          </div>

          <form onSubmit={handleWalkinSubmit} className="space-y-4 max-w-xl bg-mist/40 p-6 rounded-xl border border-mist">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Patient Full Name</label>
              <input
                type="text"
                placeholder="e.g. Biren Das"
                required
                className={`${inputClass} w-full`}
                value={walkinForm.name}
                onChange={(e) => setWalkinForm({ ...walkinForm, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Patient Mobile Phone</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                required
                pattern="^[6-9]\d{9}$"
                className={`${inputClass} w-full`}
                value={walkinForm.phone}
                onChange={(e) => setWalkinForm({ ...walkinForm, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Select Open Available Slot</label>
              <select
                required
                className={`${inputClass} w-full`}
                value={walkinForm.slotId}
                onChange={(e) => setWalkinForm({ ...walkinForm, slotId: e.target.value })}
              >
                <option value="">-- Choose an open slot --</option>
                {openSlots.slice(0, 40).map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.date} at {s.time}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Treatment / Procedure</label>
              <input
                type="text"
                placeholder="e.g. Tooth Filling, Consultation, Extraction"
                className={`${inputClass} w-full`}
                value={walkinForm.treatment}
                onChange={(e) => setWalkinForm({ ...walkinForm, treatment: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Doctor / Clinical Notes</label>
              <textarea
                rows={2}
                placeholder="Walk-in notes..."
                className={`${inputClass} w-full`}
                value={walkinForm.reason}
                onChange={(e) => setWalkinForm({ ...walkinForm, reason: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-ink text-white rounded-lg font-bold text-sm hover:bg-ink/90 shadow-sm"
            >
              Confirm Walk-In Booking
            </button>
          </form>
        </section>
      )}

      {/* TAB 4: OPEN SLOTS INVENTORY */}
      {activeTab === "slots" && (
        <section className="bg-white rounded-xl border border-mist p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink">Open Time Slots ({openSlots.length})</h2>
            <button
              onClick={() => setActiveTab("generator")}
              className="text-xs font-bold text-teal hover:underline"
            >
              + Generate More Slots
            </button>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {openSlots.map((s) => {
              const isEditing = editingSlot?._id === s._id;
              return (
                <div
                  key={s._id}
                  className="p-3 rounded-lg border border-mist bg-mist/20 hover:bg-mist/40 transition-colors flex flex-col justify-between gap-2"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="date"
                        className="text-xs border p-1 rounded w-full"
                        value={editingSlot.date}
                        onChange={(e) => setEditingSlot({ ...editingSlot, date: e.target.value })}
                      />
                      <input
                        type="time"
                        className="text-xs border p-1 rounded w-full"
                        value={editingSlot.time}
                        onChange={(e) => setEditingSlot({ ...editingSlot, time: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <button onClick={saveEditSlot} className="text-xs bg-teal text-white px-2 py-1 rounded">
                          Save
                        </button>
                        <button onClick={() => setEditingSlot(null)} className="text-xs text-ink/60 px-2 py-1">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="font-bold text-ink text-sm">{s.date}</div>
                        <div className="text-teal font-semibold text-xs mt-0.5">{s.time}</div>
                      </div>
                      <div className="flex items-center justify-between border-t border-ink/10 pt-2 text-xs">
                        <button
                          onClick={() => setEditingSlot(s)}
                          className="text-ink/70 hover:text-teal font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeSlot(s._id)}
                          className="text-gum hover:underline font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
