import mongoose from "mongoose";
import { isMongo } from "@/lib/db";
import { LocalDb } from "@/lib/localDb";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["patient", "admin"], default: "patient" },
}, { timestamps: true });

const MongoUser = mongoose.models.User || mongoose.model("User", UserSchema);

const User = new Proxy(MongoUser, {
  get(target, prop) {
    if (isMongo()) {
      return target[prop];
    }
    if (prop in LocalDb.User) {
      return LocalDb.User[prop];
    }
    return target[prop];
  },
});

export default User;
