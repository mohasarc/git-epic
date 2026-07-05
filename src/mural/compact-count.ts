/**
 * Compact, suffix-free count: verbatim below 1000, `k` below a million, `M` above.
 * One decimal while the scaled value is under 10, none at or above; a trailing `.0`
 * is stripped so band edges read clean (`9.99k → "10.0" → "10k"`).
 */
export function compactCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return scaleCount(n, 1000, 'k');
  return scaleCount(n, 1_000_000, 'M');
}

function scaleCount(n: number, divisor: number, suffix: string): string {
  const value = n / divisor;
  const digits = value < 10 ? 1 : 0;
  return value.toFixed(digits).replace(/\.0$/, '') + suffix;
}
