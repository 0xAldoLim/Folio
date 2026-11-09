import type { Message, Reply } from './types';
export async function request<T>(message: Message): Promise<T> {
  const reply: Reply<T> | undefined = await chrome.runtime.sendMessage(message);
  if (!reply) throw new Error('Folio could not connect. Reload the extension and try again.');
  if (!reply.ok) throw new Error(reply.error);
  return reply.data;
}
export function validMessage(value: unknown): value is Message {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  if (JSON.stringify(value).length > 150000) return false;
  switch (m.type) {
    case 'GET_STATE': case 'GET_CONTEXT': return typeof m.dark === 'boolean';
    case 'GET_SETTINGS': case 'SYNC_PERMISSIONS': return true;
    case 'SAVE_SETTINGS': return typeof m.settings === 'object';
    case 'PATCH_APPEARANCE': return !!m.patch && typeof m.patch === 'object' && !Array.isArray(m.patch);
    case 'SAVE_RULE': return !!m.rule && typeof m.rule === 'object';
    case 'REMOVE_RULE': return typeof m.origin === 'string';
    case 'SET_TAB': return Number.isInteger(m.tabId) && (m.enabled === undefined || typeof m.enabled === 'boolean') && (m.preset === undefined || typeof m.preset === 'string') && (m.clear === undefined || typeof m.clear === 'boolean');
    case 'ACTIVATE': case 'READER': case 'RESTORE': return Number.isInteger(m.tabId);
    case 'READER_PREF': return (m.preset === undefined || typeof m.preset === 'string') && (m.typography === undefined || !!m.typography && typeof m.typography === 'object');
    default: return false;
  }
}
