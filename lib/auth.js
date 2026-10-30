import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const key = () => new TextEncoder().encode(process.env.JWT_SECRET || "khetan-dental-care-super-secret-jwt-key-2026-secure-token-clinic");

export async function signSession(payload) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d").sign(key());
}
export function setSessionCookie(res, token) {
  res.cookies.set("session", token, { httpOnly: true, sameSite: "lax",
    secure: process.env.NODE_ENV === "production", path: "/", maxAge: 604800 });
}
export async function getSession() {
  const t = cookies().get("session")?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload; } catch { return null; }
}
// role is only ever "admin" if the server issued it at login — never trusted from the client
export async function requireAdmin() {
  const s = await getSession();
  return s?.role === "admin" ? s : null;
}
