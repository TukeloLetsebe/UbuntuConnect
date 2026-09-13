import { useState } from "react";
import { MailWarning, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";

/**
 * A subtle, dismissible reminder for authenticated users who have NOT verified
 * their email (Stage 1). It sits at the bottom of the screen (not a top banner)
 * so it never blocks the landing/marketing experience — it only appears once a
 * user is signed in and lets them resend the verification link.
 */
export default function EmailVerificationBanner() {
  const { isAuthenticated, isEmailVerified, email } = useAuth();
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!isAuthenticated || isEmailVerified || dismissed) return null;

  const handleResend = async () => {
    if (!email) return;
    setSending(true);
    try {
      await authService.resendVerification(email);
      toast.success("Verification email sent. Check your inbox (or the API console in dev).");
    } catch {
      toast.error("Could not resend the verification email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-auto">
      <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 shadow-lg px-4 py-3 flex items-start gap-3 text-sm">
        <MailWarning className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">Verify your email</p>
          <p className="text-amber-800/90">Confirm your address to unlock all features.</p>
          <button
            onClick={handleResend}
            disabled={sending}
            className="mt-1 underline hover:no-underline disabled:opacity-60"
          >
            {sending ? "Sending…" : "Resend verification email"}
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-amber-700 hover:text-amber-900 shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
