import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../docs/reads.js', import.meta.url), 'utf8');
async function run({origin='http://127.0.0.1:8765',pathname='/',hostname='127.0.0.1',result={value:27,ns:'tanpig-x.github.io',key:'awesome-inverse-pde-problems',action:'view'},fail=false}={}) {
  const calls=[], counts=[{},{}], badges=[{dataset:{}},{dataset:{}}];
  badges.forEach(b=>b.setAttribute=(k,v)=>b[k]=v);
  const context={location:{origin,pathname,hostname},document:{querySelectorAll:()=>counts,getElementById:id=>badges[id==='nav-reads-badge'?0:1]},AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>{calls.push({url,options});if(fail)throw Error('offline');return {ok:true,json:async()=>result};}};
  vm.runInNewContext(source,context);
  await new Promise(resolve=>setImmediate(resolve));
  return {calls,counts,badges};
}
test('local previews read the real total without incrementing',async()=>{const r=await run();assert.equal(r.calls.length,1);assert.match(r.calls[0].url,/readOnly=true$/);assert.equal(r.counts[0].textContent,'27');assert.match(r.badges[0].title,/not counted/);});
test('production omits readOnly entirely so visits increment',async()=>{
  for(const pathname of ['/Awesome-Inverse-PDE-Problems/','/Awesome-Inverse-PDE-Problems/index.html','/Awesome-Inverse-PDE-problems/','/Awesome-Inverse-PDE-problems/index.html']) {
    const r=await run({origin:'https://tanpig-x.github.io',pathname,hostname:'tanpig-x.github.io'});
    assert.equal(r.calls.length,1);
    assert.equal(r.calls[0].url,'https://counterapi.com/api/tanpig-x.github.io/view/awesome-inverse-pde-problems');
    assert.equal(r.calls[0].options.credentials,'omit');
    assert.equal(r.calls[0].options.referrerPolicy,'no-referrer');
    assert.equal(r.counts[0].textContent,r.counts[1].textContent);
  }
});
test('unrelated mirrors and repository paths never increment',async()=>{assert.equal((await run({origin:'https://example.com',hostname:'example.com'})).calls.length,0);assert.equal((await run({origin:'https://tanpig-x.github.io',hostname:'tanpig-x.github.io',pathname:'/another-project/'})).calls.length,0);});
test('failures never fall back to a fake zero or retry',async()=>{const r=await run({fail:true});assert.equal(r.counts[0].textContent,'—');assert.equal(r.calls.length,1);assert.equal(r.badges[0].dataset.readsState,'unavailable');});
test('wrong identities and invalid values cannot be shown',async()=>{for(const result of [{value:-1},{value:1,ns:'another-site'},null]) {const r=await run({result});assert.equal(r.counts[0].textContent,'—');}});
