import { it, expect } from 'vitest';
import { sanitizeArticle } from '../../src/reader/sanitizer';
import { extractArticle } from '../../src/reader/extractor';
it('removes scripts, handlers, styles, forms, unsafe media, and URLs', () => {
  const f=sanitizeArticle('<script>alert(1)</script><img src="javascript:x" onerror="x"><a href="data:text/html,x">x</a><form><input value="secret"></form><p style="color:red">Read me</p><svg onload="x"></svg><iframe src="https://evil.test"></iframe>','https://example.com/story'); const div=document.createElement('div');div.append(f);expect(div.querySelector('script,form,input,svg,iframe,[onerror],[style]')).toBeNull();expect(div.querySelector('img')?.hasAttribute('src')).toBe(false);expect(div.querySelector('a')?.hasAttribute('href')).toBe(false);
});
it('resolves relative URLs and protects outbound links',()=>{const f=sanitizeArticle('<img src="../photo.jpg"><a href="next">Read</a>','https://example.com/news/story');expect(f.querySelector('img')?.getAttribute('src')).toBe('https://example.com/photo.jpg');expect(f.querySelector('a')?.getAttribute('href')).toBe('https://example.com/news/next');expect(f.querySelector('a')?.getAttribute('rel')).toContain('noopener');});
it('rejects extraction without inventing content',()=>{document.body.innerHTML='<nav>Home Login</nav>';expect(()=>extractArticle(document)).toThrow(/article/);});
