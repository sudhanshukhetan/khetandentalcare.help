import mongoose from "mongoose";
import { isMongo } from "@/lib/db";
import { LocalDb } from "@/lib/localDb";

const AppointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot", required: true, unique: true },
  reason: { type: String, default: "" },
  treatment: { type: String, default: "General Consultation" },
  status: { type: String, enum: ["confirmed", "completed", "cancelled"], default: "confirmed" },
  smsSent: { type: Boolean, default: false },
}, { timestamps: true });

const MongoAppointment = mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);

const Appointment = new Proxy(MongoAppointment, {
  get(target, prop) {
    if (isMongo()) {
      return target[prop];
    }
    if (prop in LocalDb.Appointment) {
      return LocalDb.Appointment[prop];
    }
    return target[prop];
  },
});

export default Appointment;
