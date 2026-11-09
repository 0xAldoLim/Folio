import React from 'react';
import { PRESETS } from '../themes/presets';
import type { CustomPreset } from '../shared/types';
export function Mark() { return <span className="mark" aria-hidden="true"><svg width="23" height="26" viewBox="0 0 24 28" fill="none"><path d="M5 24V5C5 3.9 5.9 3 7 3H20V22H7C5.9 22 5 22.9 5 24Zm0 0c0 1.1.9 2 2 2h13M9 8h7M9 12h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>; }
export function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    book: <><path d="M3 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H3zM21 4h-6a3 3 0 0 0-3 3v14a4 4 0 0 1 4-3h5z" /></>,
    settings: <><path d="M4 7h16M4 17h16M8 4v6M16 14v6" /></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    type: <><path d="M4 5h16M12 5v15M8 20h8" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><path d="m3 17 5-5 4 4 4-6 5 7"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    key: <><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M6 9h1m3 0h1m3 0h1m3 0h1M6 14h12"/></>,
    access: <><circle cx="12" cy="4" r="2"/><path d="m4 9 8 2 8-2M12 11v5m0 0-4 6m4-6 4 6"/></>,
    shield: <><path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6zM8 12l3 3 5-6"/></>,
    export: <><path d="M12 15V2m-4 4 4-4 4 4M4 13v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 10v7m0-11v1"/></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
    reset: <><path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/></>,
    check: <path d="m5 12 4 4L19 6"/>
  };
  return <svg className="icon" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name] ?? paths.info}</svg>;
}
export function Toggle({ label, checked, onChange, disabled = false }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) { return <button type="button" role="switch" aria-label={label} aria-checked={checked} disabled={disabled} className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}><span /></button>; }
export function Range({ label, value, min, max, step = 1, suffix = '', onChange, hint }: { label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void; hint?: string }) { return <label className="range-field"><span className="field-top"><span>{label}</span><output>{value}{suffix}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/>{hint && <small>{hint}</small>}</label>; }
export function PalettePicker({ value, custom = [], onChange }: { value: string; custom?: CustomPreset[]; onChange: (id: string) => void }) { return <div className="palette-grid" role="group" aria-label="Reading palette">{[...PRESETS, ...custom].map(p => <button type="button" key={p.id} aria-label={p.name} aria-pressed={value === p.id} className={`palette ${value === p.id ? 'selected' : ''}`} onClick={() => onChange(p.id)}><span className="swatch" style={{ background: p.background, color: p.text }}><span>Aa</span>{value === p.id && <span className="selected-dot"><Icon name="check"/></span>}<span className="swatch-lines" style={{ color: p.secondary }}><i/><i/></span></span><span className="palette-name">{p.name}</span></button>)}</div>; }
export function Check({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) { return <label className="check-field"><span><strong>{label}</strong>{description && <small>{description}</small>}</span><input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)}/></label>; }
