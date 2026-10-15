import { CreditCard } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export interface CardDetails {
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
}

export const emptyCard: CardDetails = { cardNumber: "", cardExpiry: "", cardCvv: "" };

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
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
 * Simulated card entry for demos. This is a MOCK gateway — no validation and no
 * real charge. Any numbers you type are accepted and the wallet is credited.
 */
export default function CardPaymentFields({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 p-4 bg-neutral-50">
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <CreditCard className="w-4 h-4" />
        <span>Simulated card — enter any numbers (no real charge)</span>
      </div>
      <div>
        <Label htmlFor="card-number">Card Number</Label>
        <Input
          id="card-number"
          inputMode="numeric"
          autoComplete="off"
          placeholder="e.g. 4111 1111 1111 1111"
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
            autoComplete="off"
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
            autoComplete="off"
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
