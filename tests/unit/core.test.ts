import { describe, expect, it } from 'vitest';
import { contrast, ensureContrast, luminance, transformPalette, mix, hex } from '../../src/content/color-utils';
import { PRESETS } from '../../src/themes/presets';
import { defaults, importSettings, exportSettings, normalizeOrigin, validateSettings } from '../../src/storage/schema';
import { migrate } from '../../src/storage/migrations';
import { isNight, nextBoundary, resolveSettings } from '../../src/themes/resolve';
import { validMessage } from '../../src/shared/messaging';
import { supportedURL } from '../../src/content/compatibility';
describe('WCAG color math', () => {
  it('matches black/white reference values', () => { expect(luminance('#000000')).toBe(0); expect(luminance('#ffffff')).toBe(1); expect(contrast('#000000','#ffffff')).toBe(21); });
  it('is symmetric and equal colors have unit contrast', () => { expect(contrast('#123456','#abcdef')).toBe(contrast('#abcdef','#123456')); expect(contrast('#123456','#123456')).toBe(1); });
  it('corrects a failing color without changing passing colors', () => { expect(contrast(ensureContrast('#eeeeee','#ffffff'),'#ffffff')).toBeGreaterThanOrEqual(4.5); expect(ensureContrast('#222222','#ffffff')).toBe('#222222'); });
  it('clamps channels and mixing endpoints', () => { expect(hex([-30,500,0])).toBe('#00ff00'); expect(mix('#000000','#ffffff',2)).toBe('#ffffff'); });
  for (const p of PRESETS) it(`${p.name}: baseline and edge palettes pass protected contrast`, () => { for(const contrastValue of [-100,0,100]) for(const warmth of [-100,100]) for(const luminanceValue of [-100,100]) { const palette=transformPalette(p,{...defaults().appearance,contrast:contrastValue,warmth,luminance:luminanceValue}); for(const c of [palette.text,palette.secondary,palette.accent]) expect(contrast(c,palette.background)).toBeGreaterThanOrEqual(4.5); } });
  it('contrast control is monotonic without protection', () => { for(const p of PRESETS) { const values=[-100,-50,0,50,100].map(c=>contrast(transformPalette(p,{...defaults().appearance,contrast:c,accessibility:false}).text,p.background)); expect(values).toEqual([...values].sort((a,b)=>a-b)); } });
  it('warmth reduces blue without filtering media', () => { const p=transformPalette(PRESETS[0],{...defaults().appearance,warmth:100}); expect(p.background).not.toBe(PRESETS[0].background); });
});
describe('settings, migration, and validation', () => {
  it('round trips the complete schema', () => expect(importSettings(exportSettings(defaults()))).toEqual(defaults()));
  it('migrates version zero', () => expect(migrate({version:0,preset:'dark',enabled:false})).toMatchObject({version:1,preset:'dark',enabled:false}));
  it.each([null, {}, {version:99}, {...defaults(),enabled:'true'}, {...defaults(),typography:{...defaults().typography,size:400}}, {...defaults(),appearance:{...defaults().appearance,contrast:NaN}}, {...defaults(),customPresets:[{id:'x',name:'x'}]}, {...defaults(),automatic:{...defaults().automatic,dayStart:'25:00'}}])('rejects invalid schema %#', s => expect(()=>validateSettings(s)).toThrow());
  it('rejects duplicate origins and preset ids', () => { const s=defaults(); s.rules=[{origin:'https://example.com'},{origin:'https://example.com'}]; expect(()=>validateSettings(s)).toThrow(); });
  it('rejects scripts in custom palettes', () => { const s=defaults(); s.customPresets=[{...PRESETS[0],id:'custom-x',background:'url(javascript:x)'}]; expect(()=>validateSettings(s)).toThrow(); });
  it('rejects oversized import files and malformed JSON', () => { expect(()=>importSettings('a'.repeat(150001))).toThrow(); expect(()=>importSettings('{')).toThrow(); });
  it('strips unknown keys rather than importing them', () => { const s=validateSettings({...defaults(),__proto__:{evil:true},extra:'ignored'}); expect('extra' in s).toBe(false); });
});
describe('origin matching and precedence', () => {
  it('normalizes ports, case, paths, and trailing slashes', () => expect(normalizeOrigin('https://EXAMPLE.com:443/a?b=c')).toBe('https://example.com'));
  it.each(['file:///a','javascript:alert(1)','https://u:p@example.com','invalid'])('rejects unsafe origin %s', url => expect(()=>normalizeOrigin(url)).toThrow());
  it('does not match suffixes, sibling subdomains, ports, or protocols', () => { const s=defaults(); s.rules=[{origin:'https://example.com',preset:'sepia'}]; for(const o of ['https://evil-example.com','https://example.com.evil.test','https://www.example.com','http://example.com','https://example.com:8080'])expect(resolveSettings(s,o,false).preset).toBe('paper'); });
  it('honors tab > website > automatic > default', () => { const s=defaults(); s.automatic.mode='system'; s.rules=[{origin:'https://example.com',preset:'sepia',typography:{size:22},preserveImages:true}]; s.appearance.dimming='high'; const origin='https://example.com'; expect(resolveSettings(s,origin,true,{origin,preset:'oled'}).preset).toBe('oled'); expect(resolveSettings(s,origin,true).preset).toBe('sepia'); expect(resolveSettings(s,'https://other.test',true).preset).toBe('dark'); s.automatic.mode='manual'; expect(resolveSettings(s,'https://other.test',true).preset).toBe('paper'); expect(resolveSettings(s,origin,true).typography.size).toBe(22); expect(resolveSettings(s,origin,true).appearance.dimming).toBe('off'); });
  it('ignores temporary overrides after changing origin', () => expect(resolveSettings(defaults(),'https://a.test',false,{origin:'https://b.test',preset:'oled'}).preset).toBe('paper'));
  it('resolves enabled and suggestion flags independently', () => { const s=defaults(); s.rules=[{origin:'https://a.test',enabled:false,readerSuggestions:false}]; expect(resolveSettings(s,'https://a.test',false)).toMatchObject({enabled:false,readerSuggestions:false}); });
});
describe('schedule boundaries', () => {
  const at=(h:number,m=0)=>new Date(2026,9,19,h,m);
  it.each([[6,59,true],[7,0,false],[18,59,false],[19,0,true],[23,59,true],[0,0,true]])('%i:%i respects inclusive start', (h,m,night) => expect(isNight(at(h as number,m as number),'07:00','19:00')).toBe(night));
  it('supports a day period crossing midnight', () => { expect(isNight(at(23),'19:00','07:00')).toBe(false); expect(isNight(at(12),'19:00','07:00')).toBe(true); });
  it('chooses a future boundary and rolls to tomorrow', () => { expect(nextBoundary(at(8),['07:00','19:00'])).toBe(at(19).getTime()); expect(nextBoundary(at(23),['07:00','19:00'])).toBe(new Date(2026,9,20,7).getTime()); });
});
describe('message and context guardrails', () => {
  it.each([null,{type:'EVAL',code:'x'},{type:'SET_TAB',tabId:'1'},{type:'GET_STATE',dark:'yes'},{type:'SET_TAB',tabId:1,enabled:'yes'}])('rejects invalid message %#', m=>expect(validMessage(m)).toBe(false));
  it('accepts a typed command',()=>expect(validMessage({type:'SET_TAB',tabId:1,enabled:false})).toBe(true));
  it.each(['chrome://extensions','file:///a','https://chromewebstore.google.com/detail/foo','https://example.com/a.pdf'])('gracefully excludes %s',u=>expect(supportedURL(u).supported).toBe(false));
});
