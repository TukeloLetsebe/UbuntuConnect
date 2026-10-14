import api from "../lib/api";

export interface ReportedPostItem {
  reportId: number;
  postId: number;
  reporterUserId: number;
  reporterName: string | null;
  reason: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  post: {
    postId: number;
    postTitle: string;
    content: string | null;
    mediaUrl: string | null;
    activityStatus: string;
    authorUserId: number;
    authorName: string | null;
  };
}

export const moderationService = {
  /** Any authenticated user reports a post with a reason. */
  reportPost: (postId: number, reason: string) =>
    api.post(`/api/postreport/post/${postId}`, { reason }),

  // ── Admin moderation queue ──
  getReports: (status = "Pending") =>
    api.get<ReportedPostItem[]>("/api/postreport", { params: { status } }),
  dismiss: (reportId: number) => api.put(`/api/postreport/${reportId}/dismiss`),
  removePost: (reportId: number) => api.put(`/api/postreport/${reportId}/remove-post`),
};
