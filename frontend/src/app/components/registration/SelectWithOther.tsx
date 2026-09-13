import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { OTHER } from "../../../lib/registrationOptions";

interface Props {
  id: string;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  otherValue: string;
  onOtherChange: (value: string) => void;
  placeholder?: string;
  otherPlaceholder?: string;
  disabled?: boolean;
}

/**
 * A dropdown that reveals a free-text input when "Other" is selected.
 * The parent stores the selected option in `value` and the custom text in
 * `otherValue`; the effective value to submit is otherValue when value===Other.
 */
export default function SelectWithOther({
  id,
  label,
  options,
  value,
  onChange,
  otherValue,
  onOtherChange,
  placeholder = "Select an option",
  otherPlaceholder = "Please specify",
  disabled,
}: Props) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="mt-2">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === OTHER && (
        <Input
          className="mt-2"
          placeholder={otherPlaceholder}
          value={otherValue}
          onChange={(e) => onOtherChange(e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  );
}

/** Resolves the effective value: the custom text when "Other" is chosen. */
export function resolveWithOther(value: string, otherValue: string): string | undefined {
  if (!value) return undefined;
  if (value === OTHER) return otherValue.trim() || undefined;
  return value;
}
