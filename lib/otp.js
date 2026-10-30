// Host Login 5-Digit OTP Manager
// Stores pending OTP challenges in memory with 5-minute expiration

const otpStore = new Map();

export function generateFiveDigitOtp() {
  // Generates random 5-digit number (10000 - 99999)
  return String(Math.floor(10000 + Math.random() * 90000));
}

export function saveHostOtp(email, otp, phone = "9101616156") {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(email.toLowerCase(), {
    otp: String(otp).trim(),
    phone,
    expiresAt,
    attempts: 0,
  });
}

export function verifyHostOtp(email, inputOtp) {
  const record = otpStore.get(email.toLowerCase());
  if (!record) {
    return { ok: false, error: "No pending verification code found. Please log in again." };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return { ok: false, error: "Verification code has expired. Please request a new one." };
  }

  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(email.toLowerCase());
    return { ok: false, error: "Too many failed attempts. Please log in again." };
  }

  if (record.otp !== String(inputOtp).trim()) {
    return { ok: false, error: "Incorrect 5-digit verification code. Please check and re-enter." };
  }

  // Verification successful: consume OTP
  otpStore.delete(email.toLowerCase());
  return { ok: true };
}
