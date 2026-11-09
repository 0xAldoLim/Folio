import DOMPurify from 'dompurify';
export function sanitizeArticle(html: string, base: string): DocumentFragment {
  const fragment = DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true, ALLOWED_TAGS: ['p','div','section','article','h1','h2','h3','h4','h5','h6','a','img','figure','figcaption','blockquote','pre','code','span','strong','b','em','i','s','del','sup','sub','ul','ol','li','dl','dt','dd','table','thead','tbody','tfoot','tr','td','th','caption','hr','br','time','mark','kbd','abbr'], ALLOWED_ATTR: ['href','src','alt','title','width','height','colspan','rowspan','datetime','id','lang','dir'], ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false, FORBID_TAGS: ['style','script','svg','math','form','input','iframe','video','audio','object','embed'] });
  for (const el of fragment.querySelectorAll('[href],[src]')) {
    const attr = el.hasAttribute('href') ? 'href' : 'src'; const value = el.getAttribute(attr)!;
    if (attr === 'href' && value.startsWith('#')) continue;
    try {
      const url = new URL(value, base);
      if (!(attr === 'href' ? ['http:', 'https:', 'mailto:'] : ['http:', 'https:']).includes(url.protocol) || url.username || url.password) { el.removeAttribute(attr); continue; }
      el.setAttribute(attr, url.href);
      if (el.tagName === 'A') { el.setAttribute('rel', 'noopener noreferrer'); el.setAttribute('target', '_blank'); }
      if (el.tagName === 'IMG') { el.setAttribute('loading', 'lazy'); el.setAttribute('referrerpolicy', 'no-referrer'); }
    } catch { el.removeAttribute(attr); }
  }
  return fragment;
}
