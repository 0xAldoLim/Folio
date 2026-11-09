import type { Settings, SiteRule, Typography } from '../shared/types';
import { PRESETS } from '../themes/presets';
export const DEFAULTS: Settings = {
  version: 1, enabled: true, preset: 'paper',
  appearance: { contrast: 0, luminance: 0, warmth: 0, saturation: 100, dimming: 'off', protectGraphics: true, accessibility: true, texture: 'subtle' },
  typography: { font: 'georgia', size: 18, lineHeight: 1.7, letterSpacing: 0, paragraphSpacing: 1.1, width: 68, align: 'left' },
  automatic: { mode: 'manual', day: 'paper', night: 'dark', dayStart: '07:00', nightStart: '19:00' }, rules: [], customPresets: []
};
export const defaults = (): Settings => structuredClone(DEFAULTS);
const fail = (field: string): never => { throw new Error(`Invalid settings: ${field}.`); };
const obj = (v: unknown, f: string): Record<string, unknown> => { if (!v || typeof v !== 'object' || Array.isArray(v)) fail(f); return v as Record<string, unknown>; };
const bool = (v: unknown, f: string) => typeof v === 'boolean' ? v : fail(f);
const num = (v: unknown, lo: number, hi: number, f: string) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : fail(f);
function choice<T extends string>(v: unknown, allowed: readonly T[], f: string): T { return typeof v === 'string' && allowed.includes(v as T) ? v as T : fail(f); }
export function normalizeOrigin(input: string): string { const u = new URL(input); if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) throw new Error('Use a plain http or https website address.'); return u.origin; }
export function validateTypography(value: unknown, partial = false): Typography | Partial<Typography> {
  const t = obj(value, 'typography'), out: Partial<Typography> = {};
  const validators = { font: (v: unknown) => choice(v, ['system', 'georgia', 'arial', 'verdana'], 'font'), size: (v: unknown) => num(v, 14, 24, 'font size'), lineHeight: (v: unknown) => num(v, 1.4, 2, 'line height'), letterSpacing: (v: unknown) => num(v, 0, 2, 'letter spacing'), paragraphSpacing: (v: unknown) => num(v, .5, 2.5, 'paragraph spacing'), width: (v: unknown) => num(v, 55, 90, 'column width'), align: (v: unknown) => choice(v, ['left', 'justify'], 'alignment') };
  for (const key of Object.keys(validators) as (keyof Typography)[]) if (!partial || key in t) Object.assign(out, { [key]: validators[key](t[key]) });
  return out;
}
export function validateSettings(value: unknown): Settings {
  const s = obj(value, 'document'); if (s.version !== 1) fail('unsupported schema version');
  if (!Array.isArray(s.customPresets) || s.customPresets.length > 30) fail('custom presets');
  const customPresets = (s.customPresets as unknown[]).map((v: unknown) => { const p = obj(v, 'preset'); if (typeof p.id !== 'string' || !/^custom-[a-z0-9-]{1,60}$/.test(p.id)) fail('preset id'); if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 40) fail('preset name'); const colors: Record<string, string> = {}; for (const k of ['background', 'text', 'secondary', 'accent']) { if (typeof p[k] !== 'string' || !/^#[0-9a-f]{6}$/i.test(p[k] as string)) fail('palette color'); colors[k] = p[k] as string; } return { id: p.id as string, name: (p.name as string).trim(), background: colors.background, text: colors.text, secondary: colors.secondary, accent: colors.accent }; });
  if (new Set(customPresets.map(p => p.id)).size !== customPresets.length) fail('duplicate preset');
  const ids = [...PRESETS, ...customPresets].map(p => p.id);
  const a = obj(s.appearance, 'appearance'), au = obj(s.automatic, 'automatic');
  const time = (v: unknown) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : fail('schedule time');
  if (!Array.isArray(s.rules) || s.rules.length > 500) fail('website rules');
  const rules: SiteRule[] = (s.rules as unknown[]).map((v: unknown) => { const r = obj(v, 'website rule'); if (typeof r.origin !== 'string' || r.origin !== normalizeOrigin(r.origin)) fail('normalized website origin'); return { origin: r.origin as string, ...(r.enabled === undefined ? {} : { enabled: bool(r.enabled, 'website enabled') }), ...(r.preset === undefined ? {} : { preset: choice(r.preset, ids, 'website preset') }), ...(r.typography === undefined ? {} : { typography: validateTypography(r.typography, true) }), ...(r.preserveImages === undefined ? {} : { preserveImages: bool(r.preserveImages, 'preserve images') }), ...(r.readerSuggestions === undefined ? {} : { readerSuggestions: bool(r.readerSuggestions, 'reader suggestions') }) }; });
  if (new Set(rules.map(r => r.origin)).size !== rules.length) fail('duplicate website');
  const automatic = { mode: choice(au.mode, ['manual', 'system', 'schedule'], 'automatic mode'), day: choice(au.day, ids, 'day preset'), night: choice(au.night, ids, 'night preset'), dayStart: time(au.dayStart), nightStart: time(au.nightStart) };
  if (automatic.dayStart === automatic.nightStart) fail('day and night times must differ');
  return { version: 1, enabled: bool(s.enabled, 'enabled'), preset: choice(s.preset, ids, 'preset'), customPresets, rules, typography: validateTypography(s.typography) as Typography, automatic, appearance: { contrast: num(a.contrast, -100, 100, 'contrast'), luminance: num(a.luminance, -100, 100, 'luminance'), warmth: num(a.warmth, -100, 100, 'warmth'), saturation: num(a.saturation, 0, 150, 'saturation'), dimming: choice(a.dimming, ['off', 'low', 'medium', 'high'], 'image dimming'), protectGraphics: bool(a.protectGraphics, 'graphics protection'), accessibility: bool(a.accessibility, 'accessibility'), texture: choice(a.texture, ['off', 'subtle', 'medium'], 'paper texture') } };
}
export function importSettings(json: string): Settings { if (json.length > 150000) throw new Error('Settings file is too large.'); return validateSettings(JSON.parse(json)); }
export const exportSettings = (s: Settings) => JSON.stringify(validateSettings(s), null, 2);
