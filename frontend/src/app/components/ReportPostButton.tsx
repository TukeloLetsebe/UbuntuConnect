import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { moderationService } from "../../services/moderationService";

interface Props {
  postId: number;
  /** Render as an icon-only button (for compact card footers) or a labelled one. */
  compact?: boolean;
}

/**
 * Lets a user report a post for violating community rules. Opens a dialog to
 * capture a reason, then submits to the moderation API.
 */
export default function ReportPostButton({ postId, compact }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason.trim()) {
      toast.error("Please describe why you're reporting this post.");
      return;
    }
    setSubmitting(true);
    try {
      await moderationService.reportPost(postId, reason.trim());
      toast.success("Thank you. This post has been reported for review.");
      setOpen(false);
      setReason("");
    } catch (err) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      toast.error(typeof data === "string" ? data : "Could not submit the report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="flex items-center gap-1 text-neutral-500 hover:text-red-600 transition-colors"
        aria-label="Report post"
      >
        <Flag className="w-4 h-4" />
        {!compact && <span>Report</span>}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this post</DialogTitle>
            <DialogDescription>
              Tell us why this post violates community guidelines. An administrator will review it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="report-reason">Reason</Label>
            <Textarea
              id="report-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., spam, hate speech, misinformation, inappropriate content…"
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={submitting} className="bg-red-600 hover:bg-red-700">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit report"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
