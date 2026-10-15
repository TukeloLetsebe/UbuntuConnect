import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";
import { ImagePlus, Loader2, X, RotateCcw } from "lucide-react";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { uploadService } from "../../services/uploadService";
import { resolveMediaUrl } from "../../lib/api";

interface Props {
  label?: string;
  /** The stored (uploaded) image URL, or null. */
  value: string | null;
  onChange: (url: string | null) => void;
  /** Crop frame aspect ratio. 1 = square (avatar), e.g. 16/5 = wide banner. */
  aspect?: number;
  /** Preview shape hint for the thumbnail. "full" = circle (logo/avatar). */
  rounded?: "full" | "lg";
  disabled?: boolean;
}

/**
 * Reusable image field with in-browser cropping (react-easy-crop). The user
 * picks a file, drags/zooms inside a fixed-ratio frame (image starts zoomed to
 * fully cover — no empty gaps, can't zoom out past cover), sees a live preview
 * in the final shape, and the result is downscaled + compressed before upload.
 * The upload endpoint and how the saved URL is used are unchanged.
 */
export default function ImageCropField({
  label = "Image",
  value,
  onChange,
  aspect = 1,
  rounded = "lg",
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawImage, setRawImage] = useState<string | null>(null); // object URL being cropped
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const isLogo = rounded === "full";
  const isBanner = aspect >= 2.5;
  // What this image is, for the dialog title + save caps.
  const kind = isLogo ? "logo" : isBanner ? "banner" : "image";
  const title = `Adjust ${kind}`;
  // Save caps: logos ≤ 400² ; banners ≤ 1200 wide ; others ≤ 1024.
  const maxEdge = isLogo ? 400 : isBanner ? 1200 : 1024;

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  // Keep a small live preview in sync with the current crop.
  useEffect(() => {
    if (!rawImage || !croppedAreaPixels) return;
    let cancelled = false;
    getCroppedBlob(rawImage, croppedAreaPixels, 240)
      .then((blob) => { if (!cancelled) setPreviewUrl(URL.createObjectURL(blob)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [rawImage, croppedAreaPixels]);

  // Esc closes the crop dialog.
  useEffect(() => {
    if (!rawImage) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !uploading) cancelCrop(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawImage, uploading]);

  const pickFile = () => inputRef.current?.click();

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setRawImage(URL.createObjectURL(file));
    resetCrop();
  };

  const resetCrop = () => { setCrop({ x: 0, y: 0 }); setZoom(1); };

  const cancelCrop = () => {
    if (rawImage) URL.revokeObjectURL(rawImage);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRawImage(null);
  };

  const saveCrop = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(rawImage, croppedAreaPixels, maxEdge);
      const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      const res = await uploadService.uploadImage(file);
      onChange(res.data.url);
      cancelCrop();
    } catch {
      toast.error("Could not process the image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const previewRadius = isLogo ? "rounded-full" : "rounded-lg";

  return (
    <div>
      {label && <Label>{label}</Label>}

      <div className="mt-2">
        {value ? (
          <div className="relative inline-block">
            <img
              src={resolveMediaUrl(value)}
              alt={label}
              className={`${previewRadius} border border-neutral-200 object-cover ${aspect === 1 ? "w-28 h-28" : "w-full max-w-sm h-28"}`}
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled}
              aria-label="Remove image"
              className="absolute -top-2 -right-2 bg-white border border-neutral-300 rounded-full p-1 shadow-sm hover:bg-neutral-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={pickFile}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-neutral-300 rounded-md text-neutral-600 hover:border-orange-400 hover:text-orange-600 transition-colors disabled:opacity-60"
          >
            <ImagePlus className="w-4 h-4" /> Choose image
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFileSelected} />
      </div>

      {/* Crop dialog — compact, fits on screen, no scrolling. */}
      {rawImage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={cancelCrop}>
          <div className="bg-white rounded-xl w-full max-w-[520px] max-h-[60vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 shrink-0">
              <h3 className="font-semibold">{title}</h3>
              <button type="button" onClick={cancelCrop} disabled={uploading} aria-label="Close" className="text-neutral-400 hover:text-neutral-700 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-4 overflow-hidden">
              {/* Crop canvas — large, dimmed outside the frame */}
              <div className="relative w-full h-56 bg-neutral-900 rounded-lg overflow-hidden shrink-0">
                <Cropper
                  image={rawImage}
                  crop={crop}
                  zoom={zoom}
                  minZoom={1}
                  maxZoom={4}
                  aspect={aspect}
                  cropShape={isLogo ? "round" : "rect"}
                  showGrid={!isLogo}
                  objectFit="cover"
                  restrictPosition
                  zoomWithScroll
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Controls row: zoom slider + reset, with live preview */}
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-500 shrink-0">Zoom</span>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      step={0.01}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 accent-orange-600"
                    />
                    <Button type="button" variant="ghost" size="sm" className="shrink-0 text-neutral-500" onClick={resetCrop} disabled={uploading}>
                      <RotateCcw className="w-4 h-4 mr-1" /> Reset
                    </Button>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Drag to reposition · scroll to zoom</p>
                </div>

                {/* Live preview in the final shape */}
                <div className="shrink-0 text-center">
                  <div className={`overflow-hidden border border-neutral-200 bg-neutral-100 ${isLogo ? "rounded-full w-14 h-14" : "rounded-md"} ${isBanner ? "w-24 h-8" : isLogo ? "" : "w-16 h-12"}`}>
                    {previewUrl && <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />}
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1">Preview</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 py-3 border-t border-neutral-100 shrink-0">
              <Button onClick={saveCrop} disabled={uploading} className="flex-1 bg-orange-600 hover:bg-orange-700">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {uploading ? "Uploading…" : "Save"}
              </Button>
              <Button variant="outline" onClick={cancelCrop} disabled={uploading}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Crops the source image to the selected pixel area, downscales so the longest
 * edge is at most `maxEdge` (prevents bloated uploads), and returns a
 * compressed JPEG blob. Never upscales; high-quality smoothing.
 */
async function getCroppedBlob(imageSrc: string, area: Area, maxEdge = 1024): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const cropW = Math.max(1, Math.round(area.width));
  const cropH = Math.max(1, Math.round(area.height));

  const scale = Math.min(1, maxEdge / Math.max(cropW, cropH));
  const outW = Math.max(1, Math.round(cropW * scale));
  const outH = Math.max(1, Math.round(cropH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, outW, outH
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/jpeg", 0.85);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
