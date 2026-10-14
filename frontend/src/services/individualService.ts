import api from "../lib/api";

// --- Types (matching backend DTOs from API Contract) ---

export interface NPOSummary {
  npoId: number;
  organizationName: string;
  focusArea: string | null;
  mission: string | null;
  location: string | null;
  isVerified: boolean;
  profileImage: string | null;
}

export interface NPODetail extends NPOSummary {
  followerCount: number;
}

export interface FollowedNPO extends NPOSummary {
  followDate: string;
}

export interface IndividualProfile {
  userId: number;
  firstName: string;
  lastName: string;
  causeOfCare: string | null;
  email: string;
  contact: string | null;
  location: string | null;
}

export interface UpdateProfileDto {
  firstName?: string | null;
  lastName?: string | null;
  causeOfCare?: string | null;
  userContact?: string | null;
  location?: string | null;
}

export interface VolunteerOpportunity {
  opportunityId: number;
  npoId: number;
  npoName: string | null;
  roleTitle: string;
  category: string | null;
  numOfPositions: number;
  description: string | null;
  skillsRequired: string | null;
  timeCommitment: string | null;
  duration: string | null;
  mediaUrl: string | null;
}

export interface VolunteerApplicationDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNum?: string | null;
  skills?: string | null;
  availability?: string | null;
  whyVolunteer?: string | null;
  address?: string | null;
  idnumber?: string | null;
}

export interface MyVolunteeringItem {
  applicationId: number;
  roleTitle: string;
  npoName: string;
  status: string;
  applicationDate: string;
  totalHoursLogged: number;
}

export interface MyDonationsResponse {
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

export interface TransactionItem {
  transactionId: number;
  type: string;
  direction: "in" | "out";
  amount: number;
  status: string;
  timestamp: string;
  counterpartyName: string;
}

export interface MyTransactionsResponse {
  summary: {
    totalToppedUp: number;
    totalDonated: number;
    totalWithdrawn: number;
    totalReceived: number;
    count: number;
  };
  transactions: TransactionItem[];
}

export interface MyImpact {
  totalDonated: number;
  totalHoursVolunteered: number;
  npoFollowing: number;
  volunteerRolesCompleted: number;
}

export interface WalletBalance {
  walletId: number;
  userId: number;
  balance: number;
}

export interface CommunityPost {
  postId: number;
  authorName: string;
  authorNpoId: number | null;
  postTitle: string;
  content: string | null;
  mediaUrl: string | null;
  likeCount: number;
  timestamp: string;
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
// Hoisted to lib/apiError. Re-exported here so existing imports keep working.
export { getErrorMessage } from "../lib/apiError";

// --- API Functions ---

export const individualService = {
  // Profile
  getProfile: () => api.get<IndividualProfile>("/api/individual/me"),
  updateProfile: (dto: UpdateProfileDto) => api.put("/api/individual/me", dto),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put("/api/individual/change-password", { currentPassword, newPassword }),
  deactivateAccount: (password: string) =>
    api.put("/api/individual/deactivate", { password }),

  // Discover & Follow
  discoverNPOs: () => api.get<NPOSummary[]>("/api/individual/discover-NPOs"),
  getNPODetail: (npoId: number) => api.get<NPODetail>(`/api/individual/npo/${npoId}`),
  followNPO: (npoId: number) => api.post(`/api/individual/follow/${npoId}`),
  unfollowNPO: (npoId: number) => api.delete(`/api/individual/unfollow/${npoId}`),
  getMyFollows: () => api.get<FollowedNPO[]>("/api/individual/my-follows"),

  // Volunteering
  getOpportunities: () => api.get<VolunteerOpportunity[]>("/api/VolunteerOpportunity"),
  applyVolunteer: (opportunityId: number, dto: VolunteerApplicationDto) =>
    api.post(`/api/individual/volunteer/apply/${opportunityId}`, dto),
  getApplication: (applicationId: number) =>
    api.get(`/api/individual/volunteer/application/${applicationId}`),
  cancelApplication: (applicationId: number) =>
    api.delete(`/api/individual/volunteer/application/${applicationId}`),
  getMyVolunteering: () => api.get<MyVolunteeringItem[]>("/api/individual/my-volunteering"),

  // Wallet & Donations
  getWalletBalance: (userId: number) =>
    api.get<WalletBalance>(`/api/wallet/user/${userId}/balance`),
  topUp: (amount: number, card?: { cardNumber?: string; cardExpiry?: string; cardCvv?: string }) =>
    api.post("/api/individual/topup", { amount, ...card }),
  donate: (npoId: number, amount: number) =>
    api.post(`/api/individual/donate/${npoId}`, { amount }),
  getMyDonations: () => api.get<MyDonationsResponse>("/api/individual/my-donations"),
  getTransactions: () => api.get<MyTransactionsResponse>("/api/individual/transactions"),

  // Impact & Feed
  getMyImpact: () => api.get<MyImpact>("/api/individual/my-impact"),
  getCommunityUpdates: () => api.get<CommunityPost[]>("/api/individual/community-updates"),

  // Posts (Likes)
  likePost: (postId: number) => api.post(`/api/post/${postId}/like`),
  unlikePost: (postId: number) => api.delete(`/api/post/${postId}/unlike`),
  getMyLikes: () => api.get<number[]>("/api/post/my-likes"),

  // Comments
  getComments: (postId: number) => api.get<CommentItem[]>(`/api/comment/post/${postId}`),
  createComment: (postId: number, content: string) =>
    api.post<CommentItem>(`/api/comment/post/${postId}`, { content }),
  deleteComment: (commentId: number) => api.delete(`/api/comment/${commentId}`),

  // Fundraisers (NPO Projects)
  getFundraisers: () => api.get<Fundraiser[]>("/api/project"),
  donateToFundraiser: (projectId: number, amount: number) =>
    api.post(`/api/npo/project/${projectId}/donate`, { amount }),
};
