import React, { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { extractArticle, type Article } from './extractor';
import { READER_CSS } from './styles';
import type { Resolved } from '../shared/types';
import { request } from '../shared/messaging';
import { PRESETS, FONTS } from '../themes/presets';
import { mix, ensureContrast } from '../content/color-utils';
let host: HTMLDivElement | undefined, modal: HTMLDialogElement | undefined, root: Root | undefined, focusBefore: Element | null, readerScroll = 0, readerURL = '';
function Reader({ article, initial, close }: { article: Article; initial: Resolved; close: () => void }) {
  const [state, setState] = useState(initial), [progress, setProgress] = useState(0), [error, setError] = useState('');
  const content = useRef<HTMLDivElement>(null), scroll = useRef<HTMLDivElement>(null);
  useEffect(() => globalThis.__folio?.subscribe(setState), []);
  useEffect(() => { content.current?.replaceChildren(article.content); const el = scroll.current!; el.scrollTop = readerScroll; const update = () => { readerScroll = el.scrollTop; setProgress(el.scrollHeight > el.clientHeight ? el.scrollTop / (el.scrollHeight - el.clientHeight) * 100 : 100); }; el.addEventListener('scroll', update, { passive: true }); update(); const resize = new ResizeObserver(update); resize.observe(content.current!); return () => { el.removeEventListener('scroll', update); resize.disconnect(); }; }, [article]);
  const pref = async (patch: { preset?: string; typography?: { size: number } }) => { try { await request({ type: 'READER_PREF', ...patch }); setError(''); } catch (e) { setError((e as Error).message); } };
  const fullscreen = async () => { try { if (document.fullscreenElement === host) await document.exitFullscreen(); else await host?.requestFullscreen(); } catch { setError('Fullscreen is unavailable here. Reader Mode remains open.'); } };
  const p = state.palette, t = state.typography, surface = mix(p.background, p.text, .05);
  const vars = { '--bg': p.background, '--text': p.text, '--muted': p.secondary, '--accent': p.accent, '--border': ensureContrast(mix(p.text, p.background, .75), p.background, 3), '--surface': surface, '--surface-text': state.appearance.accessibility ? ensureContrast(p.text, surface) : p.text, '--font': FONTS[t.font], '--size': `${t.size}px`, '--line': t.lineHeight, '--spacing': `${t.letterSpacing}px`, '--paragraph': `${t.paragraphSpacing}em`, '--width': `${t.width}ch`, '--align': t.align, '--grain': { off: 0, subtle: .045, medium: .085 }[state.appearance.texture], '--dim': `brightness(${{ off: 1, low: .9, medium: .75, high: .6 }[state.appearance.dimming]})` } as React.CSSProperties;
  return <div className="room" style={vars}>
    <header className="bar"><div className="brand">ƒolio <small>Reading room</small></div><div className="tools"><select aria-label="Reading palette" value={state.preset} onChange={e => void pref({ preset: e.target.value })}>{PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}{!PRESETS.some(p => p.id === state.preset) && <option value={state.preset}>Custom palette</option>}</select><button aria-label="Decrease text size" disabled={t.size <= 14} onClick={() => void pref({ typography: { size: Math.max(14, t.size - 1) } })}>A−</button><button aria-label="Increase text size" disabled={t.size >= 24} onClick={() => void pref({ typography: { size: Math.min(24, t.size + 1) } })}>A+</button><button onClick={() => void fullscreen()}>Fullscreen</button><button className="close" onClick={close}>Back to website <span aria-hidden="true">↗</span></button></div></header>
    <progress className="progress" value={progress} max={100} aria-label="Reading progress" />
    <div className={`scroll ${state.appearance.texture !== 'off' ? 'texture' : ''}`} ref={scroll} tabIndex={0} aria-label="Article scroll area"><article><div className="eyebrow">{article.source} · {article.minutes} min read</div><h1>{article.title}</h1><div className="meta">{article.author && <span>{article.author} · </span>}{article.published && !Number.isNaN(Date.parse(article.published)) && <span>{new Date(article.published).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} · </span>}<a href={article.url} target="_blank" rel="noopener noreferrer">Original article ↗</a></div><div role="status">{error}</div><div className="content" ref={content} onClick={e => { const a = (e.target as Element).closest('a'); const href = a?.getAttribute('href'); if (href?.startsWith('#')) { e.preventDefault(); const target = [...content.current!.querySelectorAll('[id]')].find(el => el.id === decodeURIComponent(href.slice(1))); target?.scrollIntoView({ block: 'start' }); } }} /><footer className="hint">Take your time. The web can wait.<br /><br />Esc to return · Alt + Shift + R to toggle Reader Mode</footer></article></div>
  </div>;
}
async function close() {
  const current = host; host = undefined; root?.unmount(); root = undefined;
  if (document.fullscreenElement === current) await document.exitFullscreen().catch(() => {});
  modal?.close(); modal = undefined; current?.remove(); if (focusBefore instanceof HTMLElement && focusBefore.isConnected) focusBefore.focus({ preventScroll: true });
}
if (globalThis.__folio && !globalThis.__folio.toggleReader) {
  globalThis.__folio.closeReader = () => void close();
  globalThis.__folio.toggleReader = async () => {
    if (host) { await close(); return; }
    await globalThis.__folio!.refresh();
    const initial = globalThis.__folio!.state; if (!initial) throw new Error('Folio is unavailable on this page.');
    const article = extractArticle(document); // Extraction failure does not touch the original page.
    if (readerURL !== document.URL) { readerURL = document.URL; readerScroll = 0; }
    focusBefore = document.activeElement;
    host = document.createElement('div'); host.setAttribute('data-folio-owned', 'reader');
    const shadow = host.attachShadow({ mode: 'open' }); const style = document.createElement('style'); style.textContent = READER_CSS; shadow.append(style);
    modal = document.createElement('dialog'); modal.className = 'modal'; modal.setAttribute('aria-label', 'Folio Reader Mode'); shadow.append(modal); document.documentElement.append(host);
    modal.addEventListener('cancel', e => { e.preventDefault(); void close(); });
    root = createRoot(modal); root.render(<Reader article={article} initial={initial} close={() => void close()} />); modal.showModal();
  };
}
