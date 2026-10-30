// SMS and Clinic Notification Service
// Supports Fast2SMS in production, with safe graceful fallback for development.

export async function notifyClinic({ patientName, patientPhone, date, time, treatment = "Consultation" }) {
  const message = `Khetan Dental Care: New booking for ${patientName} (${patientPhone}) on ${date} at ${time} for ${treatment}.`;
  
  if (!process.env.FAST2SMS_API_KEY) {
    console.log(`[SMS Notification Simulated]: To ${process.env.CLINIC_PHONE || "9101616156"} -> "${message}"`);
    return true; // Mark as handled in development/demo mode
  }

  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message,
        numbers: process.env.CLINIC_PHONE || "9101616156",
      }),
    });
    const data = await res.json();
    return data.return === true;
  } catch (e) {
    console.error("SMS dispatch encountered an error:", e.message);
    return false;
  }
}

// 5-Digit OTP Dispatch for Host / Doctor Login
export async function sendHostOtp({ phone = "9101616156", otp }) {
  const message = `Khetan Dental Care: Your host login 5-digit verification code is ${otp}. Valid for 5 minutes. Do not share.`;
  console.log(`[HOST 5-DIGIT OTP SENT]: To ${phone} -> OTP: ${otp}`);

  if (!process.env.FAST2SMS_API_KEY) {
    return { ok: true, simulated: true, otp };
  }

  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message,
        numbers: phone,
      }),
    });
    const data = await res.json();
    return { ok: data.return === true, otp };
  } catch (e) {
    console.error("Fast2SMS OTP dispatch failed:", e.message);
    return { ok: false, error: e.message, otp };
  }
}
