import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Label } from "./ui/label";
import { uploadService } from "../../services/uploadService";
import { resolveMediaUrl } from "../../lib/api";

interface Props {
  label?: string;
  value: string | null; // stored URL (relative)
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

/**
 * Reusable image upload control: pick a device image, upload it to the API
 * (which resizes/compresses it), and store the returned URL. Shows a preview
 * with a remove button.
 */
export default function ImageUploadField({ label = "Image", value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadService.uploadImage(file);
      onChange(res.data.url);
    } catch (err) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      toast.error(typeof data === "string" ? data : "Image upload failed. Please try a different file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ""; // allow re-selecting the same file
        }}
      />

      {value ? (
        <div className="mt-2 relative inline-block">
          <img
            src={resolveMediaUrl(value)}
            alt="Upload preview"
            className="max-h-48 rounded-md border border-neutral-200 object-cover"
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
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="mt-2 flex items-center gap-2 px-4 py-2 border-2 border-dashed border-neutral-300 rounded-md text-neutral-600 hover:border-orange-400 hover:text-orange-600 transition-colors disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          {uploading ? "Uploading…" : "Upload image from device"}
        </button>
      )}
    </div>
  );
}
