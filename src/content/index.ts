import { ThemeEngine } from './theme-engine';
import { request } from '../shared/messaging';
import type { Resolved } from '../shared/types';
if (!globalThis.__folio && document.body && document.contentType === 'text/html') {
  const engine = new ThemeEngine(); const subscribers = new Set<(s: Resolved) => void>(); let generation = 0;
  const media = matchMedia('(prefers-color-scheme: dark)');
  const runtime = globalThis.__folio = { engine, state: undefined as Resolved | undefined, subscribe(fn: (s: Resolved) => void) { subscribers.add(fn); return () => { subscribers.delete(fn); }; }, async refresh() {
    const gen = ++generation;
    try { const state = await request<Resolved>({ type: 'GET_STATE', dark: media.matches }); if (gen !== generation) return; const wasEnabled = runtime.state?.enabled; runtime.state = state; engine.apply(state); if (wasEnabled && !state.enabled) globalThis.__folio?.closeReader?.(); subscribers.forEach(fn => fn(state)); }
    catch { engine.destroy(); globalThis.__folio?.closeReader?.(); }
  } };
  chrome.runtime.onMessage.addListener((m, sender, respond) => {
    if (sender.id !== chrome.runtime.id) return;
    if (m?.type === 'REFRESH') { void runtime.refresh().then(() => respond({ ok: true })); return true; }
    if (m?.type === 'RESTORE_NOW') { engine.destroy(); globalThis.__folio?.closeReader?.(); respond({ ok: true }); }
    if (m?.type === 'PAGE_INFO') { respond({ readerAvailable: runtime.state?.readerSuggestions !== false && (document.querySelector('article,main,[role=main]')?.textContent?.length ?? 0) > 600 }); }
    if (m?.type === 'READER_TOGGLE') { Promise.resolve(globalThis.__folio?.toggleReader?.()).then(() => respond({ ok: true }), e => respond({ ok: false, error: String(e.message) })); return true; }
  });
  media.addEventListener('change', () => void runtime.refresh());
  matchMedia('(forced-colors: active)').addEventListener('change', () => void runtime.refresh());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void runtime.refresh(); });
  window.addEventListener('pageshow', () => void runtime.refresh());
  window.addEventListener('pagehide', e => { if (!e.persisted) { engine.destroy(); globalThis.__folio?.closeReader?.(); } });
  void runtime.refresh();
}
