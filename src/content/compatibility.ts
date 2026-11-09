export function supportedURL(url?: string): { supported: boolean; reason?: string } {
  try {
    const u = new URL(url ?? '');
    if (!['http:', 'https:'].includes(u.protocol)) return { supported: false, reason: 'Chrome protects this page. Open an ordinary http or https article to use Folio. Browser pages, local files, and the built-in PDF viewer are unavailable.' };
    if (u.hostname === 'chromewebstore.google.com' || (u.hostname === 'chrome.google.com' && u.pathname.startsWith('/webstore'))) return { supported: false, reason: 'Chrome does not allow extensions to change the Chrome Web Store.' };
    if (/\.pdf$/i.test(u.pathname)) return { supported: false, reason: 'The built-in PDF viewer cannot be restyled. Use Folio on the original HTML article.' };
    return { supported: true };
  } catch { return { supported: false, reason: 'This tab is unavailable. Open a website and try again.' }; }
}
