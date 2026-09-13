import { CreditCard } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export interface CardDetails {
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
}

export const emptyCard: CardDetails = { cardNumber: "", cardExpiry: "", cardCvv: "" };

/** Luhn checksum on digits only. */
export function passesLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** Validates MM/YY or MM/YYYY and that the card is not expired. */
export function isExpiryValid(expiry: string): boolean {
  const m = expiry.trim().match(/^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/);
  if (!m) return false;
  const month = parseInt(m[1], 10);
  if (month < 1 || month > 12) return false;
  let year = parseInt(m[2], 10);
  if (m[2].length <= 2) year += 2000;
  // Valid through the end of the printed month.
  const endExclusive = new Date(year, month, 1);
  return endExclusive.getTime() > Date.now();
}

/** Returns an error message for the card, or null when valid. */
export function validateCard(card: CardDetails): string | null {
  if (!passesLuhn(card.cardNumber)) return "Enter a valid card number.";
  if (!isExpiryValid(card.cardExpiry)) return "Enter a valid, unexpired expiry (MM/YY).";
  if (!/^\d{3,4}$/.test(card.cardCvv.trim())) return "Enter a valid CVV.";
  return null;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

interface Props {
  value: CardDetails;
  onChange: (card: CardDetails) => void;
  disabled?: boolean;
}

/**
 * Simulated card entry. This is a mock gateway — no real charge is made.
 * The server re-validates (Luhn + expiry) and always approves a valid card.
 */
export default function CardPaymentFields({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 p-4 bg-neutral-50">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <CreditCard className="w-4 h-4" />
        <span>Card details (simulated — no real charge)</span>
      </div>
      <div>
        <Label htmlFor="card-number">Card Number</Label>
        <Input
          id="card-number"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4111 1111 1111 1111"
          className="mt-1"
          disabled={disabled}
          value={value.cardNumber}
          onChange={(e) => onChange({ ...value, cardNumber: formatCardNumber(e.target.value) })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="card-expiry">Expiry (MM/YY)</Label>
          <Input
            id="card-expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="12/28"
            className="mt-1"
            disabled={disabled}
            value={value.cardExpiry}
            onChange={(e) => onChange({ ...value, cardExpiry: formatExpiry(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="card-cvv">CVV</Label>
          <Input
            id="card-cvv"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            maxLength={4}
            className="mt-1"
            disabled={disabled}
            value={value.cardCvv}
            onChange={(e) => onChange({ ...value, cardCvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
          />
        </div>
      </div>
    </div>
  );
}
