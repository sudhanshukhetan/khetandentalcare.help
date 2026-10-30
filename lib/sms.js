// SMS & OTP Gateway Dispatch Service
// Supports Fast2SMS, Twilio, or secure backend simulation when in testing.

const getFast2SmsKey = () => process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY;
const getClinicPhone = () => process.env.CLINIC_PHONE || "9101616156";

/**
 * Dispatches a 5-digit verification OTP to a destination phone number.
 * Automatically selects Fast2SMS or Twilio depending on configured environment variables.
 */
export async function sendOtpSms({ phone, otp, role = "patient" }) {
  const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);
  const purpose = role === "host" || role === "admin" ? "Host 2FA Verification" : "Patient Portal Login";

  const fast2SmsKey = getFast2SmsKey();
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

  // 1. FAST2SMS GATEWAY (Dedicated DLT-compliant Indian OTP Route)
  if (fast2SmsKey) {
    try {
      const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2SmsKey.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: String(otp),
          numbers: cleanPhone,
        }),
      });

      const data = await res.json().catch(() => null);

      if (data && data.return === true) {
        console.log(`[Fast2SMS OTP Sent Successfully]: To +91 ${cleanPhone} (Request ID: ${data.request_id || "OK"})`);
        return { success: true, provider: "fast2sms" };
      }

      // Quick fallback route if 'otp' route has restrictions on the account
      const fallbackRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2SmsKey.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: `Khetan Dental Care: Your ${purpose} code is ${otp}. Valid for 5 minutes.`,
          numbers: cleanPhone,
        }),
      });
      const fallbackData = await fallbackRes.json().catch(() => null);
      return { success: fallbackData?.return === true, provider: "fast2sms" };
    } catch (err) {
      console.error("[Fast2SMS Delivery Error]:", err.message);
      return { success: false, error: err.message };
    }
  }

  // 2. TWILIO GATEWAY (Global SMS)
  if (twilioSid && twilioAuthToken && twilioFrom) {
    try {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString("base64");

      const bodyParams = new URLSearchParams();
      bodyParams.append("To", `+91${cleanPhone}`);
      bodyParams.append("From", twilioFrom);
      bodyParams.append("Body", `Khetan Dental Care: Your 5-digit verification code is ${otp}. Valid for 5 minutes.`);

      const res = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: bodyParams.toString(),
      });

      const twilioData = await res.json().catch(() => null);
      if (res.ok) {
        console.log(`[Twilio OTP Sent Successfully]: To +91 ${cleanPhone}`);
        return { success: true, provider: "twilio" };
      }
      console.error("[Twilio Error]:", twilioData?.message);
      return { success: false, error: twilioData?.message };
    } catch (err) {
      console.error("[Twilio Delivery Error]:", err.message);
      return { success: false, error: err.message };
    }
  }

  // 3. SECURE LOCAL/SERVER LOGGING (When no API key is yet configured)
  console.log(`\n======================================================`);
  console.log(`⚠️  [NO SMS GATEWAY API KEY DETECTED]`);
  console.log(`To receive real SMS on mobile phones, configure FAST2SMS_API_KEY in your environment.`);
  console.log(`------------------------------------------------------`);
  console.log(`  Recipient: +91 ${cleanPhone}`);
  console.log(`  Purpose:   ${purpose}`);
  console.log(`  >>> 5-DIGIT OTP CODE: ${otp} <<<`);
  console.log(`  Expiry:    5 Minutes`);
  console.log(`======================================================\n`);

  return { success: true, simulated: true };
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
  const fast2SmsKey = getFast2SmsKey();

  if (!fast2SmsKey) {
    console.log(`[CLINIC NOTIFICATION LOG]: To +91 ${clinicNumber} -> "${message}"`);
    return true;
  }

  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: fast2SmsKey.trim(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message,
        numbers: clinicNumber,
      }),
    });
    const d = await res.json().catch(() => null);
    return d?.return === true;
  } catch (err) {
    console.error("[Clinic Notification Error]:", err.message);
    return false;
  }
}
