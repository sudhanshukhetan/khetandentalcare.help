import mongoose from "mongoose";

let cached = global._mongoose || (global._mongoose = { conn: null, checked: false });

export async function db() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  try {
    cached.conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    return cached.conn;
  } catch (err) {
    console.warn("MongoDB connection unavailable. Using built-in persistent local store.", err.message);
    return null;
  }
}

export function isMongo() {
  return Boolean(mongoose.connection && mongoose.connection.readyState === 1);
}
