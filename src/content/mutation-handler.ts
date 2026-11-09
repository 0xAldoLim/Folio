export function observeChanges(onRoots: (roots: Element[]) => void, onPrune: () => void): () => void {
  const roots = new Set<Element>(); let timer: ReturnType<typeof setTimeout> | undefined;
  const observer = new MutationObserver(records => {
    let meaningful = false;
    for (const r of records) {
      if ((r.target as Element).closest?.('[data-folio-owned]')) continue;
      if (r.type === 'childList') { if (r.removedNodes.length) meaningful = true; for (const n of r.addedNodes) if (n instanceof Element && !n.hasAttribute('data-folio-owned')) { roots.add(n); meaningful = true; } }
      if (r.type === 'attributes' && r.target instanceof Element) { roots.add(r.target); meaningful = true; }
    }
    if (!meaningful) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { const batch = [...roots].filter(n => n.isConnected); roots.clear(); onPrune(); if (batch.length) onRoots(batch.filter(n => !batch.some(other => other !== n && other.contains(n)))); }, 90);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
  return () => { observer.disconnect(); clearTimeout(timer); roots.clear(); };
}
