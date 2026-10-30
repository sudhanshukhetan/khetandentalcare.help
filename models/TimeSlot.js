import mongoose from "mongoose";
import { isMongo } from "@/lib/db";
import { LocalDb } from "@/lib/localDb";

const TimeSlotSchema = new mongoose.Schema({
  date: { type: String, required: true, index: true }, // "YYYY-MM-DD"
  time: { type: String, required: true },              // "HH:mm" 24h
  isBooked: { type: Boolean, default: false },
}, { timestamps: true });

TimeSlotSchema.index({ date: 1, time: 1 }, { unique: true });

const MongoTimeSlot = mongoose.models.TimeSlot || mongoose.model("TimeSlot", TimeSlotSchema);

const TimeSlot = new Proxy(MongoTimeSlot, {
  get(target, prop) {
    if (isMongo()) {
      return target[prop];
    }
    if (prop in LocalDb.TimeSlot) {
      return LocalDb.TimeSlot[prop];
    }
    return target[prop];
  },
});

export default TimeSlot;
