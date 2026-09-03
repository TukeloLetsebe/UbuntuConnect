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
  npoId: number;
  status: string;
  submittedDate: string;
  reviewedByUserId: number | null;
  reviewedDate: string | null;
}

export interface TransactionItem {
  transactionId: number;
  senderUserId: number | null;
  receiverUserId: number | null;
  amount: number;
  transactionType: string;
  status: string;
  timestamp: string;
}

// --- Error Utility ---

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const axiosError = error as {
      response?: { data?: { message?: string } | string; status?: number };
    };
    if (axiosError.response?.data) {
      if (typeof axiosError.response.data === "string") return axiosError.response.data;
      if (axiosError.response.data.message) return axiosError.response.data.message;
    }
    if (axiosError.response?.status === 404) return "Resource not found.";
    if (axiosError.response?.status === 403) return "You don't have permission for this action.";
    if (axiosError.response?.status === 400) return "Invalid request. Please check your input.";
    if (!axiosError.response) return "Unable to connect to server. Please check your connection.";
    return "Something went wrong. Please try again.";
  }
  return "An unexpected error occurred.";
}

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
};
