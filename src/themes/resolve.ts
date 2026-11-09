import type { Settings, TabOverride, Resolved } from '../shared/types';
import { PRESETS } from './presets';
import { transformPalette } from '../content/color-utils';
export function isNight(date: Date, dayStart: string, nightStart: string): boolean {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const toMinutes = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
  const day = toMinutes(dayStart), night = toMinutes(nightStart);
  return night > day ? minutes < day || minutes >= night : minutes >= night && minutes < day;
}
export function nextBoundary(date: Date, times: string[]): number {
  return Math.min(...times.map(t => { const next = new Date(date); next.setHours(Number(t.slice(0, 2)), Number(t.slice(3)), 0, 0); if (next <= date) next.setDate(next.getDate() + 1); return next.getTime(); }));
}
export function resolveSettings(s: Settings, origin: string, dark: boolean, tab?: TabOverride, date = new Date()): Resolved {
  const rule = s.rules.find(r => r.origin === origin);
  const override = tab?.origin === origin ? tab : undefined;
  const automatic = s.automatic.mode === 'system' ? (dark ? s.automatic.night : s.automatic.day) : s.automatic.mode === 'schedule' ? (isNight(date, s.automatic.dayStart, s.automatic.nightStart) ? s.automatic.night : s.automatic.day) : undefined;
  const preset = override?.preset ?? rule?.preset ?? automatic ?? s.preset;
  const appearance = { ...s.appearance, ...(rule?.preserveImages ? { dimming: 'off' as const } : {}) };
  const palette = transformPalette([...PRESETS, ...s.customPresets].find(p => p.id === preset) ?? PRESETS[0], appearance);
  return { enabled: override?.enabled ?? rule?.enabled ?? s.enabled, preset, palette, appearance, typography: { ...s.typography, ...rule?.typography }, source: override?.preset !== undefined || override?.enabled !== undefined ? 'tab' : rule?.preset !== undefined || rule?.enabled !== undefined ? 'website' : automatic ? 'automatic' : 'default', readerSuggestions: rule?.readerSuggestions !== false };
}
