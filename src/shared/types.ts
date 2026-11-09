export type PresetId = string;
export interface Palette { background: string; text: string; secondary: string; accent: string }
export interface CustomPreset extends Palette { id: string; name: string }
export interface Typography { font: 'system' | 'georgia' | 'arial' | 'verdana'; size: number; lineHeight: number; letterSpacing: number; paragraphSpacing: number; width: number; align: 'left' | 'justify' }
export interface Appearance { contrast: number; luminance: number; warmth: number; saturation: number; dimming: 'off' | 'low' | 'medium' | 'high'; protectGraphics: boolean; accessibility: boolean; texture: 'off' | 'subtle' | 'medium' }
export interface SiteRule { origin: string; enabled?: boolean; preset?: PresetId; typography?: Partial<Typography>; preserveImages?: boolean; readerSuggestions?: boolean }
export interface Automatic { mode: 'manual' | 'system' | 'schedule'; day: PresetId; night: PresetId; dayStart: string; nightStart: string }
export interface Settings { version: 1; enabled: boolean; preset: PresetId; appearance: Appearance; typography: Typography; automatic: Automatic; rules: SiteRule[]; customPresets: CustomPreset[] }
export interface TabOverride { origin: string; enabled?: boolean; preset?: PresetId }
export interface Resolved { enabled: boolean; preset: PresetId; palette: Palette; appearance: Appearance; typography: Typography; source: 'tab' | 'website' | 'automatic' | 'default'; readerSuggestions: boolean }
export interface Context { tabId?: number; origin?: string; supported: boolean; reason?: string; state?: Resolved; persistent: boolean; readerAvailable?: boolean }
export type Message =
  | { type: 'GET_STATE'; dark: boolean }
  | { type: 'GET_CONTEXT'; dark: boolean }
  | { type: 'GET_SETTINGS' }
  | { type: 'SAVE_SETTINGS'; settings: unknown }
  | { type: 'PATCH_APPEARANCE'; patch: Partial<Appearance> }
  | { type: 'SAVE_RULE'; rule: SiteRule }
  | { type: 'REMOVE_RULE'; origin: string }
  | { type: 'SET_TAB'; tabId: number; enabled?: boolean; preset?: string; clear?: boolean }
  | { type: 'ACTIVATE'; tabId: number }
  | { type: 'READER'; tabId: number }
  | { type: 'READER_PREF'; preset?: string; typography?: Partial<Typography> }
  | { type: 'SYNC_PERMISSIONS' }
  | { type: 'RESTORE'; tabId: number };
export type Reply<T = unknown> = { ok: true; data: T } | { ok: false; error: string };
export interface FolioRuntime { state?: Resolved; engine: { apply(state: Resolved): void; destroy(): void; stats: Record<string, number> }; refresh(): Promise<void>; subscribe(fn: (state: Resolved) => void): () => void; toggleReader?: () => Promise<void>; closeReader?: () => void }
declare global { var __folio: FolioRuntime | undefined }
