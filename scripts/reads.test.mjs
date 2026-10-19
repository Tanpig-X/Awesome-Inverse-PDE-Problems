import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../docs/reads.js', import.meta.url), 'utf8');
const endpoint = 'https://counterapi.com/api/tanpig-x.github.io/view/awesome-inverse-pde-problems';
const result = {value:27, ns:'tanpig-x.github.io', key:'awesome-inverse-pde-problems', action:'view'};
const production = {origin:'https://tanpig-x.github.io', pathname:'/Awesome-Inverse-PDE-Problems/', hostname:'tanpig-x.github.io'};
async function run({origin='http://127.0.0.1:8765', pathname='/', hostname='127.0.0.1', responses=[result], cached=null, storageBlocked=false, timeout=false}={}) {
  const calls=[], counts=[{},{}], labels=[{}], statuses=[{}], badges=[{dataset:{}},{dataset:{}}], writes=[];
  badges.forEach(b=>b.setAttribute=(k,v)=>b[k]=v);
  const elements={'[data-reads-count]':counts,'[data-reads-label]':labels,'[data-reads-status]':statuses};
  const context={
    location:{origin,pathname,hostname},
    document:{querySelectorAll:selector=>elements[selector],getElementById:id=>badges[id==='nav-reads-badge'?0:1]},
    AbortController,
    setTimeout:timeout ? fn=>setTimeout(fn,0) : setTimeout,
    clearTimeout,
    localStorage:{getItem:()=>{if(storageBlocked)throw Error('blocked');return cached;},setItem:(key,value)=>{if(storageBlocked)throw Error('blocked');writes.push({key,value:JSON.parse(value)});}},
    fetch:async(url,options)=>{
      const reply=responses[Math.min(calls.length,responses.length-1)];
      calls.push({url,options});
      if(timeout)return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('timeout'))));
      if(reply instanceof Error)throw reply;
      return {ok:reply!=='http-error',json:async()=>{if(reply==='bad-json')throw Error('invalid JSON');return reply;}};
    }
  };
  vm.runInNewContext(source,context);
  if(timeout)await new Promise(resolve=>setTimeout(resolve,25));
  else await new Promise(resolve=>setImmediate(resolve));
  return {calls,counts,labels,statuses,badges,writes};
}
test('local previews read the shared total without incrementing',async()=>{
  const r=await run();
  assert.equal(r.calls.length,1);
  assert.equal(r.calls[0].url,endpoint+'?readOnly=true');
  assert.equal(r.counts[0].textContent,'27');
  assert.match(r.badges[0].title,/not counted/);
});
test('production makes a single hit without readOnly, including path variants',async()=>{
  for(const pathname of ['/Awesome-Inverse-PDE-Problems/','/Awesome-Inverse-PDE-Problems/index.html','/Awesome-Inverse-PDE-problems/','/Awesome-Inverse-PDE-problems/index.html']) {
    const r=await run({...production,pathname});
    assert.equal(r.calls.length,1);
    assert.equal(r.calls[0].url,endpoint);
    assert.equal(r.calls[0].options.credentials,'omit');
    assert.equal(r.calls[0].options.referrerPolicy,'no-referrer');
    assert.equal(r.counts[0].textContent,r.counts[1].textContent);
  }
});
test('unrelated mirrors and repository paths never contact the counter',async()=>{
  for(const location of [{origin:'https://example.com',hostname:'example.com'},{...production,pathname:'/another-project/'}]) {
    const r=await run(location);
    assert.equal(r.calls.length,0);
    assert.equal(r.counts[0].textContent,'—');
  }
});
test('outages show the dated verified snapshot and never retry a hit',async()=>{
  const r=await run({...production,responses:[new Error('offline')]});
  assert.equal(r.calls.length,2);
  assert.equal(r.calls[0].url,endpoint);
  assert.equal(r.calls[1].url,endpoint+'?readOnly=true');
  assert.equal(r.counts[0].textContent,'16+');
  assert.equal(r.counts[1].textContent,'16+');
  assert.equal(r.badges[0].dataset.readsState,'saved');
  assert.equal(r.labels[0].textContent,'Reads (saved)');
  assert.match(r.statuses[0].textContent,/12 Oct 2026/);
  assert.match(r.badges[0].title,/may not be recorded/);
  assert.equal(r.writes.length,0);
});
test('read-only recovery restores live display without adding the snapshot',async()=>{
  const r=await run({...production,responses:['http-error',result]});
  assert.equal(r.calls.length,2);
  assert.equal(r.calls[1].url,endpoint+'?readOnly=true');
  assert.equal(r.counts[0].textContent,'27');
  assert.equal(r.badges[0].dataset.readsState,'ready');
  assert.equal(r.labels[0].textContent,'Reads');
  assert.equal(r.statuses[0].textContent,'');
  assert.equal(r.writes[0].value.value,27);
});
test('a cached server observation survives a later page load outage unchanged',async()=>{
  const first=await run({...production});
  assert.equal(first.writes.length,1);
  const saved=first.writes[0].value;
  assert.equal(saved.source,endpoint);
  const second=await run({...production,cached:JSON.stringify(saved),responses:[new Error('offline')]});
  assert.equal(second.counts[0].textContent,'27+');
  assert.equal(second.writes.length,0);
});
test('malformed or foreign cache entries do not replace the verified snapshot',async()=>{
  for(const cached of ['broken',JSON.stringify({value:999,source:'other',observedAt:'2026-10-13'}),JSON.stringify({value:-1,source:endpoint,observedAt:'2026-10-13'}),JSON.stringify({value:100,source:endpoint,observedAt:'2099-01-01'}),JSON.stringify({value:100,source:endpoint,observedAt:'invalid'})]) {
    const r=await run({cached,responses:['http-error']});
    assert.equal(r.counts[0].textContent,'16+');
  }
});
test('HTTP errors, invalid JSON, wrong identities and invalid values preserve saved state',async()=>{
  for(const reply of ['http-error','bad-json',null,{...result,value:-1},{...result,value:1.5},{...result,ns:'another-site'},{...result,key:'another-key'},{...result,action:'vote'}]) {
    const r=await run({responses:[reply]});
    assert.equal(r.counts[0].textContent,'16+');
    assert.equal(r.writes.length,0);
  }
});
test('blocked storage does not prevent live or saved rendering',async()=>{
  assert.equal((await run({storageBlocked:true})).counts[0].textContent,'27');
  assert.equal((await run({storageBlocked:true,responses:['http-error']})).counts[0].textContent,'16+');
});
test('timeouts are bounded and recovery remains read-only',async()=>{
  const r=await run({...production,timeout:true});
  assert.equal(r.calls.length,2);
  assert.equal(r.calls[1].url,endpoint+'?readOnly=true');
  assert.ok(r.calls.every(call=>call.options.signal.aborted));
  assert.equal(r.badges[0].dataset.readsState,'saved');
});
