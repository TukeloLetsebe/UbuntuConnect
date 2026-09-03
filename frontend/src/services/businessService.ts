import api from "../lib/api";

// --- Types ---

export interface BusinessProfile {
  businessId: number;
  userId: number;
  businessRegNum: string;
  industry: string | null;
  contactPersonName: string | null;
  contactPersonTitle: string | null;
  businessEmail: string | null;
  csrGoal: string | null;
  email: string;
  contact: string | null;
  location: string | null;
}

export interface NPOSummary {
  npoId: number;
  organizationName: string;
  focusArea: string | null;
  mission: string | null;
  location: string | null;
  isVerified: boolean;
}

export interface FollowedNPO {
  npoId: number;
  organizationName: string;
  focusArea: string | null;
  mission: string | null;
  followDate: string;
}

export interface Campaign {
  campaignId: number;
  title: string;
  description: string | null;
  category: string | null;
  requirements: string | null;
  budgetPerPartner: number | null;
  startDate: string;
  endDate: string | null;
  applicantCount?: number;
}

export interface CampaignApplication {
  applicationId: number;
  npoId: number;
  motivation: string | null;
  status: string;
  applicationDate: string;
}

export interface DonationsResponse {
  totalDonated: number;
  count: number;
  donations: Array<{
    transactionId: number;
    amount: number;
    status: string;
    timestamp: string;
    receiverUserId: number;
  }>;
}

export interface BusinessImpact {
  totalDonated: number;
  nposSupported: number;
  nposFollowing: number;
  activeCampaigns: number;
}

export interface CommunityPost {
  postId: number;
  authorName: string;
  postTitle: string;
  content: string | null;
  mediaUrl: string | null;
  likeCount: number;
  timestamp: string;
}

export interface WalletBalance {
  walletId: number;
  userId: number;
  balance: number;
}

export interface Fundraiser {
  projectId: number;
  npoId: number;
  npoName: string;
  projectName: string;
  projectDesc: string | null;
  projectStatus: string;
  projectProgress: number;
  targetAmount: number;
  raisedAmount: number;
  images: string | null;
}

export interface CommentItem {
  commentId: number;
  postId: number;
  userId: number;
  authorName: string;
  content: string;
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

export const businessService = {
  // Profile
  getProfile: () => api.get<BusinessProfile>("/api/business/me"),

  // Discover & Follow NPOs
  discoverNPOs: () => api.get<NPOSummary[]>("/api/business/discover-npos"),
  followNPO: (npoId: number) => api.post(`/api/business/follow/${npoId}`),
  unfollowNPO: (npoId: number) => api.delete(`/api/business/unfollow/${npoId}`),
  getMyFollows: () => api.get<FollowedNPO[]>("/api/business/my-follows"),

  // Donations
  donate: (npoId: number, amount: number) =>
    api.post(`/api/business/donate/${npoId}`, { amount }),
  getMyDonations: () => api.get<DonationsResponse>("/api/business/my-donations"),

  // Wallet
  getWalletBalance: (userId: number) =>
    api.get<WalletBalance>(`/api/wallet/user/${userId}/balance`),
  topUp: (amount: number) => api.post("/api/business/topup", { amount }),

  // Campaigns
  getMyCampaigns: () => api.get<Campaign[]>("/api/business/my-campaigns"),
  getCampaign: (id: number) => api.get<Campaign>(`/api/campaigns/${id}`),
  createCampaign: (data: {
    title: string;
    description?: string;
    category?: string;
    requirements?: string;
    budgetPerPartner?: number;
    startDate: string;
    endDate?: string;
  }) => api.post("/api/campaigns", data),
  updateCampaign: (id: number, data: {
    title?: string;
    description?: string;
    category?: string;
    requirements?: string;
    budgetPerPartner?: number;
  }) => api.put(`/api/campaigns/${id}`, data),
  deleteCampaign: (id: number) => api.delete(`/api/campaigns/${id}`),

  // Campaign Applications (Business reviews NPO applications)
  getCampaignApplications: (campaignId: number) =>
    api.get<CampaignApplication[]>(`/api/campaignapplications/campaign/${campaignId}`),
  approveApplication: (id: number) => api.put(`/api/campaignapplications/${id}/approve`),
  rejectApplication: (id: number) => api.put(`/api/campaignapplications/${id}/reject`),

  // Impact
  getMyImpact: () => api.get<BusinessImpact>("/api/business/my-impact"),

  // Community
  getCommunityUpdates: () => api.get<CommunityPost[]>("/api/business/community-updates"),

  // Post likes (shared)
  likePost: (postId: number) => api.post(`/api/post/${postId}/like`),
  unlikePost: (postId: number) => api.delete(`/api/post/${postId}/unlike`),
  getMyLikes: () => api.get<number[]>("/api/post/my-likes"),

  // Comments
  getComments: (postId: number) => api.get<CommentItem[]>(`/api/comment/post/${postId}`),
  createComment: (postId: number, content: string) =>
    api.post<CommentItem>(`/api/comment/post/${postId}`, { content }),
  deleteComment: (commentId: number) => api.delete(`/api/comment/${commentId}`),

  // Reports (C700)
  generateReport: (start?: string, end?: string) =>
    api.get("/api/reports/my-donations/csv", {
      params: { start: start || "2020-01-01", end: end || undefined },
      responseType: "blob" as const,
    }),

  // Fundraisers (NPO Projects)
  getFundraisers: () => api.get<Fundraiser[]>("/api/project"),
  donateToFundraiser: (projectId: number, amount: number) =>
    api.post(`/api/npo/project/${projectId}/donate`, { amount }),
};
