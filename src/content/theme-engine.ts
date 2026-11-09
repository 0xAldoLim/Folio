import type { Resolved } from '../shared/types';
import { CANDIDATES, classify } from './dom-classifier';
import { observeChanges } from './mutation-handler';
import { themeCSS, STYLE_ID } from './style-manager';
export class ThemeEngine {
  private style?: HTMLStyleElement;
  private owned = new Map<Element, Map<string, string | null>>();
  private stop?: () => void;
  private rootOriginal: string | null = null;
  private active = false;
  private scanning?: ReturnType<typeof setTimeout>;
  stats = { classified: 0, batches: 0, switches: 0, initializationMs: 0, lastSwitchMs: 0 };
  private tag(el: Element, key: string, value: string) { let saved = this.owned.get(el); if (!saved) { saved = new Map(); this.owned.set(el, saved); } if (!saved.has(key)) saved.set(key, el.getAttribute(key)); if (el.getAttribute(key) !== value) el.setAttribute(key, value); }
  private classifyRoots(roots: Element[]) {
    const candidates = new Set<Element>();
    for (const root of roots) { if (root.matches(CANDIDATES)) candidates.add(root); for (const el of root.querySelectorAll(CANDIDATES)) candidates.add(el); }
    const items = [...candidates]; let at = 0;
    const batch = () => {
      if (!this.active) return;
      const start = performance.now(); let count = 0;
      while (at < items.length && count < 600 && performance.now() - start < 12) {
        const el = items[at++]; count++;
        if (!el.isConnected || this.owned.has(el)) continue;
        const role = classify(el); if (role) { this.tag(el, 'data-folio-role', role); this.stats.classified++; }
      }
      this.stats.batches++;
      if (at < items.length) this.scanning = setTimeout(batch, 0);
    };
    batch();
    // Syntax colors are grouped by hue; preserve token distinctions across both light and dark palettes.
    const tokens = new Set<Element>(); for (const root of roots) { if (root.matches('pre span[class],code span[class]')) tokens.add(root); root.querySelectorAll('pre span[class],code span[class]').forEach(el => tokens.add(el)); }
    for (const token of tokens) {
      if (this.owned.has(token) || token.closest('[data-folio-owned]')) continue;
      const css = getComputedStyle(token).color.match(/[\d.]+/g)?.map(Number);
      if (!css || css.length < 3) continue;
      const [r,g,b] = css; const spread = Math.max(r,g,b) - Math.min(r,g,b);
      this.tag(token, 'data-folio-ink', spread < 20 ? 'neutral' : r > g && r > b ? 'warm' : g > r && g > b ? 'green' : 'cool');
    }
  }
  apply(state: Resolved) {
    if (!state.enabled || matchMedia('(forced-colors: active)').matches) { this.destroy(); return; }
    const start = performance.now();
    if (!this.active) {
      this.active = true; this.rootOriginal = document.documentElement.getAttribute('data-folio-active');
      this.classifyRoots([document.body]);
      this.style = document.createElement('style'); this.style.id = STYLE_ID; this.style.setAttribute('data-folio-owned', ''); document.documentElement.append(this.style);
      this.stop = observeChanges(roots => this.classifyRoots(roots), () => { for (const el of this.owned.keys()) if (!el.isConnected) this.owned.delete(el); });
      this.stats.initializationMs = performance.now() - start;
    }
    document.documentElement.setAttribute('data-folio-active', state.preset);
    if (this.style) this.style.textContent = themeCSS(state);
    this.stats.switches++; this.stats.lastSwitchMs = performance.now() - start;
  }
  destroy() {
    if (!this.active) return;
    this.active = false; this.stop?.(); this.stop = undefined; clearTimeout(this.scanning); this.style?.remove(); this.style = undefined;
    for (const [el, saved] of this.owned) for (const [key, val] of saved) if (val === null) el.removeAttribute(key); else el.setAttribute(key, val);
    this.owned.clear();
    if (this.rootOriginal === null) document.documentElement.removeAttribute('data-folio-active'); else document.documentElement.setAttribute('data-folio-active', this.rootOriginal);
  }
}
