import type { Appearance, Palette } from '../shared/types';
export type RGB = [number, number, number];
export const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
export function rgb(hex: string): RGB { return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as RGB; }
export function hex(c: RGB): string { return '#' + c.map(n => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0')).join(''); }
export function mix(a: string, b: string, amount: number): string { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * clamp(amount)) as RGB); }
export function luminance(color: string): number { return rgb(color).map(n => { const c = n / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }).reduce((s, n, i) => s + n * [.2126, .7152, .0722][i], 0); }
export function contrast(a: string, b: string): number { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
export function ensureContrast(foreground: string, background: string, minimum = 4.5): string {
  if (contrast(foreground, background) >= minimum) return foreground;
  const end = contrast('#000000', background) > contrast('#ffffff', background) ? '#000000' : '#ffffff';
  let lo = 0, hi = 1;
  for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (contrast(mix(foreground, end, mid), background) < minimum) lo = mid; else hi = mid; }
  return mix(foreground, end, hi);
}
export function transformPalette(p: Palette, a: Appearance): Palette {
  let background = mix(p.background, a.luminance < 0 ? '#000000' : '#ffffff', Math.abs(a.luminance) / 100 * .42);
  const c = rgb(background); const w = a.warmth / 100;
  background = hex([c[0] + w * 7, c[1] + w * 2, c[2] - w * 16]);
  const end = luminance(background) > .35 ? '#000000' : '#ffffff';
  // Contrast increases monotonically toward the farther luminance endpoint.
  const text = a.contrast < 0 ? mix(p.text, background, -a.contrast / 100 * .48) : mix(p.text, end, a.contrast / 100 * .65);
  const accentRGB = rgb(p.accent), gray = .2126 * accentRGB[0] + .7152 * accentRGB[1] + .0722 * accentRGB[2];
  const accent = hex(accentRGB.map(n => gray + (n - gray) * a.saturation / 100) as RGB);
  return { background, text: a.accessibility ? ensureContrast(text, background) : text, secondary: a.accessibility ? ensureContrast(p.secondary, background) : p.secondary, accent: a.accessibility ? ensureContrast(accent, background) : accent };
}
