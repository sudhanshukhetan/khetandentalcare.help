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
  const timeSlots = [];
  const times = [
    "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"
  ];

  // Generate real open slots for today and next 7 days
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

  // Pure empty states for genuine patients and appointments
  const db = {
    users: [],
    timeSlots,
    appointments: [],
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  console.log(`Initialized database with ${timeSlots.length} open consultation slots, 0 mock patients, and 0 mock appointments.`);
}

seed().catch(console.error);
