// Frontend mirror of the backend validation rules (Validation/ValidationPatterns.cs).
// Kept intentionally in sync so inline form feedback matches server-side results.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// SA phone: +27 + 9 digits (first 1-9), or 0 + 9 digits.
const PHONE_RE = /^(\+27[1-9]\d{8}|0[1-9]\d{8})$/;
// CIPC: YYYY/NNNNNN/NN
const CIPC_RE = /^(19|20)\d{2}\/\d{6}\/\d{2}$/;
// NPO: NNN-NNN with optional NPO label at either end.
const NPO_RE = /^(NPO[\s-]?)?\d{3}-\d{3}([\s-]?NPO)?$/i;

export function isValidEmail(value: string | null | undefined): boolean {
  return !!value && EMAIL_RE.test(value.trim());
}

/** At least 8 chars, containing a letter and a digit. */
export function isStrongPassword(value: string | null | undefined): boolean {
  if (!value || value.length < 8) return false;
  return /[A-Za-z]/.test(value) && /\d/.test(value);
}

export function normalizePhone(value: string): string {
  return value.trim().replace(/[\s\-()]/g, "");
}

export function isValidPhone(value: string | null | undefined): boolean {
  if (!value) return false;
  return PHONE_RE.test(normalizePhone(value));
}

export function isValidCipcNumber(value: string | null | undefined): boolean {
  return !!value && CIPC_RE.test(value.trim());
}

export function isValidNpoRegNum(value: string | null | undefined): boolean {
  return !!value && NPO_RE.test(value.trim());
}

// Human-readable messages, aligned with the backend attribute messages.
export const validationMessages = {
  email: "Enter a valid email address.",
  password: "Password must be at least 8 characters and include a letter and a number.",
  phone: "Enter a valid South African phone number, e.g. +27821234567 or 0821234567.",
  cipc: "Enter a valid company registration number in the format YYYY/NNNNNN/NN, e.g. 2026/123456/07.",
  npoRegNum: "Enter a valid NPO registration number, e.g. 123-456 or 123-456-NPO.",
} as const;
