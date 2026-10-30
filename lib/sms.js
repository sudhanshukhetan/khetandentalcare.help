// SMS & Gateway Dispatch Service
// Supports Fast2SMS / SMS_API_KEY with secure backend logging when in development.

const getApiKey = () => process.env.SMS_API_KEY || process.env.FAST2SMS_API_KEY;
const getClinicPhone = () => process.env.CLINIC_PHONE || "9101616156";

/**
 * Dispatches a 5-digit verification OTP to a destination phone number.
 * Uses Fast2SMS dedicated "otp" route (official TRAI/DLT pre-approved route in India).
 */
export async function sendOtpSms({ phone, otp, role = "patient" }) {
  const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
  const purpose = role === "host" || role === "admin" ? "Host Login" : "Patient Portal Verification";
  const apiKey = getApiKey();

  // If no SMS API key is provided, log securely to backend server console
  if (!apiKey) {
    console.log(`\n======================================================`);
    console.log(`⚠️ [NO SMS API KEY CONFIGURED]`);
    console.log(`To send real cellular SMS to mobile phones, add FAST2SMS_API_KEY or SMS_API_KEY to your environment variables.`);
    console.log(`------------------------------------------------------`);
    console.log(`  Target Mobile: +91 ${cleanPhone}`);
    console.log(`  Verification Type: ${purpose}`);
    console.log(`  >>> 5-DIGIT OTP CODE: ${otp} <<<`);
    console.log(`  Valid for: 5 minutes`);
    console.log(`======================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    // Fast2SMS dedicated OTP route (DLT approved in India)
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "otp",
        variables_values: String(otp),
        numbers: cleanPhone,
      }),
    });

    const data = await res.json();

    // Fallback to quick route if OTP route returns false
    if (!data.return) {
      const fallbackRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: `Khetan Dental Care: Your ${purpose} code is ${otp}. Valid for 5 minutes.`,
          numbers: cleanPhone,
        }),
      });
      const fallbackData = await fallbackRes.json();
      return { success: fallbackData.return === true };
    }

    return { success: data.return === true };
  } catch (err) {
    console.error("[SMS Gateway Delivery Error]:", err.message);
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
