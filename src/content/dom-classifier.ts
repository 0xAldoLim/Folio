export const CANDIDATES = 'body,main,article,section,header,footer,nav,aside,div,p,h1,h2,h3,h4,h5,h6,li,dt,dd,figcaption,blockquote,a,table,caption,thead,tbody,tr,td,th,pre,code,form,fieldset,legend,output,details,button,input:not([type=password]):not([type=hidden]),textarea,select,label,summary,dialog,[role=dialog],[role=alert],[role=status],span';
const PROTECTED = 'svg,canvas,video,iframe,[contenteditable],input[type=password],[data-folio-owned],[data-folio-preserve],[data-folio-role=preserve],.monaco-editor,.CodeMirror,.cm-editor';
export type Role = 'base' | 'surface' | 'raised' | 'text' | 'link' | 'control' | 'table' | 'code' | 'danger' | 'success' | 'warning' | 'muted' | 'preserve';
function textRole(el: Element): Role {
  const css = getComputedStyle(el);
  if (css.backgroundImage !== 'none') return 'preserve';
  return css.backgroundColor !== 'rgba(0, 0, 0, 0)' && css.backgroundColor !== 'transparent' ? 'surface' : 'text';
}
export function classify(el: Element): Role | undefined {
  if (el.closest(PROTECTED)) return;
  const tag = el.tagName.toLowerCase();
  const semantic = `${el.getAttribute('role') ?? ''} ${el.getAttribute('class') ?? ''}`;
  if (/\b(error|danger|alert-error|alert-danger)\b/i.test(semantic)) return 'danger';
  if (/\b(success|alert-success)\b/i.test(semantic)) return 'success';
  if (/\b(warning|alert-warning)\b/i.test(semantic) || el.getAttribute('role') === 'alert') return 'warning';
  if (el.parentElement?.closest('[data-folio-role=danger],[data-folio-role=success],[data-folio-role=warning],pre,code')) return;
  if (['body', 'main', 'article'].includes(tag)) return 'base';
  if (['form', 'fieldset', 'details'].includes(tag)) return getComputedStyle(el).backgroundImage === 'none' ? 'surface' : 'preserve';
  if (tag === 'a') return 'link';
  if (['input', 'button', 'textarea', 'select', 'summary'].includes(tag) || el.getAttribute('role') === 'button') return 'control';
  if (['pre', 'code'].includes(tag)) return 'code';
  if (['table', 'td', 'th'].includes(tag)) return 'table';
  if (tag === 'dialog' || el.getAttribute('role') === 'dialog') return 'raised';
  if (['nav', 'aside', 'header', 'footer', 'thead'].includes(tag)) return 'raised';
  if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'dt', 'dd', 'label', 'legend', 'output', 'caption', 'figcaption', 'blockquote'].includes(tag)) return textRole(el);
  if (tag === 'span' && !el.children.length && el.textContent?.trim()) return textRole(el);
  if (['div', 'section', 'tbody', 'tr'].includes(tag)) {
    const css = getComputedStyle(el);
    // Preserve photographic/background-image surfaces and their original foreground.
    if (css.backgroundImage !== 'none') return 'preserve';
    if (css.backgroundColor !== 'rgba(0, 0, 0, 0)' && css.backgroundColor !== 'transparent') return 'surface';
    if (el.childNodes.length < 8 && [...el.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())) return 'text';
  }
}
