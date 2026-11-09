import { useEffect, useRef, useState } from 'react';
import { request } from '../shared/messaging';
import type { Settings } from '../shared/types';
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(), [error, setError] = useState(''), [saved, setSaved] = useState(true);
  const current = useRef<Settings | undefined>(undefined), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const version = useRef(0); const pending = useRef<Promise<unknown>>(Promise.resolve()); const dirty = useRef(false); const flush = useRef<(() => void) | undefined>(undefined);
  const reload = async () => { const s = await request<Settings>({ type: 'GET_SETTINGS' }); current.current = s; setSettings(s); };
  useEffect(() => { void reload().catch(e => setError(e.message)); const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => { if (area === 'local' && changes.settings && !dirty.current) void reload().catch(e => setError(e.message)); }; const onHide = () => { clearTimeout(timer.current); flush.current?.(); }; chrome.storage.onChanged.addListener(listener); window.addEventListener('pagehide', onHide); return () => { chrome.storage.onChanged.removeListener(listener); window.removeEventListener('pagehide', onHide); }; }, []);
  const update = (change: (s: Settings) => Settings, immediate = false) => {
    if (!current.current) return;
    const next = change(structuredClone(current.current)); current.current = next; setSettings(next); setSaved(false); dirty.current = true; const id = ++version.current; clearTimeout(timer.current);
    const commit = () => { flush.current = undefined; pending.current = pending.current.catch(() => {}).then(() => request<Settings>({ type: 'SAVE_SETTINGS', settings: next })).then(() => { if (id === version.current) { dirty.current = false; setSaved(true); setError(''); } }, e => { if (id === version.current) { dirty.current = false; setError(e.message); setSaved(true); } }); }; flush.current = commit;
    if (immediate) commit(); else timer.current = setTimeout(commit, 120);
  };
  return { settings, update, error, setError, saved, reload };
}
