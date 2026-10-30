# Khetan Dental Care — Patient Portal & Appointment Booking System

Full-stack production dental clinic web portal for **Khetan Dental Care**, located in **Raha, Nagaon, Assam (Dr. Prachi Khetan, BDS)**.

Live Deployment: **[https://khetandentalcarehelp.vercel.app/](https://khetandentalcarehelp.vercel.app/)**

---

## ✨ Features

- **Painless Online Booking Flow:** Patients book time slots in seconds with instant SMS confirmation.
- **5-Digit SMS OTP Verification:** Multi-factor authentication via DLT-approved SMS gateway with direct dispatch to mobile numbers.
- **Host / Doctor MFA Security:** Clinic host login with secondary 5-digit verification sent directly to the clinic helpline (+91 9101616156).
- **Comprehensive Services & Upfront Pricing:** Transparent pricing for dental implants, root canals, crowns, scaling, and orthodontic treatments.
- **Doctor / Admin Management Dashboard:**
  - View, search, and filter daily and upcoming appointments.
  - Multi-day bulk slot generator with lunch-break exclusion.
  - Walk-in patient registration tool with atomic slot locking.
  - One-click WhatsApp contact and appointment status updates.
- **Patient Appointment Portal:** View upcoming visits, treatment details, and self-service cancellation.
- **Zero External Database Dependency:** Operates seamlessly with built-in file-based storage (`data/db.json` / `/tmp/` on serverless) or scales to MongoDB Atlas.
- **Accessible & Responsive:** Fully responsive mobile hamburger navigation and accessible semantic HTML.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ installed

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
# JWT Session Secret
JWT_SECRET=your_production_secret_key_here

# Clinic Head & Admin Settings
ADMIN_EMAIL=dr.prachikhetan.bds18@gmail.com
CLINIC_PHONE=9101616156

# Admin Password Hash (Generated via npm run hash)
ADMIN_PASSWORD_HASH='$2a$12$kU.06P6EuWJMw4JpeDyDo../W9vACKbGe/1ln6lPGf2713AQ.rbE.'

# Fast2SMS OTP Gateway (Optional - logs safely to console if empty)
FAST2SMS_API_KEY=
```

- **Built-in Database:** Works automatically out-of-the-box! Saves persistent data in `data/db.json` without requiring MongoDB installed.
- **Production MongoDB (Optional):** Set `MONGODB_URI=mongodb+srv://...` in `.env.local` whenever you want to connect to a cloud MongoDB Atlas database.

### 3. Initialize Available Clinic Slots
To generate fresh consultation slots for the next 8 days:
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔐 Authentication & Roles

### 👩‍⚕️ Doctor / Admin Access
- Access route: `/login` (automatically redirects to `/admin` upon successful authentication).
- Protected by password and secondary 5-digit verification code dispatched to clinic mobile.

### 👤 Patient Access
- Access route: `/login` or `/book`.
- Patients can register a new account, sign in via password, or authenticate using mobile SMS OTP.

---

## 📁 Project Structure

```
├── app/
│   ├── page.jsx                    # Homepage (Hero, About Doctor, Services, Clinical Protocols)
│   ├── layout.jsx                  # Root layout with dynamic session auth & navbar
│   ├── globals.css                 # Tailwind & typography styling
│   ├── login/page.jsx              # Accessible SSR login, registration & OTP flow
│   ├── book/page.jsx               # Protected patient appointment booking wizard
│   ├── my-appointments/page.jsx    # Patient appointment management portal
│   ├── admin/page.jsx              # Protected doctor / clinic administration dashboard
│   └── api/
│       ├── auth/login/route.js     # Admin & patient login verification
│       ├── auth/register/route.js  # New patient account registration
│       ├── auth/send-otp/route.js  # Dispatch 5-digit verification code via SMS
│       ├── auth/verify-otp/route.js# Verify patient mobile OTP
│       ├── auth/logout/route.js    # Session termination and cookie clearing
│       ├── slots/route.js          # Slot retrieval & bulk generator
│       ├── slots/[id]/route.js     # Slot editing and deletion
│       ├── book/route.js           # Atomic slot booking & appointment creation
│       ├── appointments/route.js   # Patient and admin appointment listings
│       └── admin/walkin/route.js   # In-person walk-in booking tool
├── components/
│   ├── Navbar.jsx                  # Responsive navigation bar with mobile hamburger drawer
│   ├── BookingFlow.jsx             # Interactive booking wizard with receipts
│   ├── MyAppointmentsClient.jsx    # Patient appointment viewer & cancellation
│   ├── AdminSlots.jsx              # Doctor control panel with multi-day generator
│   └── Services.jsx                # Categorized dental treatments & price list
├── lib/
│   ├── auth.js                     # Jose JWT session signing & cookie handlers
│   ├── db.js                       # Database abstraction layer (LocalDb / MongoDB)
│   ├── localDb.js                  # Persistent JSON database with Vercel serverless support
│   ├── otp.js                      # Cryptographic 5-digit OTP generator & store
│   ├── sms.js                      # DLT-compliant Fast2SMS gateway dispatcher
│   └── validation.js               # Strict Indian phone & email validation
└── middleware.js                   # Route protection and role-based access control
```

---

## 🏥 Clinic Information

- **Clinic Name:** Khetan Dental Care
- **Lead Dentist:** Dr. Prachi Khetan, BDS (RUHS Jaipur)
- **Location:** Raha New Charali, near Assam Gramin Vikas Bank & Shankar Cycle Store, Raha, Nagaon, Assam – 782103
- **Contact:** +91 9101616156 / dr.prachikhetan.bds18@gmail.com
