import { defaults, validateSettings } from './schema';
import { migrate } from './migrations';
import type { Settings } from '../shared/types';
export async function loadSettings(): Promise<Settings> {
  const { settings } = await chrome.storage.local.get('settings');
  if (settings === undefined) return defaults();
  try { return migrate(settings); }
  catch { await chrome.storage.local.set({ settings: defaults(), recoveryNotice: 'Invalid stored settings were reset. Import a valid backup to restore your preferences.' }); return defaults(); }
}
let queue: Promise<unknown> = Promise.resolve();
export function updateSettings(update: (s: Settings) => Settings): Promise<Settings> {
  const next = queue.catch(() => {}).then(async () => { const settings = validateSettings(update(await loadSettings())); await chrome.storage.local.set({ settings }); return settings; });
  queue = next; return next;
}
