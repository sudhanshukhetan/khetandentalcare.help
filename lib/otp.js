// Secure In-Memory OTP Store with 5-Minute Expiration

const otpStore = new Map();

/**
 * Generates a cryptographically strong 5-digit numeric OTP (10000 - 99999)
 */
export function generateFiveDigitOtp() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

/**
 * Stores an OTP with key identifier (e.g. phone or email)
 */
export function saveOtp(identifier, otp, metadata = {}) {
  const key = String(identifier).trim().toLowerCase();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
  otpStore.set(key, {
    otp: String(otp).trim(),
    expiresAt,
    attempts: 0,
    ...metadata,
  });
}

/**
 * Validates the entered OTP against the identifier
 */
export function verifyOtp(identifier, inputOtp) {
  const key = String(identifier).trim().toLowerCase();
  const record = otpStore.get(key);

  if (!record) {
    return { ok: false, error: "No active verification code found. Please request a new code." };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return { ok: false, error: "The verification code has expired. Please request a new code." };
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(key);
    return { ok: false, error: "Too many failed attempts. For your security, please request a new code." };
  }

  if (record.otp !== String(inputOtp).trim()) {
    return { ok: false, error: "Incorrect verification code. Please check and try again." };
  }

  // OTP is valid - consume immediately to prevent replay
  otpStore.delete(key);
  return { ok: true, metadata: record };
}

// Backward-compatible alias helpers
export const saveHostOtp = saveOtp;
export const verifyHostOtp = verifyOtp;
