import { mix, luminance, ensureContrast } from './color-utils';
import type { Resolved } from '../shared/types';
export const STYLE_ID = 'folio-page-styles';
export function themeCSS(s: Resolved): string {
  const p = s.palette, dark = luminance(p.background) < .25;
  const surface = mix(p.background, dark ? '#ffffff' : '#000000', .035);
  const raised = mix(p.background, dark ? '#ffffff' : '#000000', .065);
  const ink = s.appearance.accessibility ? ensureContrast(ensureContrast(ensureContrast(p.text, p.background), surface), raised) : p.text;
  const border = ensureContrast(mix(p.text, p.background, .72), p.background, 3);
  const safe = (c: string) => ensureContrast(c, raised);
  const dim = { off: 1, low: .9, medium: .75, high: .6 }[s.appearance.dimming];
  return `
html[data-folio-active] { color-scheme:${dark ? 'dark' : 'light'}; background:${p.background}!important; }
html[data-folio-active] [data-folio-role] { --folio-bg:${p.background}; --folio-text:${ink}; --folio-surface:${surface}; --folio-raised:${raised}; --folio-accent:${p.accent}; --folio-border:${border}; }
html[data-folio-active] :is([data-folio-role=base],[data-folio-role=surface]) { background-color:var(--folio-bg)!important; color:var(--folio-text)!important; border-color:var(--folio-border)!important; }
html[data-folio-active] [data-folio-role=surface] { background-color:var(--folio-surface)!important; }
html[data-folio-active] [data-folio-role=raised] { background-color:var(--folio-raised)!important; color:${ensureContrast(p.text, raised)}!important; border-color:var(--folio-border)!important; }
html[data-folio-active] [data-folio-role=text] { color:var(--folio-text)!important; }
html[data-folio-active] [data-folio-role=link] { color:var(--folio-accent)!important; text-decoration:underline; text-underline-offset:.15em; }
html[data-folio-active] [data-folio-role=control] { background-color:var(--folio-raised)!important; color:${ensureContrast(p.text, raised)}!important; border-color:var(--folio-border)!important; accent-color:var(--folio-accent); box-shadow:none; }
html[data-folio-active] [data-folio-role=control]::placeholder { color:${ensureContrast(p.secondary, raised)}!important; opacity:1; }
html[data-folio-active] [data-folio-role=table] { background-color:var(--folio-surface)!important; color:${ensureContrast(p.text, surface)}!important; border-color:var(--folio-border)!important; }
html[data-folio-active] [data-folio-role=code] { background-color:var(--folio-raised)!important; color:${ensureContrast(p.text, raised)}!important; border-color:var(--folio-border)!important; }
html[data-folio-active] [data-folio-role=danger] { background-color:${raised}!important; color:${safe(dark ? '#f6a7a0' : '#9a3028')}!important; border-color:currentColor!important; }
html[data-folio-active] [data-folio-role=success] { background-color:${raised}!important; color:${safe(dark ? '#a8ce9d' : '#34632d')}!important; border-color:currentColor!important; }
html[data-folio-active] [data-folio-role=warning] { background-color:${raised}!important; color:${safe(dark ? '#e4c08b' : '#785313')}!important; border-color:currentColor!important; }
html[data-folio-active] [data-folio-ink=warm] { color:${safe(dark ? '#eebca4' : '#894224')}!important; }
html[data-folio-active] [data-folio-ink=cool] { color:${safe(dark ? '#a5c8ec' : '#365e87')}!important; }
html[data-folio-active] [data-folio-ink=green] { color:${safe(dark ? '#accfa1' : '#3d6337')}!important; }
html[data-folio-active] [data-folio-ink=neutral] { color:${ensureContrast(p.secondary, raised)}!important; }
html[data-folio-active] [data-folio-role]:focus-visible { outline:2px solid var(--folio-accent)!important; outline-offset:3px; }
${dim !== 1 ? `html[data-folio-active] img:not([data-folio-preserve]) { filter:brightness(${dim})!important; }` : ''}
${s.preset === 'eink' && !s.appearance.protectGraphics ? 'html[data-folio-active] svg:not([data-folio-preserve]) { filter:grayscale(1); }' : ''}
@media (forced-colors:active) { html[data-folio-active] [data-folio-role] { forced-color-adjust:auto!important; } }
`;
}
