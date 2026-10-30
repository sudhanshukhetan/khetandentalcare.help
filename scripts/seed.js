import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function generateId() {
  return crypto.randomBytes(12).toString("hex");
}

async function seed() {
  const passwordHash = await bcrypt.hash("Password@123", 10);
  const patientId = generateId();
  const demoUser = {
    _id: patientId,
    name: "Rahul Bora",
    email: "rahul@gmail.com",
    phone: "9864012345",
    passwordHash,
    role: "patient",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const timeSlots = [];
  const times = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];

  // Generate slots for today and next 7 days
  const today = new Date();
  for (let d = 0; d < 8; d++) {
    const cur = new Date(today);
    cur.setDate(today.getDate() + d);
    const dateStr = cur.toISOString().slice(0, 10);

    for (const time of times) {
      timeSlots.push({
        _id: generateId(),
        date: dateStr,
        time,
        isBooked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // Book one slot as a demonstration
  const bookedSlot = timeSlots.find(s => s.date === today.toISOString().slice(0, 10) && s.time === "11:00") || timeSlots[2];
  bookedSlot.isBooked = true;

  const demoAppt = {
    _id: generateId(),
    user: patientId,
    slot: bookedSlot._id,
    treatment: "Scaling & Teeth Cleaning",
    reason: "Routine dental checkup and teeth scaling",
    status: "confirmed",
    smsSent: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const db = {
    users: [demoUser],
    timeSlots,
    appointments: [demoAppt],
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  console.log(`Seeded ${timeSlots.length} slots, 1 demo patient, and 1 appointment to data/db.json.`);
}

seed().catch(console.error);

