// Shared helpers for the two-stage verification gate on the frontend.
// Stage 1 = email verified; Stage 2 = admin identity/KYC verified (isVerified).
// A user may only transact (donate, top up, volunteer apply) when BOTH hold.

export interface VerificationState {
  isEmailVerified: boolean;
  isVerified: boolean;
}

export function isFullyVerified(s: VerificationState): boolean {
  return s.isEmailVerified && s.isVerified;
}

/** Human-readable reason a user cannot yet transact, or null if they can. */
export function transactionBlockReason(s: VerificationState): string | null {
  if (!s.isEmailVerified) return "Please verify your email address before donating, topping up, or volunteering.";
  if (!s.isVerified) return "Your identity must be verified before you can donate, top up, or volunteer.";
  return null;
}
