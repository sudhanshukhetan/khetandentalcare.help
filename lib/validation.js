// Strict client-side and server-side validation utilities

export function validatePhone(phone) {
  if (!phone) {
    return { isValid: false, error: "Mobile number is required." };
  }

  // Strip country code (+91), spaces, dashes, parentheses
  const cleanPhone = String(phone).replace(/\D/g, "").slice(-10);

  if (cleanPhone.length !== 10) {
    return { isValid: false, error: "Please enter a valid 10-digit mobile number." };
  }

  // Valid Indian mobile numbers start with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return { isValid: false, error: "Mobile number must start with 6, 7, 8, or 9." };
  }

  // Reject all identical digits (e.g., 9999999999, 8888888888)
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

  // Strict email RFC pattern
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, error: "Please enter a valid email address (e.g., name@domain.com)." };
  }

  // Disallow double dots or invalid domain tails
  if (cleanEmail.includes("..") || cleanEmail.endsWith(".")) {
    return { isValid: false, error: "Email formatting is invalid." };
  }

  return { isValid: true, cleanEmail };
}
