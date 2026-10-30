import fs from "fs";
import path from "path";
import crypto from "crypto";

function getDbPath() {
  // In Vercel serverless functions / AWS Lambda, the workspace root is read-only.
  // /tmp is the dedicated writable storage area.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return "/tmp/khetan_dental_db.json";
  }

  const localDir = path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return path.join(localDir, "db.json");
  } catch (err) {
    return "/tmp/khetan_dental_db.json";
  }
}

function ensureDbFile() {
  const dbPath = getDbPath();
  try {
    if (!fs.existsSync(dbPath)) {
      // Check if a pre-seeded data/db.json was packaged with the project
      const bundledPath = path.join(process.cwd(), "data", "db.json");
      if (fs.existsSync(bundledPath)) {
        const bundledContent = fs.readFileSync(bundledPath, "utf8");
        fs.writeFileSync(dbPath, bundledContent, "utf8");
      } else {
        const initialData = { users: [], timeSlots: [], appointments: [] };
        fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), "utf8");
      }
    }
  } catch (err) {
    console.error("[LocalDb Init Warning]:", err.message);
  }
}

function readDb() {
  ensureDbFile();
  const dbPath = getDbPath();
  try {
    const raw = fs.readFileSync(dbPath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return { users: [], timeSlots: [], appointments: [] };
  }
}

function writeDb(data) {
  ensureDbFile();
  const dbPath = getDbPath();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("[LocalDb Write Error]:", err.message);
  }
}

function generateId() {
  return crypto.randomBytes(12).toString("hex");
}

