import api from "../lib/api";

// --- Types ---

export interface PlatformStats {
  totalUsers: number;
  individuals: number;
  npos: number;
  businesses: number;
  totalDonations: number;
  totalTransactions: number;
  activeCampaigns: number;
  pendingVerifications: number;
  activeUsers: number;
  inactiveUsers: number;
}

export interface UserItem {
  userId: number;
  email: string;
  userType: string;
  isActive: boolean;
  isVerified: boolean;
}

export interface UserDetail {
  userId: number;
  email: string;
  contact: string | null;
  location: string | null;
  userType: string;
  isActive: boolean;
  isVerified: boolean;
}

export interface VerificationItem {
  verificationId: number;
  // Which kind of applicant: "NPO" or "Business".
  subjectType: "NPO" | "Business";
  npoId: number | null;
  businessId: number | null;
  status: string;
  submittedDate: string;
  reviewedByUserId: number | null;
  reviewedDate: string | null;
  organizationName: string;
  regNum: string;
  focusArea: string | null;
  mission: string | null;
  email: string;
  contact: string | null;
  location: string | null;
  isVerified: boolean;
  // Documents (NPO: certificate + tax; Business: CIPC + tax clearance).
  document1: string | null;
  document2: string | null;
  // Back-compat aliases still returned by the API.
  npoCertificate: string | null;
  npoTaxCertificate: string | null;
}

export interface TransactionItem {
  transactionId: number;
  senderUserId: number | null;
  receiverUserId: number | null;
  senderName: string | null;
  receiverName: string | null;
  amount: number;
  transactionType: string;
  status: string;
  timestamp: string;
}

// --- Error Utility ---
// Hoisted to lib/apiError. Re-exported here so existing imports keep working.
export { getErrorMessage } from "../lib/apiError";

// --- API Functions ---

export const adminService = {
  // Platform stats
  getStats: () => api.get<PlatformStats>("/api/admin/stats"),

  // User management
  getUsers: () => api.get<UserItem[]>("/api/admin/users"),
  getUser: (id: number) => api.get<UserDetail>(`/api/admin/users/${id}`),
  activateUser: (id: number) => api.put(`/api/admin/users/${id}/activate`),
  deactivateUser: (id: number) => api.put(`/api/admin/users/${id}/deactivate`),

  // Verification management
  getVerifications: (status?: string) =>
    api.get<VerificationItem[]>("/api/admin/verifications", { params: status ? { status } : undefined }),
  approveVerification: (id: number) => api.put(`/api/admin/verifications/${id}/approve`),
  rejectVerification: (id: number) => api.put(`/api/admin/verifications/${id}/reject`),

  // Transactions
  getTransactions: (userId?: number) =>
    api.get<TransactionItem[]>("/api/admin/transactions", { params: userId ? { userId } : undefined }),

  // Individual KYC review
  getKycSubmissions: (status = "Pending") =>
    api.get<KycSubmissionItem[]>("/api/admin/kyc", { params: { status } }),
  approveKyc: (individualId: number) => api.put(`/api/admin/kyc/${individualId}/approve`),
  rejectKyc: (individualId: number, reason?: string) =>
    api.put(`/api/admin/kyc/${individualId}/reject`, { reason }),
};

export interface KycSubmissionItem {
  individualId: number;
  userId: number;
  fullName: string;
  email: string;
  idNumber: string | null;
  idDocumentUrl: string | null;
  selfieUrl: string | null;
  kycStatus: string;
  kycRoute: string | null;
  kycMatchScore: number | null;
  submittedDate: string | null;
  reviewedDate: string | null;
}
