/** Fixed two-decimal rounding, trailing zeros stripped: no scientific notation, no float-sum noise. */
export function formatSvgNumber(value: number): string {
  return value
    .toFixed(2)
    .replace(/0+$/, '')
    .replace(/\.$/, '');
}
