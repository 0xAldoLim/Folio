import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFile, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
const work=resolve('work'),profile=resolve(work,`production-profile-${Date.now()}`),server=spawn(process.execPath,['scripts/test-server.mjs'],{stdio:'ignore',windowsHide:true});let context;
try{
  for(let i=0;i<40;i++){try{if((await fetch('http://127.0.0.1:4179/tests/fixtures/article.html')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  context=await chromium.launchPersistentContext(profile,{executablePath:process.env.FOLIO_CHROMIUM||chromium.executablePath(),headless:true,ignoreDefaultArgs:['--disable-extensions'],args:['--enable-unsafe-extension-debugging']});
  const cdp=await context.browser().newBrowserCDPSession();const{id}=await cdp.send('Extensions.loadUnpacked',{path:resolve('dist')});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4179/tests/fixtures/article.html');if(await page.locator('[data-folio-active]').count())throw Error('Production extension applied without activation.');
  await page.bringToFront();const{targetInfos}=await cdp.send('Target.getTargets',{filter:[{type:'tab'},{exclude:true}]});const target=targetInfos.find(t=>t.type==='tab'&&t.url===page.url());await cdp.send('Extensions.triggerAction',{id,targetId:target.targetId});await page.waitForSelector('html[data-folio-active=paper]');
  const ui=await context.newPage();await ui.goto(`chrome-extension://${id}/options.html`);await ui.waitForSelector('.settings-app');const permissions=await ui.evaluate(()=>chrome.permissions.getAll());if(permissions.origins?.length)throw Error('Unexpected persistent host grant.');
  const settings=await ui.evaluate(async()=>{const r=await chrome.runtime.sendMessage({type:'GET_SETTINGS'});return r.data;});await ui.evaluate(async s=>{const r=await chrome.runtime.sendMessage({type:'SAVE_SETTINGS',settings:{...s,preset:'dark'}});if(!r.ok)throw Error(r.error);},settings);await page.waitForSelector('html[data-folio-active=dark]');
  const result={passed:true,browser:context.browser().version(),manifest:'Unmodified dist/manifest.json',persistentHostGrants:permissions.origins??[],checks:['Fresh installation leaves page untouched','Real extension action triggered through Chrome DevTools grants activeTab','Actual action popup activates Natural Paper','Global setting switches activeTab-styled page to Dark Reading','No persistent host permission requested or granted']};await writeFile('validation/production-smoke.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await context?.close();server.kill();if(!profile.startsWith(work+sep))throw Error('Unsafe cleanup path');await rm(profile,{recursive:true,force:true});}
