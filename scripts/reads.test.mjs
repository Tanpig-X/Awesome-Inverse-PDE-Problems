import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
const source = await readFile(new URL('../docs/reads.js', import.meta.url), 'utf8');
const endpoint = 'https://inverse-pde-reads.tiannini0707.chatgpt.site/api/reads';
const counterSource = 'inverse-pde-d1-v1';
const result = {success:true,reads:27,page:'https://tanpig-x.github.io/Awesome-Inverse-PDE-Problems/',source:counterSource,started_on:'2026-10-19'};
const production = {origin:'https://tanpig-x.github.io', pathname:'/Awesome-Inverse-PDE-Problems/', hostname:'tanpig-x.github.io'};
async function run({origin='http://127.0.0.1:8765', pathname='/', hostname='127.0.0.1', responses=[result], cached=null, storageBlocked=false, timeout=false}={}) {
  const calls=[], counts=[{},{}], labels=[{}], statuses=[{}], badges=[{dataset:{}},{dataset:{}}], writes=[];
  badges.forEach(b=>b.setAttribute=(k,v)=>b[k]=v);
  const elements={'[data-reads-count]':counts,'[data-reads-label]':labels,'[data-reads-status]':statuses};
  const context={
    location:{origin,pathname,hostname},
    document:{querySelectorAll:selector=>elements[selector],getElementById:id=>badges[id==='nav-reads-badge'?0:1]},
    AbortController, crypto:{randomUUID},
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
test('local previews read the shared total without a write',async()=>{
  const r=await run();assert.equal(r.calls.length,1);assert.equal(r.calls[0].url,endpoint);assert.equal(r.calls[0].options.method,'GET');assert.equal(r.counts[0].textContent,'27');assert.match(r.badges[0].title,/not counted/);
});
test('production records one event per document across canonical path variants',async()=>{
  for(const pathname of ['/Awesome-Inverse-PDE-Problems/','/Awesome-Inverse-PDE-Problems/index.html','/Awesome-Inverse-PDE-problems/']) {
    const r=await run({...production,pathname});assert.equal(r.calls.length,1);assert.equal(r.calls[0].options.method,'POST');
    const body=JSON.parse(r.calls[0].options.body);assert.equal(body.page,result.page);assert.match(body.eventId,/^[0-9a-f-]{36}$/);assert.equal(r.counts[0].textContent,r.counts[1].textContent);
    assert.equal(r.calls[0].options.credentials,'omit');assert.equal(r.calls[0].options.referrerPolicy,'no-referrer');
  }
});
test('new documents use different event IDs rather than a visitor identifier',async()=>{
  const a=await run(production),b=await run(production);assert.notEqual(JSON.parse(a.calls[0].options.body).eventId,JSON.parse(b.calls[0].options.body).eventId);
});
test('a failed hit is retried with exactly the same event ID',async()=>{
  const r=await run({...production,responses:[new Error('lost response'),result]});assert.equal(r.calls.length,2);assert.equal(r.calls[0].options.body,r.calls[1].options.body);assert.equal(r.counts[0].textContent,'27');
});
test('after failed writes, read-only recovery never adds the historical 16',async()=>{
  const r=await run({...production,responses:['http-error','http-error',result]});assert.deepEqual(r.calls.map(c=>c.options.method),['POST','POST','GET']);assert.equal(r.counts[0].textContent,'27');assert.equal(r.labels[0].textContent,'Reads');assert.match(r.statuses[0].textContent,/16.*excluded/);
});
test('unrelated mirrors and paths never contact the counter',async()=>{
  for(const loc of [{origin:'https://example.com',hostname:'example.com'},{...production,pathname:'/another-project/'}])assert.equal((await run(loc)).calls.length,0);
});
test('provider failure with no new-backend observation stays unknown',async()=>{
  const r=await run({...production,responses:['http-error']});assert.equal(r.counts[0].textContent,'—');assert.equal(r.badges[0].dataset.readsState,'unavailable');assert.equal(r.writes.length,0);assert.equal(r.calls.length,3);
});
test('cached new-backend counts survive outages without local increments',async()=>{
  const a=await run(production);const cached=JSON.stringify(a.writes[0].value);
  const r=await run({...production,cached,responses:['http-error']});assert.equal(r.counts[0].textContent,'27+');assert.equal(r.labels[0].textContent,'Reads (saved)');assert.equal(r.writes.length,0);
});
test('the old provider cache or corrupt values cannot become a new total',async()=>{
  for(const cached of ['bad-json',JSON.stringify({value:16,source:'https://counterapi.com/api/tanpig-x.github.io/view/awesome-inverse-pde-problems',observedAt:'2026-10-12'}),JSON.stringify({value:-1,source:counterSource,observedAt:new Date().toISOString()})])assert.equal((await run({cached,responses:['http-error']})).counts[0].textContent,'—');
});
test('invalid provider responses are never displayed or cached',async()=>{
  for(const reply of ['http-error','bad-json',null,{...result,reads:-1},{...result,reads:1.5},{...result,source:'other'},{...result,page:'other'},{...result,success:false}]) {
    const r=await run({responses:[reply]});assert.equal(r.counts[0].textContent,'—');assert.equal(r.writes.length,0);
  }
});
test('private browsing storage failures do not block real counts',async()=>{assert.equal((await run({storageBlocked:true})).counts[0].textContent,'27');});
test('timeouts are bounded and both writes carry the same ID',async()=>{
  const r=await run({...production,timeout:true});assert.equal(r.calls.length,3);assert.equal(r.calls[0].options.body,r.calls[1].options.body);assert.equal(r.calls[2].options.method,'GET');assert.ok(r.calls.every(c=>c.options.signal.aborted));
});
