// Single currency formatter used across the app so money always reads the same:
// "R 9,100.50" (thousands separators, always 2 decimals).

export function formatZar(amount: number | null | undefined): string {
  const n = typeof amount === "number" && isFinite(amount) ? amount : 0;
  return `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
