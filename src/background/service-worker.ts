import type { Message, Resolved, Context, TabOverride, Settings } from '../shared/types';
import { validMessage } from '../shared/messaging';
import { loadSettings, updateSettings } from '../storage/repository';
import { normalizeOrigin, validateSettings, validateTypography } from '../storage/schema';
import { resolveSettings, nextBoundary } from '../themes/resolve';
import { PRESETS } from '../themes/presets';
import { supportedURL } from '../content/compatibility';

async function tabOverride(tabId: number): Promise<TabOverride | undefined> { return (await chrome.storage.session.get(`tab:${tabId}`))[`tab:${tabId}`] as TabOverride | undefined; }
async function activeTab() { const [tab] = await chrome.tabs.query({ active: true, currentWindow: true }); return tab; }
async function currentState(tab: chrome.tabs.Tab, dark: boolean): Promise<Resolved> { return resolveSettings(await loadSettings(), normalizeOrigin(tab.url!), dark, await tabOverride(tab.id!)); }
async function inject(tabId: number) {
  const tab = await chrome.tabs.get(tabId); const compatibility = supportedURL(tab.url);
  if (!compatibility.supported) throw new Error(compatibility.reason);
  try { await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }); }
  catch { throw new Error('Chrome denied access to this page. Click Folio on the website to grant temporary access, or allow this site in Folio settings. Protected pages cannot be changed.'); }
}
async function refresh(tabId: number) { try { await chrome.tabs.sendMessage(tabId, { type: 'REFRESH' }); } catch { /* Tab has no content script or has closed. */ } }
async function injectReader(tabId: number) { const [result] = await chrome.scripting.executeScript({ target: { tabId }, func: () => !!globalThis.__folio?.toggleReader }); if (!result.result) await chrome.scripting.executeScript({ target: { tabId }, files: ['reader.js'] }); }
async function refreshAll() { const tabs = await chrome.tabs.query({}); await Promise.allSettled(tabs.filter(t => t.id).map(t => refresh(t.id!))); }
async function syncPermissions() {
  const { origins = [] } = await chrome.permissions.getAll();
  const matches = origins.filter(o => /^https?:\/\//.test(o));
  const registered = await chrome.scripting.getRegisteredContentScripts({ ids: ['folio-auto'] });
  if (!matches.length) { if (registered.length) await chrome.scripting.unregisterContentScripts({ ids: ['folio-auto'] }); }
  else {
    const script: chrome.scripting.RegisteredContentScript = { id: 'folio-auto', matches, js: ['content.js'], runAt: 'document_idle', persistAcrossSessions: true, allFrames: false };
    if (registered.length) await chrome.scripting.updateContentScripts([script]); else await chrome.scripting.registerContentScripts([script]);
  }
}
async function schedule(s?: Settings) {
  const settings = s ?? await loadSettings(); await chrome.alarms.clear('folio-boundary');
  if (settings.automatic.mode === 'schedule') await chrome.alarms.create('folio-boundary', { when: nextBoundary(new Date(), [settings.automatic.dayStart, settings.automatic.nightStart]) });
}
const trustedUI = (sender: chrome.runtime.MessageSender) => sender.url?.startsWith(chrome.runtime.getURL(''));
async function handle(m: Message, sender: chrome.runtime.MessageSender): Promise<unknown> {
  if (m.type === 'GET_STATE') {
    if (!sender.tab?.id || !sender.url || !supportedURL(sender.url).supported) throw new Error('A supported webpage is required.');
    return resolveSettings(await loadSettings(), normalizeOrigin(sender.url), m.dark, await tabOverride(sender.tab.id));
  }
  if (m.type === 'READER_PREF') {
    if (!sender.tab?.id || !sender.url) throw new Error('Reader preferences require a webpage.');
    const origin = normalizeOrigin(sender.url);
    await updateSettings(s => {
      const existing = s.rules.find(r => r.origin === origin) ?? { origin };
      const rule = { ...existing, ...(m.preset ? { preset: m.preset } : {}), ...(m.typography ? { typography: { ...existing.typography, ...validateTypography(m.typography, true) } } : {}) };
      return { ...s, rules: [...s.rules.filter(r => r.origin !== origin), rule] };
    });
    if (m.preset) { const previous = await tabOverride(sender.tab.id); if (previous?.preset) { const { preset, ...rest } = previous; await chrome.storage.session.set({ [`tab:${sender.tab.id}`]: rest }); } }
    return true;
  }
  if (!trustedUI(sender)) throw new Error('This action is only available in Folio.');
  switch (m.type) {
    case 'GET_SETTINGS': return loadSettings();
    case 'SAVE_SETTINGS': return updateSettings(() => validateSettings(m.settings));
    case 'PATCH_APPEARANCE': return updateSettings(s => ({ ...s, appearance: { ...s.appearance, ...m.patch } }));
    case 'SAVE_RULE': return updateSettings(s => ({ ...s, rules: [...s.rules.filter(r => r.origin !== m.rule.origin), m.rule] }));
    case 'REMOVE_RULE': return updateSettings(s => ({ ...s, rules: s.rules.filter(r => r.origin !== m.origin) }));
    case 'GET_CONTEXT': {
      const tab = await activeTab(); const compatibility = supportedURL(tab?.url);
      if (!tab?.id || !compatibility.supported) return { ...compatibility, tabId: tab?.id, persistent: false } satisfies Context;
      const origin = normalizeOrigin(tab.url!);
      let info: { readerAvailable?: boolean } = {}; try { info = await chrome.tabs.sendMessage(tab.id, { type: 'PAGE_INFO' }); } catch { /* Hint is optional until activation. */ }
      return { supported: true, tabId: tab.id, origin, state: await currentState(tab, m.dark), persistent: await chrome.permissions.contains({ origins: [`${origin}/*`] }), readerAvailable: info.readerAvailable } satisfies Context;
    }
    case 'SET_TAB': {
      const tab = await chrome.tabs.get(m.tabId); const origin = normalizeOrigin(tab.url!);
      if (m.preset && ![...PRESETS, ...(await loadSettings()).customPresets].some(p => p.id === m.preset)) throw new Error('Unknown preset.');
      if (m.clear) await chrome.storage.session.remove(`tab:${m.tabId}`);
      else await chrome.storage.session.set({ [`tab:${m.tabId}`]: { ...await tabOverride(m.tabId), origin, ...(m.enabled === undefined ? {} : { enabled: m.enabled }), ...(m.preset ? { preset: m.preset } : {}) } });
      await inject(m.tabId); await refresh(m.tabId); return true;
    }
    case 'ACTIVATE': await inject(m.tabId); await refresh(m.tabId); return true;
    case 'RESTORE': {
      const tab = await chrome.tabs.get(m.tabId);
      await chrome.storage.session.set({ [`tab:${m.tabId}`]: { origin: normalizeOrigin(tab.url!), enabled: false } });
      try { await chrome.tabs.sendMessage(m.tabId, { type: 'RESTORE_NOW' }); } catch { /* No styling to remove. */ } return true;
    }
    case 'READER': {
      await inject(m.tabId); await injectReader(m.tabId);
      const response = await chrome.tabs.sendMessage(m.tabId, { type: 'READER_TOGGLE' });
      if (!response?.ok) throw new Error(response?.error ?? 'Reader Mode could not open.'); return true;
    }
    case 'SYNC_PERMISSIONS': await syncPermissions(); return true;
  }
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || !validMessage(message)) { respond({ ok: false, error: 'Invalid Folio message.' }); return; }
  handle(message, sender).then(data => respond({ ok: true, data }), error => respond({ ok: false, error: error instanceof Error ? error.message : 'Folio could not complete this action.' })); return true;
});
chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.settings) { void refreshAll(); void schedule(); } if (area === 'session') void refreshAll(); });
chrome.permissions.onAdded.addListener(() => void syncPermissions());
chrome.permissions.onRemoved.addListener(() => { void syncPermissions(); void refreshAll(); });
chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === 'folio-boundary') { void refreshAll(); void schedule(); } });
chrome.runtime.onInstalled.addListener(() => { void loadSettings().then(s => chrome.storage.local.set({ settings: s })); void syncPermissions(); void schedule(); });
chrome.runtime.onStartup.addListener(() => { void syncPermissions(); void schedule(); });
chrome.tabs.onRemoved.addListener(tabId => void chrome.storage.session.remove(`tab:${tabId}`));
chrome.commands.onCommand.addListener(async command => {
  const tab = await activeTab(); if (!tab?.id || !supportedURL(tab.url).supported) return;
  try {
    await inject(tab.id);
    if (command === 'toggle-reader') { await injectReader(tab.id); const response = await chrome.tabs.sendMessage(tab.id, { type: 'READER_TOGGLE' }); if (!response?.ok) throw new Error(response?.error); }
    else {
      const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => matchMedia('(prefers-color-scheme: dark)').matches });
      const s = await currentState(tab, !!result.result);
      const preset = command === 'cycle-preset' ? PRESETS[(PRESETS.findIndex(p => p.id === s.preset) + 1) % PRESETS.length].id : undefined;
      await chrome.storage.session.set({ [`tab:${tab.id}`]: { origin: normalizeOrigin(tab.url!), ...(preset ? { preset } : { enabled: !s.enabled }) } }); await refresh(tab.id);
    }
    await chrome.action.setBadgeText({ tabId: tab.id, text: '' });
  } catch { await chrome.action.setBadgeText({ tabId: tab.id, text: '!' }); await chrome.action.setTitle({ tabId: tab.id, title: 'Folio could not act here. Open the popup for page access and Reader Mode guidance.' }); }
});
