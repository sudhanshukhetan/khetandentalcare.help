import mongoose from "mongoose";

let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null, failedUntil: 0 };
}

export async function db() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  // If connection failed recently (within last 30s), avoid blocking cold requests
  if (Date.now() < cached.failedUntil) {
    return null;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 2000,
        connectTimeoutMS: 2000,
        socketTimeoutMS: 5000,
        maxPoolSize: 10,
        minPoolSize: 1,
      })
      .then((m) => {
        cached.conn = m;
        return m;
      })
      .catch((err) => {
        console.warn("[MongoDB Info]: Using fast local storage fallback.", err.message);
        cached.promise = null;
        cached.conn = null;
        cached.failedUntil = Date.now() + 30000;
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch {
    cached.conn = null;
  }

  return cached.conn;
}

export function isMongo() {
  return Boolean(mongoose.connection && mongoose.connection.readyState === 1);
}
