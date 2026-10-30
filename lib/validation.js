// Strict client-side and server-side validation utilities

export function validatePhone(phone) {
  if (!phone) {
    return { isValid: false, error: "Mobile number is required." };
  }

  // Strip country code (+91 / 0), spaces, dashes, parentheses
  const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);

  if (cleanPhone.length !== 10) {
    return { isValid: false, error: "Please enter a valid 10-digit mobile number." };
  }

  // Valid Indian mobile numbers start with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return { isValid: false, error: "Mobile number must start with 6, 7, 8, or 9." };
  }

  // Reject all identical digits (e.g., 9999999999, 8888888888, 0000000000)
  if (/^(\d)\1{9}$/.test(cleanPhone)) {
    return { isValid: false, error: "Repeated dummy number sequence is not permitted." };
  }

  // Reject trivial sequential dummy sequences
  const sequentialDummies = ["1234567890", "0123456789", "9876543210", "8901234567"];
  if (sequentialDummies.includes(cleanPhone)) {
    return { isValid: false, error: "Please enter your genuine personal mobile number." };
  }

  return { isValid: true, cleanPhone };
}

export function validateEmail(email) {
  if (!email) {
    return { isValid: false, error: "Email address is required." };
  }

  const cleanEmail = String(email).trim().toLowerCase();

  if (cleanEmail.length < 5 || cleanEmail.length > 254) {
    return { isValid: false, error: "Email must be between 5 and 254 characters." };
  }

  // Strict email standard pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, error: "Please enter a valid email address (e.g. name@domain.com)." };
  }

  // Disallow double dots or invalid domain tails
  if (cleanEmail.includes("..") || cleanEmail.endsWith(".")) {
    return { isValid: false, error: "Email formatting is invalid." };
  }

  return { isValid: true, cleanEmail };
}

// Accepts either a valid email address OR a valid 10-digit Indian mobile number
export function validateIdentifier(input) {
  if (!input || !String(input).trim()) {
    return { isValid: false, error: "Please enter your registered email or 10-digit mobile number." };
  }

  const str = String(input).trim();
  if (str.includes("@")) {
    return validateEmail(str);
  }

  // If not containing @, treat as mobile number (support +91, 0, spaces, hyphens)
  const phoneRes = validatePhone(str);
  if (!phoneRes.isValid) {
    return { isValid: false, error: "Enter a valid email address or 10-digit Indian mobile number (starts with 6-9)." };
  }
  return { isValid: true, cleanIdentifier: phoneRes.cleanPhone, type: "phone" };
}
