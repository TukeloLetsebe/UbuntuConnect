import { Check } from "lucide-react";
import { Label } from "../ui/label";
import { INDIVIDUAL_CAUSES } from "../../../lib/registrationOptions";

interface Props {
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

/**
 * Multi-select for "Causes you care about" rendered as toggleable chips.
 * Lightweight (no extra dependency) — the selection is submitted as a
 * comma-joined string in the existing CauseOfCare field.
 */
export default function CausesMultiSelect({ selected, onChange, disabled }: Props) {
  const toggle = (cause: string) => {
    if (selected.includes(cause)) {
      onChange(selected.filter((c) => c !== cause));
    } else {
      onChange([...selected, cause]);
    }
  };

  return (
    <div>
      <Label>Causes You Care About (Optional)</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        {INDIVIDUAL_CAUSES.map((cause) => {
          const isSelected = selected.includes(cause);
          return (
            <button
              key={cause}
              type="button"
              onClick={() => toggle(cause)}
              disabled={disabled}
              aria-pressed={isSelected}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors ${
                isSelected
                  ? "bg-orange-100 border-orange-400 text-orange-800"
                  : "bg-white border-neutral-200 text-neutral-700 hover:border-orange-300"
              }`}
            >
              {isSelected && <Check className="w-3.5 h-3.5" />}
              {cause}
            </button>
          );
        })}
      </div>
    </div>
  );
}
