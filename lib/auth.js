import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const key = () =>
  new TextEncoder().encode(
    process.env.JWT_SECRET || "khetan-dental-care-super-secret-jwt-key-2026-secure-token-clinic"
  );

export async function signSession(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(key());
}

export function setSessionCookie(res, token) {
  // Enforce secure HTTPS cookies on Vercel and production deployments
  // In local development (http://localhost:3000), keep secure: false so localhost cookies work
  const isHttps =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.VERCEL_URL) ||
    process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://") ||
    false;

  res.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
    path: "/",
    maxAge: 604800, // 7 days
  });
}

export async function getSession() {
  try {
    const cookieStore = cookies();
    const t = cookieStore.get("session")?.value;
    if (!t) return null;
    return (await jwtVerify(t, key())).payload;
  } catch (err) {
    return null;
  }
}

// Role is only ever "admin" if the server issued it at login — never trusted from client
export async function requireAdmin() {
  const s = await getSession();
  return s?.role === "admin" ? s : null;
}
