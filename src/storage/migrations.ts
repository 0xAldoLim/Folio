import { defaults, validateSettings } from './schema';
export function migrate(value: unknown) {
  if (value && typeof value === 'object' && (value as {version?: number}).version === 0) {
    const old = value as { preset?: string; enabled?: boolean };
    return validateSettings({ ...defaults(), preset: old.preset ?? 'paper', enabled: old.enabled ?? true });
  }
  return validateSettings(value);
}