export const LocalDb = {
  // USER METHODS
  User: {
    async findOne(query = {}) {
      const db = readDb();
      let match = null;

      if (query.email) {
        const qEmail = query.email.toLowerCase().trim();
        match = db.users.find(u => u.email && u.email.toLowerCase().trim() === qEmail);
      } else if (query.phone) {
        const cleanPhone = String(query.phone).replace(/\D/g, "").slice(-10);
        match = db.users.find(u => u.phone && String(u.phone).replace(/\D/g, "").slice(-10) === cleanPhone);
      } else if (query._id) {
        match = db.users.find(u => String(u._id) === String(query._id));
      }
      return match ? { ...match } : null;
    },

    async findById(id) {
      const db = readDb();
      const match = db.users.find(u => String(u._id) === String(id));
      return match ? { ...match } : null;
    },

    async findByIdAndUpdate(id, update) {
      const db = readDb();
      const idx = db.users.findIndex(u => String(u._id) === String(id));
      if (idx === -1) return null;
      Object.assign(db.users[idx], update, { updatedAt: new Date().toISOString() });
      writeDb(db);
      return { ...db.users[idx] };
    },

    async create(data) {
      const db = readDb();
      const user = {
        _id: generateId(),
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        phone: String(data.phone).replace(/\D/g, "").slice(-10),
        passwordHash: data.passwordHash || "",
        role: data.role || "patient",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.users.push(user);
      writeDb(db);
      return { ...user };
    },
  },

  // TIMESLOT METHODS
  TimeSlot: {
    find(filter = {}) {
      const db = readDb();
      let results = [...db.timeSlots];

      if (filter.date) {
        if (typeof filter.date === "string") {
          results = results.filter(s => s.date === filter.date);
        } else if (filter.date.$gte) {
          results = results.filter(s => s.date >= filter.date.$gte);
        }
      }
      if (filter.isBooked !== undefined) {
        results = results.filter(s => s.isBooked === filter.isBooked);
      }

      const wrapper = {
        sort(sortObj) {
          results.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time.localeCompare(b.time);
          });
          return wrapper;
        },
        select(fieldsStr) {
          if (!fieldsStr) return wrapper;
          const fields = fieldsStr.split(" ").filter(Boolean);
          results = results.map(item => {
            const out = { _id: item._id };
            fields.forEach(f => {
              if (item[f] !== undefined) out[f] = item[f];
            });
            return out;
          });
          return wrapper;
        },
        lean() {
          return wrapper;
        },
        then(resolve, reject) {
          try {
            resolve(results);
          } catch (e) {
            if (reject) reject(e);
          }
        },
      };
      return wrapper;
    },

    async findById(id) {
      const db = readDb();
      const slot = db.timeSlots.find(s => String(s._id) === String(id));
      if (!slot) return null;
      return {
        ...slot,
        async save() {
          const freshDb = readDb();
          const idx = freshDb.timeSlots.findIndex(s => String(s._id) === String(id));
          if (idx !== -1) {
            freshDb.timeSlots[idx].date = this.date;
            freshDb.timeSlots[idx].time = this.time;
            freshDb.timeSlots[idx].isBooked = this.isBooked;
            freshDb.timeSlots[idx].updatedAt = new Date().toISOString();
            writeDb(freshDb);
          }
          return this;
        },
      };
    },

    async findByIdAndUpdate(id, update, options = {}) {
      const db = readDb();
      const idx = db.timeSlots.findIndex(s => String(s._id) === String(id));
      if (idx === -1) return null;

      if (update.isBooked !== undefined) db.timeSlots[idx].isBooked = update.isBooked;
      if (update.date !== undefined) db.timeSlots[idx].date = update.date;
      if (update.time !== undefined) db.timeSlots[idx].time = update.time;
      db.timeSlots[idx].updatedAt = new Date().toISOString();

      writeDb(db);
      return { ...db.timeSlots[idx] };
    },

    async findOneAndUpdate(filter, update, options = {}) {
      const db = readDb();
      const idx = db.timeSlots.findIndex(s => {
        if (filter._id && String(s._id) !== String(filter._id)) return false;
        if (filter.isBooked !== undefined && s.isBooked !== filter.isBooked) return false;
        return true;
      });

      if (idx === -1) return null;

      if (update.isBooked !== undefined) db.timeSlots[idx].isBooked = update.isBooked;
      if (update.date !== undefined) db.timeSlots[idx].date = update.date;
      if (update.time !== undefined) db.timeSlots[idx].time = update.time;
      db.timeSlots[idx].updatedAt = new Date().toISOString();

      writeDb(db);
      return { ...db.timeSlots[idx] };
    },

    async insertMany(docs) {
      const db = readDb();
      let count = 0;
      for (const d of docs) {
        const exists = db.timeSlots.some(s => s.date === d.date && s.time === d.time);
        if (!exists) {
          db.timeSlots.push({
            _id: generateId(),
            date: d.date,
            time: d.time,
            isBooked: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          count++;
        }
      }
      writeDb(db);
      return count;
    },

    async findByIdAndDelete(id) {
      const db = readDb();
      const idx = db.timeSlots.findIndex(s => String(s._id) === String(id));
      if (idx !== -1) {
        const deleted = db.timeSlots.splice(idx, 1)[0];
        writeDb(db);
        return deleted;
      }
      return null;
    },
  },

  // APPOINTMENT METHODS
  Appointment: {
    find(filter = {}) {
      const db = readDb();
      let results = [...db.appointments];

      if (filter.status) {
        results = results.filter(a => a.status === filter.status);
      }
      if (filter.user) {
        results = results.filter(a => String(a.user?._id || a.user) === String(filter.user));
      }
      if (filter.slot) {
        results = results.filter(a => String(a.slot?._id || a.slot) === String(filter.slot));
      }

      const wrapper = {
        populate(field, select) {
          if (field === "user") {
            const selectArr = select ? select.split(" ") : null;
            results = results.map(appt => {
              const u = db.users.find(usr => String(usr._id) === String(appt.user?._id || appt.user));
              let userObj = u ? { ...u } : null;
              if (userObj && selectArr) {
                const picked = { _id: userObj._id };
                selectArr.forEach(f => {
                  if (userObj[f] !== undefined) picked[f] = userObj[f];
                });
                userObj = picked;
              }
              return { ...appt, user: userObj };
            });
          }
          if (field === "slot") {
            results = results.map(appt => {
              const s = db.timeSlots.find(slot => String(slot._id) === String(appt.slot?._id || appt.slot));
              return { ...appt, slot: s ? { ...s } : null };
            });
          }
          return wrapper;
        },
        sort(sortObj) {
          results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          return wrapper;
        },
        lean() {
          return wrapper;
        },
        then(resolve, reject) {
          try {
            resolve(results);
          } catch (e) {
            if (reject) reject(e);
          }
        },
      };
      return wrapper;
    },

    async findById(id) {
      const db = readDb();
      const match = db.appointments.find(a => String(a._id) === String(id));
      return match ? { ...match } : null;
    },

    async create(data) {
      const db = readDb();
      const appt = {
        _id: generateId(),
        user: data.user,
        slot: data.slot,
        reason: data.reason || "",
        treatment: data.treatment || "General Consultation",
        status: data.status || "confirmed",
        smsSent: Boolean(data.smsSent),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.appointments.push(appt);
      writeDb(db);
      return { ...appt };
    },

    async findByIdAndUpdate(id, update) {
      const db = readDb();
      const idx = db.appointments.findIndex(a => String(a._id) === String(id));
      if (idx === -1) return null;
      Object.assign(db.appointments[idx], update, { updatedAt: new Date().toISOString() });
      writeDb(db);
      return { ...db.appointments[idx] };
    },

    async updateMany(filter, update) {
      const db = readDb();
      let count = 0;
      db.appointments.forEach(a => {
        let match = true;
        if (filter.slot && String(a.slot?._id || a.slot) !== String(filter.slot)) match = false;
        if (filter.user && String(a.user?._id || a.user) !== String(filter.user)) match = false;
        if (match) {
          Object.assign(a, update, { updatedAt: new Date().toISOString() });
          count++;
        }
      });
      if (count > 0) writeDb(db);
      return { modifiedCount: count };
    },
  },
};

export default LocalDb;
