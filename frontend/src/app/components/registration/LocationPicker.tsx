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
 * Normalizes a province name returned by the geocoder to one of our known
 * SA_PROVINCES values (handles minor spelling/format differences).
 */
function matchProvince(raw: string | undefined): string | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  // Exact-ish match on our canonical list.
  const direct = SA_PROVINCES.find((p) => p.toLowerCase() === lower);
  if (direct) return direct;
  // Common aliases / partial contains.
  const alias: Record<string, string> = {
    "kwazulu natal": "KwaZulu-Natal",
    "kwa-zulu natal": "KwaZulu-Natal",
    "kzn": "KwaZulu-Natal",
    "north-west": "North West",
    "northwest": "North West",
  };
  if (alias[lower]) return alias[lower];
  return SA_PROVINCES.find((p) => lower.includes(p.toLowerCase())) ?? null;
}

/**
 * Picks the closest known city for a province given a geocoded place name.
 * Returns a city from our list if the names overlap, otherwise null so the
 * user chooses manually.
 */
function matchCity(prov: string, place: string | undefined): string | null {
  if (!place) return null;
  const list = SA_PROVINCES_CITIES[prov] ?? [];
  const lower = place.toLowerCase();
  // The city list entries can be like "Gqeberha (Port Elizabeth)" — match if
  // either the entry or the geocoded place name contains the other.
  return (
    list.find((c) => {
      const cl = c.toLowerCase();
      return cl.includes(lower) || lower.includes(cl.split(" (")[0]);
    }) ?? null
  );
}

/**
 * Cascading Province -> City location picker. Selecting a province filters the
 * available cities. The "auto-detect" button captures the browser's geolocation
 * and reverse-geocodes it (via OpenStreetMap Nominatim) to pre-fill the
 * Province and, when possible, the City dropdowns.
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
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  const cities = province ? SA_PROVINCES_CITIES[province] ?? [] : [];

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoMessage("Your browser does not support location detection. Please pick manually.");
      return;
    }
    setGeoStatus("locating");
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`,
            { headers: { Accept: "application/json" } }
          );
          if (!res.ok) throw new Error("geocode failed");
          const data = await res.json();
          const addr = data.address ?? {};
          const matchedProvince = matchProvince(addr.state ?? addr.province);
          if (!matchedProvince) {
            setGeoStatus("error");
            setGeoMessage("We found your location but couldn't match a South African province. Please pick manually.");
            return;
          }
          onProvinceChange(matchedProvince);
          const placeName = addr.city ?? addr.town ?? addr.village ?? addr.suburb ?? addr.county;
          const matchedCity = matchCity(matchedProvince, placeName);
          onCityChange(matchedCity ?? "");
          setGeoStatus("done");
          setGeoMessage(
            matchedCity
              ? `Detected ${matchedCity}, ${matchedProvince}.`
              : `Detected ${matchedProvince}${placeName ? ` (near ${placeName})` : ""}. Please choose your city.`
          );
        } catch {
          setGeoStatus("error");
          setGeoMessage("Could not look up your location. Please pick manually.");
        }
      },
      (err) => {
        setGeoStatus("error");
        setGeoMessage(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Please pick manually."
            : "Could not detect location. Please pick manually."
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
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
      {geoStatus === "done" && geoMessage && (
        <p className="text-xs text-green-600">{geoMessage}</p>
      )}
      {geoStatus === "error" && geoMessage && (
        <p className="text-xs text-red-500">{geoMessage}</p>
      )}
    </div>
  );
}

/** Combines province + city (+ optional coords) into a single location string. */
export function composeLocation(province: string, city: string): string | undefined {
  const parts = [city, province].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}
