// SMS & Gateway Dispatch Service
// Supports Fast2SMS / SMS_API_KEY with secure backend logging when in development.

const getApiKey = () => process.env.SMS_API_KEY || process.env.FAST2SMS_API_KEY;
const getClinicPhone = () => process.env.CLINIC_PHONE || "9101616156";

/**
 * Dispatches a 5-digit verification OTP to a destination phone number.
 * Logs securely in server logs if SMS API key is not configured.
 */
export async function sendOtpSms({ phone, otp, role = "patient" }) {
  const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
  const purpose = role === "host" || role === "admin" ? "Host Login" : "Patient Portal Verification";
  const message = `Khetan Dental Care: Your ${purpose} code is ${otp}. Valid for 5 minutes. Please do not share this OTP with anyone.`;

  const apiKey = getApiKey();

  if (!apiKey) {
    // SECURE SERVER-ONLY LOG: Never exposed in client HTTP responses
    console.log(`[SECURE SMS SERVICE - LOCAL/TEST MODE]:`);
    console.log(`  Target: +91 ${cleanPhone}`);
    console.log(`  Role: ${role}`);
    console.log(`  OTP Code: ${otp}`);
    console.log(`  Timestamp: ${new Date().toISOString()}`);
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message,
        numbers: cleanPhone,
      }),
    });
    const data = await res.json();
    return { success: data.return === true };
  } catch (err) {
    console.error("[SMS Gateway Error]: Failed to dispatch SMS:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Dispatches Host / Doctor 2FA code to clinic number (9101616156)
 */
export async function sendHostOtp({ phone, otp }) {
  const target = phone || getClinicPhone();
  return sendOtpSms({ phone: target, otp, role: "host" });
}

/**
 * Notifies the clinic regarding a new patient booking
 */
export async function notifyClinic({ patientName, patientPhone, date, time, treatment = "Consultation" }) {
  const clinicNumber = getClinicPhone();
  const message = `Khetan Dental Care: New booking for ${patientName} (${patientPhone}) on ${date} at ${time} for ${treatment}.`;
  const apiKey = getApiKey();

  if (!apiKey) {
    console.log(`[CLINIC NOTIFICATION LOG]: To ${clinicNumber} -> "${message}"`);
    return true;
  }

  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message,
        numbers: clinicNumber,
      }),
    });
    const data = await res.json();
    return data.return === true;
  } catch (err) {
    console.error("[SMS Notification Error]:", err.message);
    return false;
  }
}
