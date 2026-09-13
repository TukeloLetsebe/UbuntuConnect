import { useRef, useState } from "react";
import { FileUp, Loader2, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { Label } from "./ui/label";
import { uploadService } from "../../services/uploadService";

interface Props {
  label?: string;
  value: string | null; // stored document URL (relative)
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

/**
 * Reusable PDF document upload control: pick a PDF from the device, upload it
 * to the API (validated server-side by the %PDF- signature), and store the
 * returned URL. Shows the uploaded file with a remove + view link.
 */
export default function DocumentUploadField({ label = "Document (PDF)", value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadService.uploadDocument(file);
      onChange(res.data.url);
      setFileName(res.data.fileName || file.name);
    } catch (err) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      toast.error(typeof data === "string" ? data : "Document upload failed. Please upload a valid PDF.");
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
        accept="application/pdf"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="mt-2 flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
          <FileText className="w-5 h-5 text-orange-600 shrink-0" />
          <span className="text-sm text-neutral-700 truncate flex-1">{fileName || "Uploaded document"}</span>
          <button
            type="button"
            onClick={() => { onChange(null); setFileName(null); }}
            disabled={disabled}
            aria-label="Remove document"
            className="text-neutral-400 hover:text-red-600"
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
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
          {uploading ? "Uploading…" : "Upload PDF from device"}
        </button>
      )}
    </div>
  );
}
