import api from "../lib/api";

export interface PublicNpoPost {
  postId: number;
  postTitle: string;
  content: string | null;
  mediaUrl: string | null;
  likeCount: number;
  timestamp: string;
}

export interface PublicNpoFundraiser {
  projectId: number;
  projectName: string;
  projectDesc: string | null;
  projectProgress: number;
  targetAmount: number;
  raisedAmount: number;
  images: string | null;
  endDate: string | null;
}

export interface PublicNpoOpportunity {
  opportunityId: number;
  roleTitle: string;
  category: string | null;
  numOfPositions: number;
  description: string | null;
}

export interface PublicNpoProfile {
  npoId: number;
  userId: number;
  organizationName: string;
  npofocusArea: string | null;
  npomission: string | null;
  nporegNum: string;
  isVerified: boolean;
  bio: string | null;
  profileImage: string | null;
  backgroundImage: string | null;
  location: string | null;
  followerCount: number;
  contactVisible: boolean;
  email: string | null;
  phone: string | null;
  posts: PublicNpoPost[];
  fundraisers: PublicNpoFundraiser[];
  opportunities: PublicNpoOpportunity[];
}

export const npoProfileService = {
  /** Facebook-style public NPO profile. Contact details are gated server-side. */
  getPublicProfile: (npoId: number) =>
    api.get<PublicNpoProfile>(`/api/npo/${npoId}/public`),

  /** Browse all NPOs (public). */
  listNpos: () =>
    api.get<{
      npoId: number;
      userId: number;
      nporegNum: string;
      organizationName: string;
      npofocusArea: string | null;
      npomission: string | null;
    }[]>("/api/npo"),
};
