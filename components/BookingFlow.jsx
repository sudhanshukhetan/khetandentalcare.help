"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

const TREATMENTS = [
  { id: "consultation", name: "General Consultation / Toothache", fee: "₹300" },
  { id: "scaling", name: "Teeth Cleaning & Scaling", fee: "₹1,500 – ₹2,000" },
  { id: "rct", name: "Root Canal Treatment (RCT)", fee: "₹3,000" },
  { id: "implant", name: "Dental Implants Consultation", fee: "Custom Plan" },
  { id: "filling", name: "Tooth Filling (Composite/GIC)", fee: "₹500 – ₹1,000" },
  { id: "extraction", name: "Tooth Extraction / Impaction", fee: "₹500 – ₹6,000" },
  { id: "ortho", name: "Braces & Orthodontic Alignment", fee: "Custom Plan" },
  { id: "whitening", name: "Teeth Whitening", fee: "₹2,000" },
  { id: "denture", name: "Complete / Partial Dentures (CD/RPD)", fee: "Case Dependent" },
];

export default function BookingFlow({ sessionUser }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [picked, setPicked] = useState(null);
  const [treatment, setTreatment] = useState(TREATMENTS[0].name);
  const [reason, setReason] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadSlots = async () => {
    try {
      const res = await fetch("/api/slots");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSlots(data);
      }
    } catch (e) {
      console.error("Failed to load slots", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
    const interval = setInterval(loadSlots, 15000);
    return () => clearInterval(interval);
  }, []);

  // Compute unique sorted dates using useMemo to avoid re-triggering effects
  const dates = useMemo(() => {
    return [...new Set(slots.map((s) => s.date))].sort();
  }, [slots]);

  useEffect(() => {
    if (dates.length > 0 && (!date || !dates.includes(date))) {
      setDate(dates[0]);
    }
  }, [dates, date]);

  const timesForDate = useMemo(() => {
    return slots.filter((s) => s.date === date);
  }, [slots, date]);

  // Split into Morning and Evening sessions
  const morningTimes = useMemo(() => timesForDate.filter((s) => s.time < "14:00"), [timesForDate]);
  const eveningTimes = useMemo(() => timesForDate.filter((s) => s.time >= "14:00"), [timesForDate]);

  // Accurate calendar label for local dates
  const formatDateLabel = (dStr) => {
    if (!dStr) return "";
    try {
      const parts = dStr.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);

      const now = new Date();
      const todayYear = now.getFullYear();
      const todayMonth = now.getMonth();
      const todayDate = now.getDate();

      const isToday = parts[0] === todayYear && parts[1] - 1 === todayMonth && parts[2] === todayDate;
      const tom = new Date(todayYear, todayMonth, todayDate + 1);
      const isTomorrow = parts[0] === tom.getFullYear() && parts[1] - 1 === tom.getMonth() && parts[2] === tom.getDate();

      const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
      const dayNum = d.getDate();
      const month = d.toLocaleDateString("en-IN", { month: "short" });

      if (isToday) return `Today, ${dayName} ${dayNum} ${month}`;
      if (isTomorrow) return `Tomorrow, ${dayName} ${dayNum} ${month}`;
      return `${dayName}, ${dayNum} ${month}`;
    } catch {
      return dStr;
    }
  };

  const handleBooking = async () => {
    if (!picked) return;
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: picked._id,
          treatment,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to confirm appointment. That slot may have just been booked.");
        loadSlots();
      } else {
        setBookingSuccess({
          ...data,
          date: picked.date,
          time: picked.time,
          treatment,
          reason,
        });
        setPicked(null);
        setReason("");
        loadSlots();
      }
    } catch (err) {
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION RECEIPT
  if (bookingSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border-2 border-teal/20 rounded-2xl p-6 sm:p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-teal/10 text-teal rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <div>
            <span className="text-xs font-bold tracking-widest text-teal uppercase bg-teal/10 px-3 py-1 rounded-full">
              Booking Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink mt-3">
              We look forward to seeing you!
            </h1>
            <p className="text-sm text-ink/70 mt-1">
              Your appointment with <span className="font-semibold text-ink">Dr. Prachi Khetan</span> has been booked.
            </p>
          </div>

          <div className="bg-mist/70 rounded-xl p-5 text-left text-sm space-y-3 border border-mist">
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-ink/60">Appointment Reference:</span>
              <span className="font-mono font-bold text-teal">
                #{bookingSuccess.appointmentId ? bookingSuccess.appointmentId.slice(-6).toUpperCase() : "CONFIRMED"}
              </span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-ink/60">Patient Name:</span>
              <span className="font-bold text-ink">{bookingSuccess.patientName || sessionUser?.name}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-ink/60">Date & Time:</span>
              <span className="font-bold text-ink">
                {formatDateLabel(bookingSuccess.date)} at {bookingSuccess.time}
              </span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-ink/60">Treatment:</span>
              <span className="font-medium text-ink">{bookingSuccess.treatment}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-ink/60">Doctor:</span>
              <span className="font-medium text-ink">Dr. Prachi Khetan (BDS RUHS)</span>
            </div>
            <div className="flex flex-col gap-0.5 pt-1">
              <span className="text-ink/60 text-xs">Clinic Address:</span>
              <span className="text-xs font-medium text-ink leading-relaxed">
                Raha New Charali, near Assam Gramin Vikas Bank, near Shankar Cycle Store, Raha, Nagaon, Assam 782103
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-lg border border-ink/30 text-ink font-semibold text-sm hover:bg-mist transition-colors"
            >
              Print Receipt
            </button>
            <a
              href={`https://wa.me/919101616156?text=Hi%20Dr.%20Prachi,%20I%20have%20booked%20an%20appointment%20for%20${bookingSuccess.date}%20at%20${bookingSuccess.time}%20for%20${encodeURIComponent(bookingSuccess.treatment)}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
            >
              WhatsApp Notification
            </a>
            <Link
              href="/my-appointments"
              className="px-5 py-2.5 rounded-lg bg-ink text-white font-semibold text-sm hover:bg-ink/90 transition-colors shadow-sm"
            >
              View My Appointments
            </Link>
          </div>

          <button
            onClick={() => setBookingSuccess(null)}
            className="text-xs text-ink/60 underline hover:text-teal block mx-auto pt-2"
          >
            Book another appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8 text-center sm:text-left">
        <span className="text-xs font-bold text-teal tracking-wider uppercase bg-teal/10 px-2.5 py-1 rounded">
          Fast & Easy Scheduling
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink mt-2">Book Your Dental Visit</h1>
        <p className="text-sm text-ink/70 mt-1 max-w-xl">
          Logged in as <span className="font-semibold text-ink">{sessionUser?.name}</span>. Select your dental concern, choose a convenient date, and reserve your chair.
        </p>
      </div>

      {errorMsg && (
        <div role="alert" className="mb-6 p-4 rounded-lg bg-gum/10 border border-gum/30 text-gum text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
          <p className="text-ink/60 text-sm mt-3">Loading available appointments...</p>
        </div>
      ) : dates.length === 0 ? (
        <div className="text-center py-16 bg-mist/60 rounded-2xl p-8 border border-mist">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="text-xl font-bold text-ink">No Online Slots Available Currently</h3>
          <p className="text-sm text-ink/70 max-w-md mx-auto mt-2">
            All current online slots are booked or new slots are being updated. For urgent tooth pain or immediate appointment scheduling, please call the clinic directly.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="tel:9101616156"
              className="px-6 py-2.5 rounded-md bg-ink text-white font-semibold text-sm hover:bg-ink/90"
            >
              Call 9101616156
            </a>
            <a
              href="https://wa.me/919101616156?text=Hello%20Dr.%20Prachi,%20I%20would%20like%20to%20book%20an%20appointment."
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-md bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
            >
              Message on WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          {/* LEFT: Date & Slot Selection */}
          <div className="space-y-8">
            {/* Treatment Selector */}
            <div className="bg-white p-5 rounded-xl border border-mist shadow-sm">
              <label className="block text-sm font-bold text-ink mb-2">1. Select Dental Concern / Procedure</label>
              <select
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                className="w-full border border-ink/20 rounded-lg p-3 text-sm bg-white focus:ring-2 focus:ring-teal focus:border-teal outline-none"
              >
                {TREATMENTS.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.fee})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selector */}
            <div className="bg-white p-5 rounded-xl border border-mist shadow-sm">
              <label className="block text-sm font-bold text-ink mb-3">2. Select Date</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {dates.map((d) => {
                  const isSelected = d === date;
                  const label = formatDateLabel(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDate(d);
                        setPicked(null);
                      }}
                      className={`p-3 rounded-lg text-left border transition-all ${
                        isSelected
                          ? "bg-ink text-white border-ink shadow-sm"
                          : "border-ink/15 hover:border-teal/50 bg-white text-ink"
                      }`}
                    >
                      <div className="text-xs opacity-75">{label.split(", ")[0]}</div>
                      <div className="font-bold text-sm mt-0.5">{d.slice(5)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Picker */}
            <div className="bg-white p-5 rounded-xl border border-mist shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-ink">3. Choose Available Time Slot</label>
                <span className="text-xs text-ink/60">{timesForDate.length} available slots</span>
              </div>

              {morningTimes.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink/60 mb-2">
                    ☀️ Morning Sessions (10:00 AM – 1:30 PM)
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {morningTimes.map((s) => {
                      const isPicked = picked?._id === s._id;
                      return (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => setPicked(s)}
                          className={`py-2.5 px-3 rounded-lg text-sm font-semibold border transition-all text-center ${
                            isPicked
                              ? "bg-teal text-white border-teal shadow-md ring-2 ring-teal/30"
                              : "border-ink/20 hover:border-teal text-ink bg-mist/30 hover:bg-mist"
                          }`}
                        >
                          {s.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {eveningTimes.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink/60 mb-2">
                    🌆 Evening Sessions (4:00 PM – 7:30 PM)
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {eveningTimes.map((s) => {
                      const isPicked = picked?._id === s._id;
                      return (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => setPicked(s)}
                          className={`py-2.5 px-3 rounded-lg text-sm font-semibold border transition-all text-center ${
                            isPicked
                              ? "bg-teal text-white border-teal shadow-md ring-2 ring-teal/30"
                              : "border-ink/20 hover:border-teal text-ink bg-mist/30 hover:bg-mist"
                          }`}
                        >
                          {s.time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Booking Summary & Confirmation Sidebar */}
          <div className="space-y-6">
            <div className="bg-mist/80 p-6 rounded-2xl border border-mist shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-ink mb-4 pb-3 border-b border-ink/10">
                Appointment Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-ink/60 block">Doctor:</span>
                  <span className="font-semibold text-ink">Dr. Prachi Khetan (BDS)</span>
                </div>
                <div>
                  <span className="text-xs text-ink/60 block">Selected Treatment:</span>
                  <span className="font-semibold text-teal">{treatment}</span>
                </div>
                <div>
                  <span className="text-xs text-ink/60 block">Date & Time:</span>
                  {picked ? (
                    <span className="font-bold text-ink bg-white px-2.5 py-1 rounded border border-ink/10 inline-block mt-0.5">
                      {formatDateLabel(picked.date)} at {picked.time}
                    </span>
                  ) : (
                    <span className="text-ink/50 italic">Please select a time slot</span>
                  )}
                </div>
                <div>
                  <span className="text-xs text-ink/60 block">Clinic Location:</span>
                  <span className="text-xs text-ink/80 block mt-0.5">
                    Raha New Charali, near Assam Gramin Vikas Bank, Raha, Nagaon
                  </span>
                </div>
              </div>

              {picked && (
                <div className="mt-5 pt-4 border-t border-ink/10 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-ink block mb-1">
                      Reason for visit or symptoms (optional):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Sensitivity to cold water, chipped tooth, checkup..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-ink/20 bg-white outline-none focus:border-teal"
                    />
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={submitting}
                    className="w-full py-3 rounded-lg bg-teal text-white font-bold text-sm hover:bg-teal/90 transition-all shadow-md disabled:opacity-50"
                  >
                    {submitting ? "Booking appointment..." : `Confirm for ${picked.time}`}
                  </button>
                  <p className="text-[11px] text-ink/60 text-center">
                    Instant confirmation · Free cancellation
                  </p>
                </div>
              )}

              {!picked && (
                <div className="mt-6 p-3 rounded-lg bg-white/70 text-center text-xs text-ink/60 border border-ink/5">
                  Pick a date and time slot from the left to confirm your appointment.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
