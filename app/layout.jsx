import "./globals.css";
import Link from "next/link";
import { getSession } from "@/lib/auth";

export const metadata = {
  title: "Khetan Dental Care | Dr. Prachi Khetan, Raha, Nagaon",
  description: "Advanced dental clinic in Raha, Nagaon, Assam offering dental implants, painless root canals, scaling, dentures, teeth whitening & orthodontic treatment with Dr. Prachi Khetan.",
};

export default async function RootLayout({ children }) {
  const s = await getSession();
  return (
    <html lang="en">
      <body className="bg-white text-ink min-h-screen flex flex-col font-sans antialiased">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-mist">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-ink hover:text-teal transition-colors">
              <span className="w-9 h-9 rounded-lg bg-teal text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
                🦷
              </span>
              <div>
                <span className="block leading-tight font-extrabold">Khetan Dental Care</span>
                <span className="block text-[11px] text-ink/60 font-medium leading-none">Raha, Nagaon · Dr. Prachi Khetan</span>
              </div>
            </Link>
            <nav className="flex items-center gap-3 sm:gap-6 text-sm font-medium">
              <Link href="/#services" className="text-ink/80 hover:text-teal transition-colors hidden sm:inline-block">Services & Pricing</Link>
              <Link href="/#doctor" className="text-ink/80 hover:text-teal transition-colors hidden md:inline-block">About Doctor</Link>
              <Link href="/#contact" className="text-ink/80 hover:text-teal transition-colors hidden md:inline-block">Contact</Link>
              
              {s?.role === "admin" && (
                <>
                  <Link href="/admin" className="px-3 py-1.5 rounded-md bg-teal/10 text-teal font-semibold hover:bg-teal/20 transition-colors">Admin Dashboard</Link>
                  <a href="/api/auth/logout" className="text-ink/60 hover:text-gum transition-colors text-xs font-semibold">Log out</a>
                </>
              )}
              {s?.role === "patient" && (
                <>
                  <Link href="/book" className="px-3.5 py-1.5 rounded-md bg-teal text-white font-semibold hover:bg-teal/90 transition-colors shadow-sm">Book Visit</Link>
                  <Link href="/my-appointments" className="text-ink/80 hover:text-teal transition-colors hidden sm:inline-block">My Appointments</Link>
                  <a href="/api/auth/logout" className="text-ink/60 hover:text-gum transition-colors text-xs font-semibold">Log out</a>
                </>
              )}
              {!s && (
                <div className="flex items-center gap-3">
                  <Link href="/login" className="text-ink/80 hover:text-teal transition-colors">Log in</Link>
                  <Link href="/book" className="px-3.5 py-1.5 rounded-md bg-ink text-white font-semibold hover:bg-ink/90 transition-colors shadow-sm">Book Appointment</Link>
                </div>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
