# Khetan Dental Care — Clinic Website & Booking Platform

Modern, fully responsive dental clinic website and live appointment booking platform for **Dr. Prachi Khetan (BDS RUHS)**, located at Raha New Charali, Nagaon, Assam.

**Tech Stack:** Next.js 14 (App Router) · React 18 · Tailwind CSS · Hybrid Database (Built-in Persistent Store with zero-config + MongoDB/Mongoose support) · JWT Session Auth in httpOnly cookies (`jose`) · `bcryptjs` · Fast2SMS & WhatsApp notifications.

---

## ✨ Features

- **Clinic & Doctor Showcase:**
  - Full introduction to Dr. Prachi Khetan (BDS RUHS Jaipur Top-3 Rank Holder, Fellowships in Implantology & Impaction).
  - Modern clinical standards (hospital-grade sterilization, intraoral digital scanning, painless anesthesia, zero hidden fees).
  - Clinic timings, Google Maps directions, patient reviews, and interactive dental FAQ.
  - Floating direct WhatsApp and Call button (`+91 9101616156`).

- **Interactive Dental Services & Pricing:**
  - Detailed pricing for OPD (₹300), Root Canal RCT (₹3,000), Cleaning/Scaling (₹1,500 - ₹2,000), Fillings, Implants, Extractions, Dentures, and Orthodontics.
  - "Book Visit" quick links directly from any procedure card.

- **Patient Booking Flow (`/book`):**
  - Treatment selection dropdown (General Consultation, RCT, Implants, Scaling, Filling, Extraction, Braces, etc.).
  - Real-time slot availability grouped into Morning (10:00 AM – 1:30 PM) and Evening (4:00 PM – 7:30 PM) sessions.
  - Atomic booking claim (`findOneAndUpdate`) preventing race conditions and double bookings.
  - Confirmation screen with booking reference ID, printable slip, and instant WhatsApp notification link.

- **Patient Portal (`/my-appointments`):**
  - View all past and upcoming visits with status badges (`Confirmed`, `Completed`, `Cancelled`).
  - Self-service appointment cancellation (frees slot back into inventory).
  - Print / save appointment receipt.

- **Doctor & Clinic Dashboard (`/admin`):**
  - Real-time stats (Today's visits, total booked, open slots).
  - Filterable patient appointments table with one-click Call and WhatsApp links.
  - Status management: Mark treatment completed or cancelled.
  - Multi-Day Slot Generator: Generate slots for today, next 3 days, 1 week, or 2 weeks with custom intervals and automatic lunch break exclusion.
  - Walk-In & Offline Patient Booking tool.
  - Open slot inventory management (edit time or delete).

- **Authentication & Security:**
  - Secure patient registration and login with session validation.
  - Doctor / Admin login protected by bcrypt hash and secure server-only cookies.
  - Instant demo login one-click auto-fill buttons on the login page.
  - Server-side logout route (`/api/auth/logout`).

---

## 🚀 Quick Start

### 1. Install & Setup
```bash
cd /Users/sudhanshu/.gemini/antigravity/scratch/khetan-dental
npm install
```

### 2. Environment Configuration
The `.env.local` file is already created and pre-configured. If customizing:
```bash
cp .env.example .env.local
```
- **Built-in Database:** Works automatically out-of-the-box! Saves persistent data in `data/db.json` without requiring MongoDB installed.
- **Production MongoDB (Optional):** Set `MONGODB_URI=mongodb+srv://...` in `.env.local` whenever you want to connect to a cloud MongoDB Atlas database.

### 3. Seed Realistic Data (Optional)
To generate fresh consultation slots for the next 8 days and demo data:
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔐 Credentials

### 👩‍⚕️ Doctor / Admin Account
- **URL:** `/login` (automatically redirects to `/admin`)
- **Email:** `dr.prachikhetan.bds18@gmail.com`
- **Password:** `DrPrachi@2026`

### 👤 Demo Patient Account
- **URL:** `/login` (redirects to `/book`)
- **Email:** `rahul@gmail.com`
- **Password:** `Password@123`

*(You can also click the quick auto-fill buttons on the `/login` page).*

---

## 📁 Project Structure

```
├── app/
│   ├── page.jsx                    # Homepage (Hero, About Doctor, Services, FAQ, Directions)
│   ├── layout.jsx                  # Header with dynamic session auth, navigation & footer
│   ├── globals.css                 # Tailwind & print styling
│   ├── login/page.jsx              # Tabbed login & patient registration with demo auto-fill
│   ├── book/page.jsx               # Protected patient appointment booking page
│   ├── my-appointments/page.jsx    # Patient appointment management portal
│   ├── admin/page.jsx              # Protected doctor / clinic administration dashboard
│   └── api/
│       ├── auth/login/route.js     # Admin & patient login verification
│       ├── auth/register/route.js  # New patient account registration
│       ├── auth/logout/route.js    # Session termination and cookie clearing
│       ├── slots/route.js          # Slot retrieval & bulk generator
│       ├── slots/[id]/route.js     # Slot editing and deletion
│       ├── book/route.js           # Atomic slot booking & appointment creation
│       ├── appointments/route.js   # Patient and admin appointment listings
│       ├── appointments/[id]/      # Status update (completed / cancelled)
│       └── admin/walkin/route.js   # In-person walk-in booking tool
├── components/
│   ├── BookingFlow.jsx             # Interactive booking wizard with receipts
│   ├── MyAppointmentsClient.jsx    # Patient appointment viewer & cancellation
│   ├── AdminSlots.jsx              # Doctor control panel with multi-day generator
│   └── Services.jsx                # Categorized dental treatments & price list
├── lib/
│   ├── db.js                       # Hybrid DB connector (MongoDB + Local Fallback)
│   ├── localDb.js                  # Persistent local JSON data store
│   ├── auth.js                     # JWT session signer & verify
│   └── sms.js                      # Fast2SMS & WhatsApp notifications
├── models/                         # User, TimeSlot, Appointment models
├── scripts/
│   ├── hash.js                     # Password hash generator
│   └── seed.js                     # Slot & demo data seeder
└── data/db.json                    # Persistent local database store
```

---

## 📍 Clinic Details

- **Doctor:** Dr. Prachi Khetan, BDS (RUHS Jaipur)
- **Phone:** `+91 9101616156`
- **Email:** `dr.prachikhetan.bds18@gmail.com`
- **Address:** Raha New Charali, near Assam Gramin Vikas Bank, near Shankar Cycle Store, Raha, Nagaon, Assam 782103
- **Hours:** Monday – Saturday: 10:00 AM – 1:30 PM & 4:00 PM – 7:30 PM | Sunday: 10:00 AM – 1:30 PM
