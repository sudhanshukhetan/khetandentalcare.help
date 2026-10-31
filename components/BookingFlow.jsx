"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { validatePhone } from "@/lib/validation";

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

  // Patient contact details (direct booking without login)
  const [patientName, setPatientName] = useState(sessionUser?.name || "");
  const [patientPhone, setPatientPhone] = useState(sessionUser?.phone || "");
  const [fieldErrors, setFieldErrors] = useState({});

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

  // Compute unique sorted dates
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

  const validateForm = () => {
    const errors = {};
    if (!patientName.trim() || patientName.trim().length < 2) {
      errors.patientName = "Please enter your full name (at least 2 letters).";
    }
    const phoneCheck = validatePhone(patientPhone);
    if (!phoneCheck.isValid) {
      errors.patientPhone = phoneCheck.error || "Please enter a valid 10-digit Indian mobile number.";
    }
    if (!picked) {
      errors.slot = "Please select an available appointment time slot.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBooking = async () => {
    setErrorMsg("");
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const phoneValidation = validatePhone(patientPhone);

      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: picked._id,
          name: patientName.trim(),
          phone: phoneValidation.cleanPhone,
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
          patientName: patientName.trim(),
          patientPhone: phoneValidation.cleanPhone,
          treatment,
          reason,
        });
        setPicked(null);
        setReason("");
        loadSlots();
      }
    } catch {
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
              Your appointment with <span className="font-semibold text-ink">Dr. Prachi Khetan</span> has been booked directly.
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
              <span className="font-bold text-ink">{bookingSuccess.patientName}</span>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-2">
              <span className="text-ink/60">Contact Phone:</span>
              <span className="font-bold text-ink">+91 {bookingSuccess.patientPhone}</span>
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
              href={`https://wa.me/919101616156?text=Hi%20Dr.%20Prachi,%20I%20have%20booked%20an%20appointment%20for%20${bookingSuccess.patientName}%20on%20${bookingSuccess.date}%20at%20${bookingSuccess.time}%20for%20${encodeURIComponent(bookingSuccess.treatment)}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
            >
              WhatsApp Clinic
            </a>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-lg bg-ink text-white font-semibold text-sm hover:bg-ink/90 transition-colors shadow-sm"
            >
              Back to Home
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 text-teal text-xs font-bold uppercase tracking-wider mb-2">
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse" aria-hidden="true"></span>
          Direct Patient Booking · No Login Required
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink mt-1">Book Your Dental Visit</h1>
        <p className="text-sm text-ink/70 mt-1 max-w-2xl">
          Patients can book directly without creating an account or logging in. Simply select your date and time slot, enter your name and phone number, and receive instant confirmation.
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
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
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

              {fieldErrors.slot && (
                <p className="text-xs text-gum font-semibold">{fieldErrors.slot}</p>
              )}

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
                          onClick={() => {
                            setPicked(s);
                            if (fieldErrors.slot) setFieldErrors({ ...fieldErrors, slot: null });
                          }}
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
                          onClick={() => {
                            setPicked(s);
                            if (fieldErrors.slot) setFieldErrors({ ...fieldErrors, slot: null });
                          }}
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

          {/* RIGHT: Patient Info & Confirmation Sidebar */}
          <div className="space-y-6">
            <div className="bg-mist/80 p-6 rounded-2xl border border-mist shadow-sm sticky top-24 space-y-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-teal uppercase bg-teal/10 px-2 py-0.5 rounded">
                  No Login Required
                </span>
                <h3 className="text-lg font-bold text-ink mt-1">Patient Information</h3>
              </div>

              {/* Patient Name */}
              <div>
                <label htmlFor="patient-name" className="text-xs font-bold text-ink block mb-1">
                  Patient Full Name <span className="text-gum">*</span>
                </label>
                <input
                  id="patient-name"
                  type="text"
                  placeholder="Enter patient full name"
                  value={patientName}
                  onChange={(e) => {
                    setPatientName(e.target.value);
                    if (fieldErrors.patientName) setFieldErrors({ ...fieldErrors, patientName: null });
                  }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none transition-all ${
                    fieldErrors.patientName ? "border-gum ring-1 ring-gum/30" : "border-ink/20 focus:ring-2 focus:ring-teal"
                  }`}
                  required
                />
                {fieldErrors.patientName && (
                  <p className="text-[11px] text-gum mt-1">{fieldErrors.patientName}</p>
                )}
              </div>

              {/* Patient Phone */}
              <div>
                <label htmlFor="patient-phone" className="text-xs font-bold text-ink block mb-1">
                  10-Digit Mobile Number <span className="text-gum">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-2.5 rounded-l-lg border border-r-0 border-ink/20 bg-white text-xs font-semibold text-ink/70">
                    +91
                  </span>
                  <input
                    id="patient-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={patientPhone}
                    onChange={(e) => {
                      setPatientPhone(e.target.value.replace(/\D/g, ""));
                      if (fieldErrors.patientPhone) setFieldErrors({ ...fieldErrors, patientPhone: null });
                    }}
                    className={`w-full border rounded-r-lg px-3 py-2 text-sm bg-white focus:outline-none transition-all ${
                      fieldErrors.patientPhone ? "border-gum ring-1 ring-gum/30" : "border-ink/20 focus:ring-2 focus:ring-teal"
                    }`}
                    required
                  />
                </div>
                {fieldErrors.patientPhone && (
                  <p className="text-[11px] text-gum mt-1">{fieldErrors.patientPhone}</p>
                )}
              </div>

              {/* Selected Slot Overview */}
              <div className="p-3 bg-white rounded-xl border border-mist space-y-1 text-xs">
                <span className="text-ink/60 block">Selected Slot:</span>
                {picked ? (
                  <span className="font-bold text-teal text-sm block">
                    {formatDateLabel(picked.date)} at {picked.time}
                  </span>
                ) : (
                  <span className="text-gum font-medium italic block">
                    ← Please select a time slot on the left
                  </span>
                )}
              </div>

              {/* Symptoms / Note */}
              <div>
                <label htmlFor="patient-reason" className="text-xs font-semibold text-ink block mb-1">
                  Dental Symptoms / Notes (optional):
                </label>
                <textarea
                  id="patient-reason"
                  rows={2}
                  placeholder="e.g. Toothache, chipped tooth, checkup..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-ink/20 bg-white outline-none focus:border-teal"
                />
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleBooking}
                disabled={submitting}
                className="w-full py-3 rounded-lg bg-teal text-white font-bold text-sm hover:bg-teal/90 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Reserving Chair...</span>
                  </>
                ) : (
                  <span>Confirm Appointment →</span>
                )}
              </button>
              <p className="text-[11px] text-ink/60 text-center">
                Instant confirmation · No password required
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
