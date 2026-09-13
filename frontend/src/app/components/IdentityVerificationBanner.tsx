import { Link } from "react-router";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/**
 * Shown to Individuals who have verified their email (Stage 1) but not yet
 * completed identity verification (Stage 2). They can browse, but donating,
 * topping up and volunteering are locked until an admin approves their KYC.
 * Hidden once identity-verified, and not shown to NPO/Business/Admin.
 */
export default function IdentityVerificationBanner() {
  const { isAuthenticated, isEmailVerified, isVerified, userType } = useAuth();

  // Only relevant to individuals who are past stage 1 but not stage 2.
  if (!isAuthenticated || userType !== "Individual") return null;
  if (!isEmailVerified || isVerified) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 text-blue-900">
      <div className="container mx-auto max-w-7xl px-6 py-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <span>
          Verify your identity to unlock donations, wallet top-ups and volunteering.
        </span>
        <Link to="/verify-identity" className="underline hover:no-underline font-medium">
          Verify identity
        </Link>
      </div>
    </div>
  );
}
