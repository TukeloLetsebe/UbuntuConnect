import api from "../lib/api";

// --- Types ---

export interface NpoProfile {
  npoId: number;
  userId: number;
  nporegNum: string;
  organizationName: string;
  npofocusArea: string | null;
  npomission: string | null;
  isVerified?: boolean;
}

export interface PostItem {
  postId: number;
  userId: number;
  authorName?: string | null;
  authorNpoId?: number | null;
  postTitle: string;
  content: string | null;
  mediaUrl: string | null;
  likeCount: number;
  activityStatus: string;
  timestamp: string;
}

export interface CommentItem {
  commentId: number;
  postId: number;
  userId: number;
  authorName: string;
  content: string;
  timestamp: string;
}

export interface ProjectItem {
  projectId: number;
  npoId: number;
  npoName?: string;
  projectName: string;
  projectDesc: string | null;
  projectStatus: string;
  projectProgress: number;
  targetAmount: number;
  raisedAmount: number;
  images: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface VolunteerApplicationItem {
  applicationId: number;
  userId: number;
  opportunityId: number;
  roleTitle?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phoneNum?: string | null;
  skills?: string | null;
  availability?: string | null;
  whyVolunteer?: string | null;
  status: string;
  applicationDate: string;
  totalHoursLogged?: number;
}

export interface VolunteerOpportunityItem {
  opportunityId: number;
  npoId: number;
  roleTitle: string;
  category: string | null;
  numOfPositions: number;
  description: string | null;
  skillsRequired: string | null;
  timeCommitment: string | null;
  duration: string | null;
  mediaUrl: string | null;
}

export interface NpoDiscoverItem {
  location?: string | null;
  npoId: number;
  userId: number;
  nporegNum: string;
  organizationName: string;
  npofocusArea: string | null;
  npomission: string | null;
  isVerified?: boolean;
  profileImage?: string | null;
}

export interface VerificationItem {
  verificationId: number;
  npoId: number;
  npoCertificate: string | null;
  npoTaxCertificate: string | null;
  status: string;
  submittedDate: string;
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
  reason?: string | null;
}

export interface WalletBalance {
  walletId: number;
  userId: number;
  balance: number;
}

export interface FollowerItem {
  userId: number;
  email: string;
  name: string;
  userType: string;
  followDate: string;
}

export interface DonorItem {
  userId: number | null;
  name: string;
  userType: string;
  totalDonated: number;
  donationCount: number;
  lastDonation: string;
}

export interface FollowedNpoItem {
  npoId: number;
  organizationName: string;
  npofocusArea: string | null;
  npomission: string | null;
  followDate: string;
}

// --- Error Utility ---
// Hoisted to lib/apiError. Re-exported here so existing imports keep working.
export { getErrorMessage } from "../lib/apiError";

// --- API Functions ---

export const npoService = {
  // Profile
  getMyProfile: () => api.get<NpoProfile>("/api/npo/user/{userId}"),
  getProfileByUserId: (userId: number) => api.get<NpoProfile>(`/api/npo/user/${userId}`),
  updateProfile: (npoId: number, data: { OrganizationName?: string; NPOFocusArea?: string; NPOMission?: string; Bio?: string; ProfileImage?: string | null; BackgroundImage?: string | null }) =>
    api.put(`/api/npo/${npoId}`, data),
  /** Public profile (also used to seed the edit form with bio/images). */
  getPublicProfile: (npoId: number) => api.get<{
    npoId: number; organizationName: string; npofocusArea: string | null; npomission: string | null;
    bio: string | null; profileImage: string | null; backgroundImage: string | null;
  }>(`/api/npo/${npoId}/public`),

  // Posts (NPO manages their own)
  getMyPosts: (userId: number) => api.get<PostItem[]>(`/api/post/user/${userId}`),
  getAllPosts: () => api.get<PostItem[]>("/api/post"),
  getPostById: (postId: number) => api.get<PostItem>(`/api/post/${postId}`),
  createPost: (data: { postTitle: string; content?: string; mediaUrl?: string }) =>
    api.post<PostItem>("/api/post", { postTitle: data.postTitle, content: data.content, mediaUrl: data.mediaUrl }),
  updatePost: (postId: number, data: { postTitle: string; content?: string; mediaUrl?: string; activityStatus?: string }) =>
    api.put(`/api/post/${postId}`, { postTitle: data.postTitle, content: data.content, mediaUrl: data.mediaUrl, activityStatus: data.activityStatus }),
  deletePost: (postId: number) => api.delete(`/api/post/${postId}`),

  // Post likes
  likePost: (postId: number) => api.post(`/api/post/${postId}/like`),
  unlikePost: (postId: number) => api.delete(`/api/post/${postId}/unlike`),
  getMyLikes: () => api.get<number[]>("/api/post/my-likes"),

  // Comments
  getComments: (postId: number) => api.get<CommentItem[]>(`/api/comment/post/${postId}`),
  createComment: (postId: number, content: string) =>
    api.post<CommentItem>(`/api/comment/post/${postId}`, { content }),
  deleteComment: (commentId: number) => api.delete(`/api/comment/${commentId}`),

  // Projects
  getMyProjects: () => api.get<ProjectItem[]>("/api/project/my-projects"),
  getAllProjects: () => api.get<ProjectItem[]>("/api/project"),
  getProject: (id: number) => api.get<ProjectItem>(`/api/project/${id}`),
  createProject: (data: { projectName: string; projectDesc?: string; projectStatus?: string; projectProgress?: number; targetAmount?: number; images?: string; endDate?: string; durationDays?: number }) =>
    api.post<ProjectItem>("/api/project", data),
  updateProject: (id: number, data: { projectName?: string; projectDesc?: string; projectStatus?: string; projectProgress?: number; targetAmount?: number; images?: string; endDate?: string; durationDays?: number }) =>
    api.put<ProjectItem>(`/api/project/${id}`, data),
  deleteProject: (id: number) => api.delete(`/api/project/${id}`),

  // Volunteer Applications (NPO view across all their opportunities)
  getAllApplications: () => api.get<VolunteerApplicationItem[]>("/api/VolunteerApplication"),
  getApplicationsByOpportunity: (opportunityId: number) =>
    api.get<VolunteerApplicationItem[]>(`/api/VolunteerApplication/opportunity/${opportunityId}`),
  acceptApplication: (id: number) => api.put(`/api/VolunteerApplication/${id}/accept`),
  rejectApplication: (id: number) => api.put(`/api/VolunteerApplication/${id}/reject`),
  completeApplication: (id: number) => api.put(`/api/VolunteerApplication/${id}/complete`),
  getApplicantIdentity: (id: number) =>
    api.get<{ verified: boolean; idNumber: string | null; idDocumentUrl: string | null; selfieUrl: string | null }>(
      `/api/VolunteerApplication/${id}/identity`
    ),
  deleteApplication: (id: number) => api.delete(`/api/VolunteerApplication/${id}`),
  logHours: (id: number, hours: number, date?: string, notes?: string) =>
    api.post(`/api/VolunteerApplication/${id}/log-hours`, { hours, date, notes }),

  // Verification
  submitVerification: (data: { npoCertificate?: string; npoTaxCertificate?: string }) =>
    api.post("/api/verification/submit", data),
  getMyVerificationStatus: () => api.get<VerificationItem[]>("/api/verification/my-status"),

  // Wallet & Transactions
  getWalletBalance: (userId: number) => api.get<WalletBalance>(`/api/wallet/user/${userId}/balance`),
  getTransactions: (userId: number) => api.get<TransactionItem[]>(`/api/transaction/user/${userId}`),
  withdraw: (amount: number, reason: string) => api.post("/api/transaction/withdraw", { amount, reason }),
  // Top-up removed for NPOs — they receive funds via donations, not self top-up

  // Volunteer Opportunities (NPO creates these for individuals to apply to)
  getMyOpportunities: (npoId: number) => api.get<VolunteerOpportunityItem[]>(`/api/VolunteerOpportunity/npo/${npoId}`),
  createOpportunity: (data: { roleTitle: string; category?: string; numOfPositions?: number; description?: string; skillsRequired?: string; timeCommitment?: string; duration?: string; mediaURL?: string }) =>
    api.post<VolunteerOpportunityItem>("/api/VolunteerOpportunity", data),
  updateOpportunity: (id: number, data: { roleTitle?: string; category?: string; numOfPositions?: number; description?: string; skillsRequired?: string; timeCommitment?: string; duration?: string }) =>
    api.put(`/api/VolunteerOpportunity/${id}`, data),
  deleteOpportunity: (id: number) => api.delete(`/api/VolunteerOpportunity/${id}`),

  // Discover NPOs
  discoverNPOs: () => api.get<NpoDiscoverItem[]>("/api/npo"),
  getNpoDetail: (npoId: number) => api.get<NpoDiscoverItem>(`/api/npo/${npoId}`),

  // Follow/Unfollow NPOs
  followNpo: (npoId: number) => api.post(`/api/npo/follow/${npoId}`),
  unfollowNpo: (npoId: number) => api.delete(`/api/npo/unfollow/${npoId}`),
  getMyFollows: () => api.get<FollowedNpoItem[]>("/api/npo/my-follows"),

  // Followers & Donors (supporters view)
  getMyFollowers: () => api.get<FollowerItem[]>("/api/npo/my-followers"),
  getMyDonors: () => api.get<DonorItem[]>("/api/npo/my-donors"),

  // Donate to project (any user)
  donateToProject: (projectId: number, amount: number) =>
    api.post(`/api/npo/project/${projectId}/donate`, { amount }),

  // Browse & Apply to Business Campaigns
  browseCampaigns: () => api.get<{ campaignId: number; businessId: number; title: string; description: string | null; category: string | null; requirements: string | null; budgetPerPartner: number | null; startDate: string; endDate: string | null }[]>("/api/campaigns"),
  applyToCampaign: (campaignId: number, motivation?: string) =>
    api.post(`/api/campaignapplications/apply/${campaignId}`, { motivation }),
};
