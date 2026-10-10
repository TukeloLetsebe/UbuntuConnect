import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import api, { resolveMediaUrl } from "../../lib/api";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Heart, Loader2, Send, Trash2, X } from "lucide-react";

/**
 * Normalized post shape the modal renders. Every dashboard already has these
 * fields (sometimes under slightly different names), so callers map into this.
 */
export interface PostDetailData {
  postId: number;
  postTitle: string;
  content: string | null;
  mediaUrl: string | null;
  authorName: string | null;
  /** The author's NPO id, if the author is an NPO — makes the name a link. */
  authorNpoId?: number | null;
  likeCount: number;
  timestamp: string;
}

interface CommentItem {
  commentId: number;
  postId: number;
  userId: number;
  authorName: string;
  content: string;
  timestamp: string;
}

interface Props {
  post: PostDetailData;
  /** Current user id — used to show delete on own comments. Null = read-only viewer. */
  currentUserId: number | null;
  /** Whether the current user has liked this post (controlled by the parent). */
  liked?: boolean;
  /** Whether like/comment actions are available (requires an authenticated user). */
  canInteract?: boolean;
  /** Whether the user may comment (requires a verified/email-confirmed account).
   *  Defaults to canInteract when not provided. */
  canComment?: boolean;
  onClose: () => void;
  /** Called after a successful like/unlike so the parent can sync its own state. */
  onLikeChange?: (postId: number, liked: boolean, newCount: number) => void;
}

/**
 * Shared full-post view: image + title + author + full caption + likes + comments.
 * Used by every dashboard and the public NPO profile so the experience is identical
 * everywhere (QA2-002 / 007 / 009 / 018). Comments and likes hit the shared,
 * role-agnostic endpoints (/api/comment/*, /api/post/{id}/like).
 */
export default function PostDetailModal({
  post,
  currentUserId,
  liked = false,
  canInteract = true,
  canComment,
  onClose,
  onLikeChange,
}: Props) {
  // Commenting may require a verified account; default to the interact flag.
  const commentingAllowed = canComment ?? canInteract;
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLiked, setIsLiked] = useState(liked);
  const [likeBusy, setLikeBusy] = useState(false);
  const navigate = useNavigate();

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const r = await api.get<CommentItem[]>(`/api/comment/post/${post.postId}`);
      setComments(r.data);
    } catch {
      // Non-blocking; the post still renders.
    } finally {
      setCommentsLoading(false);
    }
  }, [post.postId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleAddComment = async () => {
    const content = newComment.trim();
    if (!content) return;
    setSubmitting(true);
    try {
      const r = await api.post<CommentItem>(`/api/comment/post/${post.postId}`, { content });
      setComments((prev) => [r.data, ...prev]);
      setNewComment("");
    } catch {
      toast.error("Could not post your comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await api.delete(`/api/comment/${commentId}`);
      setComments((prev) => prev.filter((c) => c.commentId !== commentId));
    } catch {
      toast.error("Could not delete the comment.");
    }
  };

  const handleToggleLike = async () => {
    if (likeBusy) return;
    setLikeBusy(true);
    const next = !isLiked;
    // Optimistic update
    setIsLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      if (next) await api.post(`/api/post/${post.postId}/like`);
      else await api.delete(`/api/post/${post.postId}/unlike`);
      onLikeChange?.(post.postId, next, Math.max(0, post.likeCount + (next ? 1 : -1)));
    } catch (e: unknown) {
      const msg = e && typeof e === "object" && "response" in e
        ? ((e as { response?: { data?: unknown } }).response?.data as string) || ""
        : "";
      // "already liked" is harmless — keep the liked state.
      if (!String(msg).toLowerCase().includes("already liked")) {
        setIsLiked(!next);
        setLikeCount((c) => Math.max(0, c + (next ? -1 : 1)));
        toast.error("Could not update your like.");
      }
    } finally {
      setLikeBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-neutral-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold">Post</h2>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-5">
          {post.mediaUrl && (
            <img
              src={resolveMediaUrl(post.mediaUrl)}
              alt={post.postTitle}
              className="w-full max-h-80 object-cover object-center rounded-lg mb-4"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          )}

          {post.authorName && (
            post.authorNpoId ? (
              <button
                onClick={() => { onClose(); navigate(`/npo/${post.authorNpoId}`); }}
                className="text-sm text-orange-600 font-medium hover:underline"
              >
                {post.authorName}
              </button>
            ) : (
              <p className="text-sm text-orange-600 font-medium">{post.authorName}</p>
            )
          )}
          <h3 className="text-xl font-bold mb-1">{post.postTitle}</h3>
          <p className="text-xs text-neutral-400 mb-3">{new Date(post.timestamp).toLocaleString()}</p>
          {post.content && <p className="text-neutral-700 whitespace-pre-wrap mb-4">{post.content}</p>}

          <div className="flex items-center gap-6 text-sm border-y border-neutral-100 py-3 mb-4">
            <button
              onClick={canInteract ? handleToggleLike : undefined}
              disabled={!canInteract || likeBusy}
              className={`flex items-center gap-2 ${isLiked ? "text-red-500" : "text-neutral-600"} ${canInteract ? "hover:text-red-500" : "cursor-default"}`}
              title={canInteract ? "Like this post" : "Sign in to like"}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} /> {likeCount}
            </button>
          </div>

          <h4 className="font-semibold mb-3">Comments</h4>

          {commentingAllowed ? (
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddComment(); } }}
              />
              <Button onClick={handleAddComment} disabled={submitting} className="bg-orange-600 hover:bg-orange-700">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          ) : canInteract ? (
            <p className="text-sm text-neutral-500 bg-neutral-50 rounded-md p-3 mb-4">
              Please verify your email address before commenting.
            </p>
          ) : null}

          {commentsLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /></div>
          ) : comments.length === 0 ? (
            <p className="text-neutral-500 text-sm text-center py-6">No comments yet.{canInteract ? " Be the first!" : ""}</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.commentId} className="flex gap-3 p-3 bg-neutral-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">{c.authorName?.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">{c.authorName}</span>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-neutral-400">{new Date(c.timestamp).toLocaleDateString()}</span>
                        {currentUserId != null && c.userId === currentUserId && (
                          <button onClick={() => handleDeleteComment(c.commentId)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm mt-1">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
