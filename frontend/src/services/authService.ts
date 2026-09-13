import api from "../lib/api";

export const authService = {
  /** Confirm an email address using the token from the verification link. */
  verifyEmail: (token: string) =>
    api.post<{ message: string; isEmailVerified: boolean }>("/api/Auth/verify-email", { token }),

  /** Request a fresh verification email for an unverified account. */
  resendVerification: (userEmail: string) =>
    api.post<{ message: string }>("/api/Auth/resend-verification", { userEmail }),
};
