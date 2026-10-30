import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET =
  process.env.JWT_SECRET || "khetan-dental-care-super-secret-jwt-key-2026-secure-token-clinic";
const key = new TextEncoder().encode(JWT_SECRET);

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get("session")?.value;

  let session = null;
  if (sessionCookie) {
    try {
      const verified = await jwtVerify(sessionCookie, key);
      session = verified.payload;
    } catch {
      session = null;
    }
  }

  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/doctor");
  const isPatientRoute = pathname.startsWith("/my-appointments") || pathname.startsWith("/book");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isLoginPage = pathname === "/login";

  // 1. Unauthenticated users trying to access protected routes -> redirect to /login
  if (!session) {
    if (isAdminRoute || isPatientRoute || isDashboardRoute) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  } else {
    // 2. Already-authenticated users accessing /login -> redirect to their portal
    if (isLoginPage) {
      if (session.role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/book", req.url));
    }

    // 3. Role-Based Access Control (RBAC): Patients cannot access admin or doctor routes
    if (session.role !== "admin" && isAdminRoute) {
      return NextResponse.redirect(new URL("/book", req.url));
    }

    // 4. Generic /dashboard routing based on role
    if (isDashboardRoute) {
      if (session.role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/my-appointments", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/doctor/:path*",
    "/dashboard/:path*",
    "/my-appointments/:path*",
    "/book/:path*",
    "/login",
  ],
};

