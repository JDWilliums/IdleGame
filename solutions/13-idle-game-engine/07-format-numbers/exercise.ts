// Reference solution for 13-07. Read it only AFTER your own version passes.

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'] as const;

export function roundTo(n: number, decimals: number): number {
  const factor = 10 ** decimals;
  // Work with the magnitude and nudge by EPSILON-scaled amount so values like 1.005
  // (stored as 1.00499999…) round the way humans expect. Then restore the sign.
  const magnitude = Math.abs(n);
  const rounded = Math.round(magnitude * factor * (1 + Number.EPSILON)) / factor;
  return Math.sign(n) * rounded || 0; // `|| 0` turns -0 into 0
}

function formatSmall(n: number): string {
  // At most 2 decimals, trailing zeros removed: Number(...) drops them for us.
  return String(roundTo(n, 2));
}

export function formatCompact(n: number): string {
  if (Number.isNaN(n)) return 'NaN';
  if (n < 0) return `-${formatCompact(-n)}`;
  if (!Number.isFinite(n)) return '∞';
  if (n < 1000 && roundTo(n, 2) < 1000) return formatSmall(n);
  if (n >= 1e21) return n.toExponential(2).replace('e+', 'e');

  let unit = Math.min(SUFFIXES.length - 1, Math.floor(Math.log10(n) / 3));
  let value = n / 1000 ** unit;
  // 3 significant digits: 1.23 / 12.3 / 123
  let decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  let rounded = roundTo(value, decimals);

  if (rounded >= 1000) {
    // Rollover: 999,999 → 999.999K → rounds to 1000 → becomes 1.00M
    unit += 1;
    if (unit >= SUFFIXES.length) return n.toExponential(2).replace('e+', 'e');
    value = n / 1000 ** unit;
    decimals = 2;
    rounded = roundTo(value, decimals);
  } else if (rounded >= 100 && decimals > 0) {
    decimals = 0; // e.g. 99.96K rounded to 100.0 → show "100K"
    rounded = roundTo(value, 0);
  } else if (rounded >= 10 && decimals > 1) {
    decimals = 1;
    rounded = roundTo(value, 1);
  }

  return `${rounded.toFixed(decimals)}${SUFFIXES[unit]}`;
}

export function formatGrouped(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function formatPercent(fraction: number, decimals = 1): string {
  return `${roundTo(fraction * 100, decimals).toFixed(decimals)}%`;
}

export function formatPerSecond(amountPerMs: number, unit: string): string {
  return `${formatCompact(amountPerMs * 1000)} ${unit}/s`;
}
