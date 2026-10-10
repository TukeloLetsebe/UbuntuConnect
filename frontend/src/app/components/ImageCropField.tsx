import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
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
  /** Preview shape hint for the thumbnail. */
  rounded?: "full" | "lg";
  disabled?: boolean;
}

/**
 * Reusable image field with in-browser cropping. The user picks a file, drags
 * and zooms inside a fixed-ratio crop frame, and the cropped result is uploaded
 * (via the existing upload service, which also resizes/compresses server-side).
 * One component for every image: profile avatar, banner, campaign, etc.
 * Cropping is client-only — the backend never needs to know about it.
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
  const [uploading, setUploading] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

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
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const cancelCrop = () => {
    if (rawImage) URL.revokeObjectURL(rawImage);
    setRawImage(null);
  };

  const saveCrop = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    setUploading(true);
    try {
      const blob = await getCroppedBlob(rawImage, croppedAreaPixels);
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

  const previewRadius = rounded === "full" ? "rounded-full" : "rounded-lg";

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

      {/* Crop modal */}
      {rawImage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={cancelCrop}>
          <div className="bg-white rounded-lg w-full max-w-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Adjust image</h3>
              <Button variant="ghost" size="sm" onClick={cancelCrop}><X className="w-4 h-4" /></Button>
            </div>
            <div className="relative w-full h-72 bg-neutral-900 rounded-md overflow-hidden">
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <span className="text-sm text-neutral-500">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
            </div>
            <div className="flex gap-3 mt-4">
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

/** Crops the source image to the selected pixel area and returns a JPEG blob. */
async function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width));
  canvas.height = Math.max(1, Math.round(area.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, area.width, area.height
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/jpeg", 0.9);
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
