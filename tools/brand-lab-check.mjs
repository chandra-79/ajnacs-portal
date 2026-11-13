/* Optional isolated browser review. Reuses a local Playwright installation;
   no production dependency, external service or running preview is needed. */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const packagePath=process.env.AJNA_PLAYWRIGHT_PACKAGE || fileURLToPath(new URL('../../../InfiScroller/package.json',import.meta.url));
const {chromium,firefox,webkit}=createRequire(packagePath)('playwright');
const out=process.env.AJNA_BRAND_QA_OUTPUT || path.join(root,'output/playwright/brand-lab');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const server=createServer(async(req,res)=>{
  try{
    let file=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(file.endsWith('/'))file+='index.html';
    const full=path.resolve(root,'.'+file);
    if(!full.startsWith(root+path.sep))throw Error('outside root');
    const content=await readFile(full);res.writeHead(200,{'Content-Type':mime[path.extname(full)]||'application/octet-stream'});res.end(content);
  }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const results=[];
const variants=['facet','botanical','prism'];
const progress=(page,id)=>page.locator(`[data-variant="${id}"] svg`).evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.progress)));
const settle=(page,id,value)=>page.waitForFunction(({id,value})=>[...document.querySelectorAll(`[data-variant="${id}"] svg`)].every(n=>Number(n.dataset.progress)===value),{id,value},{timeout:6000});
try{
  for(const [engine,type]of Object.entries({chromium,firefox,webkit})){
    const browser=await type.launch({headless:true});
    try{
      for(const width of [390,1440])for(const reduced of [false,true]){
        const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:reduced?'reduce':'no-preference'});
        const page=await context.newPage(),errors=[];
        page.on('pageerror',e=>errors.push(e.message));
        page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
        const result={engine,width,reduced,checks:[],errors};
        try{
          await page.goto(base+'/brand-lab/');
          await page.waitForFunction(()=>document.querySelector('[data-variant] svg').hasAttribute('data-progress'));
          assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,nofollow');
          const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));
          assert.equal(new Set(ids).size,ids.length,'SVG definitions and controls have unique IDs');
          if(reduced){
            for(const id of variants)assert.deepEqual(await progress(page,id),[0,0]);
            assert.equal(await page.locator('#calm').isChecked(),true);
            result.checks.push('reduced arrival remains still');
          }else{
            await page.waitForFunction(()=>[...document.querySelectorAll('[data-variant] .large svg')].every(n=>Number(n.dataset.progress)>.8));
            for(const id of variants)await settle(page,id,0);
            result.checks.push('arrival opens and closes once');
          }
          await page.reload();
          if(reduced){await settle(page,'facet',0);result.checks.push('reload stays still with reduced motion');}
          else{
            await page.waitForFunction(()=>[...document.querySelectorAll('[data-variant] .large svg')].every(n=>Number(n.dataset.progress)>.8));
            for(const id of variants)await settle(page,id,0);
            result.checks.push('browser reload repeats exactly one arrival cycle');
          }
          for(const id of variants){
            const section=page.locator(`[data-variant="${id}"]`),large=section.locator('.large');
            await large.focus();await large.press('Enter');await settle(page,id,1);
            assert.equal(await large.getAttribute('aria-pressed'),'true');
            assert.equal(await section.locator('.small').getAttribute('aria-pressed'),'true');
            assert.equal(await section.locator('output').textContent(),'Open');
            await large.press('Space');await settle(page,id,0);
            await section.locator('.small').click();await settle(page,id,1);
            await section.locator('[data-action=toggle]').click();await settle(page,id,0);
            if(!reduced){
              await large.click();
              await page.waitForFunction(id=>{const p=Number(document.querySelector(`[data-variant="${id}"] svg`).dataset.progress);return p>.1&&p<.9;},id);
              const before=await progress(page,id);
              const after=await large.evaluate(button=>{button.click();return [...button.closest('section').querySelectorAll('svg')].map(n=>Number(n.dataset.progress));});
              assert.ok(Math.abs(after[0]-before[0])<.15,'mid-motion reversal does not snap');
              await settle(page,id,0);
            }
            result.checks.push(id+': Enter/Space, small control, target state, shared surfaces'+(!reduced?', continuous reversal':''));
          }
          if(!reduced){
            await page.locator('#replay').click();
            await page.waitForFunction(()=>Number(document.querySelector('[data-variant="facet"] svg').dataset.progress)>.1);
            await page.locator('[data-variant="facet"] .large').click();
            await page.locator('[data-variant="facet"] .large').click();
            await settle(page,'facet',1);
            await page.waitForTimeout(1300); // Must outlast the cancelled automatic-close timer.
            await settle(page,'facet',1);result.checks.push('manual input cancels arrival-close timer');
            await page.locator('#calm').check();
            for(const id of variants){
              await page.locator(`[data-variant="${id}"] [data-action=toggle]`).click();
              const p=await progress(page,id);assert.ok(p[0]===0||p[0]===1);assert.equal(p[0],p[1]);
            }
            result.checks.push('Still mode snaps synchronously without animation');
            await page.locator('#calm').uncheck();
            await page.emulateMedia({reducedMotion:'reduce'});
            await page.waitForFunction(()=>document.querySelector('#calm').checked);
            assert.equal(await page.locator('#calm').isChecked(),true);
            await page.locator('[data-variant="facet"] .large').click();
            const p=await progress(page,'facet');assert.ok(p[0]===0||p[0]===1);
            result.checks.push('live system reduced-motion change stops movement');
            await page.emulateMedia({reducedMotion:'no-preference'});
            await page.waitForFunction(()=>!document.querySelector('#calm').checked);
            result.checks.push('system preference does not latch the user Still setting');
            await page.locator('#calm').check();
            await page.emulateMedia({reducedMotion:'reduce'});
            await page.emulateMedia({reducedMotion:'no-preference'});
            assert.equal(await page.locator('#calm').isChecked(),true);
            result.checks.push('explicit user Still survives system preference changes');
          }
          for(const id of variants){
            if((await progress(page,id))[0]!==1){await page.locator(`[data-variant="${id}"] [data-action=toggle]`).click();await settle(page,id,1);}
          }
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal overflow');
          for(const link of await page.locator('.home,.sample-wordmark').all())assert.equal(await link.getAttribute('href'),'/');
          await page.locator('#theme').click();
          await page.screenshot({path:path.join(out,`${engine}-${width}-${reduced?'still':'motion'}.png`),fullPage:true});
          await page.locator('.sample-wordmark').first().click();assert.equal(new URL(page.url()).pathname,'/');
          const brand=page.locator('[data-ajna-motion]'),brandSvg=brand.locator('.ajna-mark');
          await brand.waitFor();
          const brandProgress=()=>brandSvg.evaluate(svg=>Number(svg.dataset.progress));
          const brandSettle=value=>page.waitForFunction(value=>Number(document.querySelector('[data-ajna-motion] .ajna-mark')?.dataset.progress)===value,value,{timeout:6000});
          assert.equal(await brand.locator('.am-leaf').count(),8);
          assert.equal(await page.locator('.site-footer .am-leaf').count(),0,'footer is a static resting mark');
          // System reduced motion may have been changed during the lab checks.
          await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});await page.reload();
          if(reduced)await brandSettle(0);
          else{
            await page.waitForFunction(()=>Number(document.querySelector('[data-ajna-motion] .ajna-mark')?.dataset.progress)>.8);
            await brandSettle(0);
          }
          await brand.focus();await brand.press('Enter');await brandSettle(1);
          assert.equal(await brand.getAttribute('aria-label'),'Close Ajna logo');
          await brand.press('Space');await brandSettle(0);
          assert.equal(await brand.getAttribute('aria-label'),'Open Ajna logo');
          if(!reduced){
            await brand.click();
            await page.waitForFunction(()=>{const p=Number(document.querySelector('[data-ajna-motion] .ajna-mark').dataset.progress);return p>.1&&p<.9;});
            const before=await brandProgress();
            const after=await brand.evaluate(button=>{button.click();return Number(button.querySelector('svg').dataset.progress);});
            assert.ok(Math.abs(after-before)<.15,'production reversal does not snap');await brandSettle(0);
            await page.reload();await page.waitForFunction(()=>Number(document.querySelector('[data-ajna-motion] .ajna-mark').dataset.progress)>.1);
            await brand.click();await brand.click();await brandSettle(1);await page.waitForTimeout(1300);await brandSettle(1);
            await page.emulateMedia({reducedMotion:'reduce'});
            await page.waitForTimeout(50);await brand.click();assert.equal(await brandProgress(),0);
          }
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
          await page.screenshot({path:path.join(out,`${engine}-${width}-${reduced?'still':'motion'}-production.png`)});
          await page.locator('.brand-home').click();assert.equal(new URL(page.url()).pathname,'/');
          result.checks.push('production B: 8 petals, static footer, reload cycle, keyboard, interruption, preference, home link');
          assert.deepEqual(errors,[]);result.checks.push('theme, no overflow, no browser errors, functioning home links');
          result.passed=true;
        }catch(error){result.passed=false;result.failure=error.stack;}
        finally{await context.close();results.push(result);await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2)+'\n');}
      }
    }finally{await browser.close();}
  }
}finally{await new Promise(resolve=>server.close(resolve));}
console.log(JSON.stringify(results.map(({engine,width,reduced,passed,failure})=>({engine,width,reduced,passed,failure})),null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
