import { useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { uploadService } from "../../services/uploadService";
import { resolveMediaUrl } from "../../lib/api";

interface Props {
  label?: string;
  value: string | null; // uploaded selfie URL
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

/**
 * Captures a selfie from the webcam, uploads it, and returns the stored URL.
 * Used by the self-service face-scan verification route. Falls back with a
 * clear message if the browser blocks camera access.
 */
export default function WebcamCapture({ label = "Selfie", value, onChange, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  };

  // Ensure the camera is released when the component unmounts.
  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
    } catch {
      toast.error("Could not access the camera. Please allow camera permission or use admin review.");
    } finally {
      setStarting(false);
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) { toast.error("Could not capture the photo. Please try again."); return; }

    stopCamera();
    setUploading(true);
    try {
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      const res = await uploadService.uploadImage(file);
      onChange(res.data.url);
    } catch {
      toast.error("Selfie upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label>{label}</Label>

      {value ? (
        <div className="mt-2 relative inline-block">
          <img src={resolveMediaUrl(value)} alt="Captured selfie" className="max-h-48 rounded-md border border-neutral-200 object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            aria-label="Retake selfie"
            className="absolute -top-2 -right-2 bg-white border border-neutral-300 rounded-full p-1 shadow-sm hover:bg-neutral-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : active ? (
        <div className="mt-2 space-y-2">
          <video ref={videoRef} className="w-full max-w-sm rounded-md border border-neutral-200 bg-black" playsInline muted />
          <div className="flex gap-2">
            <Button type="button" onClick={capture} disabled={uploading} className="bg-orange-600 hover:bg-orange-700">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Camera className="w-4 h-4 mr-1" /> Capture</>}
            </Button>
            <Button type="button" variant="outline" onClick={stopCamera} disabled={uploading}>Cancel</Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={startCamera}
          disabled={disabled || starting || uploading}
          className="mt-2 flex items-center gap-2 px-4 py-2 border-2 border-dashed border-neutral-300 rounded-md text-neutral-600 hover:border-orange-400 hover:text-orange-600 transition-colors disabled:opacity-60"
        >
          {starting || uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {uploading ? "Uploading…" : starting ? "Starting camera…" : "Open camera to take a selfie"}
        </button>
      )}
    </div>
  );
}
