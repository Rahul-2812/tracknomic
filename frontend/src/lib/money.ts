export function formatINRFromCents(cents: number): string {
  const rupees = cents / 100;
  return rupees.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

export function parseRupeesToCents(value: string): number {
  const cleaned = value.replace(/[,₹\s]/g, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return NaN;
  return Math.round(n * 100);
}

