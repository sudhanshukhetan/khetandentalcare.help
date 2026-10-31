"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar({ session }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile navigation drawer whenever route/pathname changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isLoginPage = pathname === "/login";
  const isBookPage = pathname === "/book";

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-mist">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-lg tracking-tight text-ink hover:text-teal transition-colors"
        >
          <span
            aria-hidden="true"
            className="w-9 h-9 rounded-lg bg-teal text-white flex items-center justify-center font-extrabold text-lg shadow-sm"
          >
            🦷
          </span>
          <div>
            <span className="block leading-tight font-extrabold">Khetan Dental Care</span>
            <span className="block text-[11px] text-ink/60 font-medium leading-none">
              Raha, Nagaon · Dr. Prachi Khetan
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          <Link
            href="/#services"
            className="text-ink/80 hover:text-teal transition-colors"
          >
            Services & Pricing
          </Link>
          <Link
            href="/#doctor"
            className="text-ink/80 hover:text-teal transition-colors"
          >
            About Doctor
          </Link>
          <Link
            href="/#contact"
            className="text-ink/80 hover:text-teal transition-colors"
          >
            Contact
          </Link>

          {/* Authenticated State: Host / Admin */}
          {session?.role === "admin" ? (
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-md bg-teal/10 text-teal font-semibold hover:bg-teal/20 transition-colors"
              >
                Admin Dashboard
              </Link>
              <a
                href="/api/auth/logout"
                className="text-ink/60 hover:text-gum transition-colors text-xs font-semibold"
              >
                Log out
              </a>
            </div>
          ) : (
            /* Public Visitors: Patient Direct Booking & Host Login */
            <div className="flex items-center gap-3">
              {!isLoginPage && (
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-ink/75 hover:text-teal border border-ink/20 rounded-md hover:bg-mist transition-colors"
                  title="Host & Doctor Administration Login"
                >
                  Host Login
                </Link>
              )}
              {!isBookPage && (
                <Link
                  href="/book"
                  className="px-3.5 py-1.5 rounded-md bg-teal text-white font-semibold text-xs hover:bg-teal/90 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <span>Book as Patient</span>
                  <span className="text-[10px] bg-white/20 px-1 py-0.2 rounded font-normal">No Login</span>
                </Link>
              )}
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg text-ink/80 hover:text-ink hover:bg-mist/80 focus:outline-none focus:ring-2 focus:ring-teal"
          >
            {isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {isOpen && (
        <div
          id="mobile-nav"
          className="md:hidden border-t border-mist bg-white/98 backdrop-blur-md px-4 pt-3 pb-6 shadow-lg animate-in slide-in-from-top-2 duration-200"
        >
          <nav className="flex flex-col space-y-3 text-sm font-semibold pt-1">
            <Link
              href="/#services"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-lg text-ink/80 hover:bg-mist hover:text-teal transition-colors"
            >
              Services & Pricing
            </Link>
            <Link
              href="/#doctor"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-lg text-ink/80 hover:bg-mist hover:text-teal transition-colors"
            >
              About Doctor
            </Link>
            <Link
              href="/#contact"
              onClick={() => setIsOpen(false)}
              className="px-3 py-2 rounded-lg text-ink/80 hover:bg-mist hover:text-teal transition-colors"
            >
              Contact
            </Link>

            <div className="pt-2 border-t border-mist space-y-2">
              {session?.role === "admin" ? (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-lg bg-teal/10 text-teal font-bold hover:bg-teal/20"
                  >
                    Admin Dashboard
                  </Link>
                  <a
                    href="/api/auth/logout"
                    className="block px-3 py-2 rounded-lg text-gum font-semibold hover:bg-gum/10 text-xs"
                  >
                    Log out
                  </a>
                </>
              ) : (
                <div className="space-y-2 pt-1">
                  <Link
                    href="/book"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2.5 rounded-lg bg-teal text-white font-bold text-center shadow-sm hover:bg-teal/90 text-sm"
                  >
                    Book as Patient (No Login Required)
                  </Link>
                  {!isLoginPage && (
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2 rounded-lg border border-ink/20 text-center font-semibold text-ink/80 hover:bg-mist text-xs"
                    >
                      Host / Doctor Login (ID & OTP)
                    </Link>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
