import { Readability, isProbablyReaderable } from '@mozilla/readability';
import { sanitizeArticle } from './sanitizer';
export interface Article { title: string; author: string | null; published: string | null; minutes: number; source: string; url: string; content: DocumentFragment }
export function extractArticle(doc: Document): Article {
  const clone = doc.cloneNode(true) as Document;
  clone.querySelectorAll('form,input,textarea,select,[contenteditable],[data-folio-owned]').forEach(el => el.remove());
  // A single strongly identified article can contain a long inner text wrapper.
  // Readability may choose that wrapper and discard neighboring figures/tables.
  // Retain the semantic article only when its title and text density corroborate it.
  const articles = [...clone.querySelectorAll('article')];
  const semantic = articles.length === 1 ? articles[0].cloneNode(true) as HTMLElement : undefined;
  const semanticTitle = semantic?.querySelector('h1')?.textContent?.trim();
  const semanticLength = semantic?.textContent?.trim().length ?? 0;
  const linkLength = [...semantic?.querySelectorAll('a') ?? []].reduce((n,a) => n + (a.textContent?.length ?? 0), 0);
  const reliableSemantic = !!semanticTitle && doc.title.toLowerCase().includes(semanticTitle.toLowerCase()) && semanticLength >= 600 && linkLength / semanticLength < .2;
  if (!isProbablyReaderable(clone, { minContentLength: 100, minScore: 10 })) throw new Error('This page does not contain a clear article. Try an individual story or documentation page. Your original page is intact.');
  const parsed = new Readability(clone, { charThreshold: 350, keepClasses: false }).parse();
  if (!parsed?.content || (parsed.textContent?.trim().length ?? 0) < 350) throw new Error('Folio could not confidently extract an article here. Open the full article and try again.');
  const url = new URL(doc.URL);
  if (reliableSemantic) semantic!.querySelectorAll('h1,nav,aside,footer,.byline').forEach(el => el.remove());
  const html = reliableSemantic ? semantic!.innerHTML : parsed.content;
  return { title: reliableSemantic ? semanticTitle! : parsed.title || doc.title || 'Article', author: parsed.byline ?? null, published: parsed.publishedTime ?? null, minutes: Math.max(1, Math.ceil(((reliableSemantic ? semantic!.textContent : parsed.textContent)?.split(/\s+/).length ?? 0) / 220)), source: parsed.siteName || url.hostname, url: url.href, content: sanitizeArticle(html, url.href) };
}
