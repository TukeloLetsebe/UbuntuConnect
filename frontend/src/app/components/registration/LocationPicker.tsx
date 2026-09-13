import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { SA_PROVINCES, SA_PROVINCES_CITIES } from "../../../lib/registrationOptions";

interface Props {
  province: string;
  city: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Cascading Province -> City location picker. Selecting a province filters the
 * available cities. Includes an optional "auto-detect" button that captures the
 * browser's geolocation coordinates (stored as text, no reverse-geocode).
 */
export default function LocationPicker({
  province,
  city,
  onProvinceChange,
  onCityChange,
  disabled,
  required,
}: Props) {
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "done" | "error">("idle");
  const [coords, setCoords] = useState<string | null>(null);

  const cities = province ? SA_PROVINCES_CITIES[province] ?? [] : [];

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setGeoStatus("done");
      },
      () => setGeoStatus("error"),
      { timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2">
      <Label>Location{required ? "" : " (Optional)"}</Label>
      <div className="grid md:grid-cols-2 gap-4">
        <Select
          value={province}
          onValueChange={(v) => {
            onProvinceChange(v);
            onCityChange(""); // reset city when province changes
          }}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Province" />
          </SelectTrigger>
          <SelectContent>
            {SA_PROVINCES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={city} onValueChange={onCityChange} disabled={disabled || !province}>
          <SelectTrigger>
            <SelectValue placeholder={province ? "City / Town" : "Select a province first"} />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <button
        type="button"
        onClick={detectLocation}
        disabled={disabled || geoStatus === "locating"}
        className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 disabled:opacity-60"
      >
        {geoStatus === "locating" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MapPin className="w-4 h-4" />
        )}
        Auto-detect my location
      </button>
      {geoStatus === "done" && coords && (
        <p className="text-xs text-neutral-500">Detected coordinates: {coords}</p>
      )}
      {geoStatus === "error" && (
        <p className="text-xs text-red-500">Could not detect location. Please pick manually.</p>
      )}
    </div>
  );
}

/** Combines province + city (+ optional coords) into a single location string. */
export function composeLocation(province: string, city: string): string | undefined {
  const parts = [city, province].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}
