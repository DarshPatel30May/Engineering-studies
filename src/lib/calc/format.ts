/** Number formatting helpers. Calculations always keep full precision; only display is rounded. */

/** Format to a number of significant figures, trimming trailing zeros. */
export function sig(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e6 || abs < 1e-4) {
    const [m, e] = n.toExponential(digits - 1).split('e');
    return `${trimZeros(m)} × 10^${Number(e)}`;
  }
  const p = Number(n.toPrecision(digits));
  // Avoid "-0"
  return trimZeros(String(Object.is(p, -0) ? 0 : p));
}

/** Format to fixed decimal places (cleans -0). */
export function fixed(n: number, dp = 2): string {
  if (!Number.isFinite(n)) return '—';
  const s = n.toFixed(dp);
  return /^-0(\.0+)?$/.test(s) ? s.slice(1) : s;
}

/** LaTeX-safe number: uses \times 10^{n} for very large/small values. */
export function tex(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return '\\text{—}';
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e6 || abs < 1e-4) {
    const [m, e] = n.toExponential(digits - 1).split('e');
    return `${trimZeros(m)} \\times 10^{${Number(e)}}`;
  }
  return sig(n, digits);
}

/** LaTeX number wrapped in brackets when negative, e.g. for substitution into equations. */
export function texb(n: number, digits = 4): string {
  return n < 0 ? `(${tex(n, digits)})` : tex(n, digits);
}

function trimZeros(s: string): string {
  if (!s.includes('.')) return s;
  return s.replace(/0+$/, '').replace(/\.$/, '');
}

/** Relative/absolute tolerance comparison used for marking numerical answers. */
export function approxEqual(a: number, b: number, relTol = 0.02, absTol = 1e-9): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= Math.max(absTol, relTol * Math.max(Math.abs(a), Math.abs(b)));
}

export const deg2rad = (d: number) => (d * Math.PI) / 180;
export const rad2deg = (r: number) => (r * 180) / Math.PI;

/** Clean tiny floating-point noise to exactly zero (e.g. 1e-15 → 0). */
export function clean(n: number, eps = 1e-9): number {
  return Math.abs(n) < eps ? 0 : n;
}

/** Parse a user-entered number. Accepts commas as thousands separators and unicode minus. */
export function parseNum(raw: string): number | null {
  const s = raw.trim().replace(/,/g, '').replace(/−/g, '-');
  if (s === '' || s === '-' || s === '.') return null;
  if (!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
