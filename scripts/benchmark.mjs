import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
const root=resolve('.'),work=resolve('work'),dir=resolve(work,'benchmark-extension'),profile=resolve(work,`benchmark-profile-${Date.now()}`);
const server=spawn(process.execPath,['scripts/test-server.mjs'],{stdio:'ignore',windowsHide:true});
let browser;
try {
  for(let i=0;i<40;i++){try{const r=await fetch('http://127.0.0.1:4179/tests/fixtures/article.html');if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  await mkdir(dir,{recursive:true});await cp('dist',dir,{recursive:true});const manifest=JSON.parse(await readFile(`${dir}/manifest.json`,'utf8'));manifest.host_permissions=['http://127.0.0.1/*'];await writeFile(`${dir}/manifest.json`,JSON.stringify(manifest));
  browser=await chromium.launchPersistentContext(profile,{executablePath:process.env.FOLIO_CHROMIUM||chromium.executablePath(),headless:true,ignoreDefaultArgs:['--disable-extensions'],args:['--enable-unsafe-extension-debugging'],viewport:{width:1280,height:900}});
  const cdpBrowser=await browser.browser().newBrowserCDPSession();const{id}=await cdpBrowser.send('Extensions.loadUnpacked',{path:dir});const ui=await browser.newPage();await ui.goto(`chrome-extension://${id}/options.html`);await ui.waitForSelector('.settings-app');
  const send=m=>ui.evaluate(async m=>{const r=await chrome.runtime.sendMessage(m);if(!r?.ok)throw Error(r?.error);return r.data;},m);const settings=await send({type:'GET_SETTINGS'});await send({type:'SAVE_SETTINGS',settings:{...settings,enabled:false}});
  const rows=[];
  for(const count of [100,1500,6000]){
    const page=await browser.newPage();await page.goto('http://127.0.0.1:4179/tests/fixtures/article.html');await page.evaluate(count=>{const root=document.querySelector('#paragraphs');for(let i=0;i<count;i++){const wrap=document.createElement('div');wrap.className='benchmark-card';wrap.style.backgroundColor=i%2?'#ececec':'#252525';const p=document.createElement('p');p.textContent='A benchmark paragraph with ordinary content, a short line of text, and enough material to make the page scroll.';wrap.append(p);root.append(wrap);}},count);
    const tabId=await ui.evaluate(async url=>(await chrome.tabs.query({})).find(t=>t.url===url).id,page.url());
    const cdp=await browser.newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('HeapProfiler.collectGarbage');
    const metrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
    const baseline=await metrics();
    const activationStart=performance.now();await send({type:'SET_TAB',tabId,enabled:true});await page.waitForSelector('[data-folio-role=base]');await page.waitForFunction(n=>document.querySelectorAll('.benchmark-card[data-folio-role] > p[data-folio-role]').length===n,count);const settledActivationMs=performance.now()-activationStart;await page.waitForTimeout(350);
    const stats=()=>ui.evaluate(async tabId=>(await chrome.scripting.executeScript({target:{tabId},func:()=>globalThis.__folio.engine.stats}))[0].result,tabId);
    const start=await stats();await cdp.send('HeapProfiler.collectGarbage');const enabled=await metrics();const beforeIdle=await metrics();await page.waitForTimeout(1000);const afterIdle=await metrics();const afterIdleStats=await stats();
    const switches=[];for(let i=0;i<40;i++){await send({type:'SET_TAB',tabId,preset:i%2?'paper':'dark'});switches.push((await stats()).lastSwitchMs);}await page.waitForTimeout(200);await cdp.send('HeapProfiler.collectGarbage');const switched=await metrics();
    for(let i=0;i<40;i++)await send({type:'SET_TAB',tabId,preset:i%2?'paper':'dark'});await page.waitForTimeout(200);await cdp.send('HeapProfiler.collectGarbage');const switched80=await metrics();const beforeBurst=performance.now();await page.evaluate(()=>{const root=document.querySelector('#paragraphs');const f=document.createDocumentFragment();for(let i=0;i<1000;i++){const p=document.createElement('p');p.className='burst';p.textContent='New dynamic article content.';f.append(p);}root.append(f);});await page.waitForFunction(()=>document.querySelectorAll('.burst[data-folio-role]').length===1000);const mutationMs=performance.now()-beforeBurst;
    const frames=await page.evaluate(()=>new Promise(resolve=>{const deltas=[];let prev=performance.now();function step(now){deltas.push(now-prev);prev=now;scrollBy(0,30);if(deltas.length<60)requestAnimationFrame(step);else resolve(deltas.slice(1));}requestAnimationFrame(step);}));
    const sorted=switches.sort((a,b)=>a-b),fps=frames.sort((a,b)=>a-b);
    const row={containers:count,settledActivationMs,heapSecond40SwitchesDeltaBytes:switched80.JSHeapUsedSize-switched.JSHeapUsedSize,initializationMs:start.initializationMs,themeSwitchMedianMs:sorted[Math.floor(sorted.length/2)],themeSwitchP95Ms:sorted[Math.floor(sorted.length*.95)],addedJSHeapBytes:enabled.JSHeapUsedSize-baseline.JSHeapUsedSize,heapAfter40SwitchesDeltaBytes:switched.JSHeapUsedSize-enabled.JSHeapUsedSize,idleTaskDurationMs:(afterIdle.TaskDuration-beforeIdle.TaskDuration)*1000,idleClassificationBatches:afterIdleStats.batches-start.batches,mutation1000ParagraphsMs:mutationMs,scrollFrameP95Ms:fps[Math.floor(fps.length*.95)],styles:await page.locator('#folio-page-styles').count(),classified:(await stats()).classified};rows.push(row);console.log(JSON.stringify(row));await page.close();
  }
  const result={date:new Date().toISOString(),browser:await browser.browser().version(),platform:process.platform,architecture:process.arch,method:'Real MV3 extension in headless Chrome; test-only loopback host grant. JS heap after forced GC; idle renderer TaskDuration over 1s. CSS apply timings exclude next paint. Scroll uses 60 rAF frames; mutation includes Playwright round trips. No process RSS or power measurement.',rows};await writeFile('BENCHMARK.json',JSON.stringify(result,null,2));
}finally{await browser?.close();server.kill();if(!profile.startsWith(work+sep))throw Error('Unsafe cleanup path');await rm(profile,{recursive:true,force:true});}
