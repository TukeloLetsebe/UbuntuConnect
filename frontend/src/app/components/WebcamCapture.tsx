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
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  };

  // Ensure the camera is released when the component unmounts.
  useEffect(() => () => stopCamera(), []);

  // Bind the stream to the <video> only AFTER it has mounted (active === true).
  // Setting srcObject inside startCamera doesn't work: the <video> is rendered
  // conditionally on `active`, so videoRef.current is still null at that point —
  // which produced a black screen. This effect runs once the element exists.
  useEffect(() => {
    const video = videoRef.current;
    if (active && video && streamRef.current) {
      video.srcObject = streamRef.current;
      video.play().catch(() => {
        // Autoplay can reject until a user gesture; the Capture button also
        // forces playback, so this is non-fatal.
      });
    }
  }, [active]);

  const startCamera = async () => {
    setStarting(true);
    try {
      // Camera access requires a secure context (HTTPS or localhost) and a
      // supported API. Fail with a specific message rather than silently.
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        toast.error("Camera needs a secure connection (HTTPS or localhost). Use admin review, or upload a photo instead.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      // Mount the <video> first; the effect above attaches the stream once the
      // element is in the DOM.
      setActive(true);
    } catch (err) {
      // Name the specific failure so the user knows how to fix it.
      const name = (err as { name?: string })?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        toast.error("Camera permission was denied. Allow camera access in your browser, or use admin review.");
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        toast.error("No camera was found on this device. Use admin review, or upload a photo instead.");
      } else if (name === "NotReadableError") {
        toast.error("The camera is in use by another app. Close it and try again, or use admin review.");
      } else {
        toast.error("Could not access the camera. Please allow camera permission or use admin review.");
      }
    } finally {
      setStarting(false);
    }
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;

    // The stream may not have delivered a frame yet (videoWidth/Height = 0),
    // which would produce a blank capture. Guard against it.
    if (!video.videoWidth || !video.videoHeight) {
      toast.error("The camera is still starting. Please wait a moment and try again.");
      return;
    }

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
          <video ref={videoRef} className="w-full max-w-sm rounded-md border border-neutral-200 bg-black" playsInline muted autoPlay />
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
