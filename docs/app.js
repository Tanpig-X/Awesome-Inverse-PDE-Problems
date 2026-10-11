'use strict';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const taskNames = {all:'All studies', inverse_problems:'Inverse problems', inverse_design:'Inverse design', control:'Control problems', cross_task:'Across tasks'};
const taskCodes = {inverse_problems:'IP', inverse_design:'ID', control:'C', cross_task:'IP / ID / C'};
const citation = `@misc{tan2026harnessingaiinversepartial,
  title = {Harnessing AI for Inverse Partial Differential
           Equation Problems: Past, Present, and Prospects},
  author = {Tan, Zhentao and Hao, Yuze and Zou, Boyi and
            Long, Mingsheng and Yang, Yi and Bao, Gang},
  year = {2026},
  eprint = {2605.16966},
  archivePrefix = {arXiv},
  primaryClass = {cs.AI},
  url = {https://arxiv.org/abs/2605.16966}
}`;
let data, visibleLimit = 24, libraryLayout = 'grid', matrixTask = 'all', toastTimer, searchTimer;
const safeURL = value => { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
const paperURL = method => safeURL(method.url) || 'https://scholar.google.com/scholar?q=' + encodeURIComponent(method.title);
const hasCode = method => Boolean(safeURL(method.code_url));
const paperDate = method => method.first_published || `${method.year}-01-01`;
const paperLabel = method => safeURL(method.url) ? 'Paper ↗' : 'Find paper ↗';
const externalLink = (url, text, cls = '') => `<a class="${cls}" href="${escapeHTML(safeURL(url))}" target="_blank" rel="noopener">${escapeHTML(text)}</a>`;

function route() {
  const [hash, query = ''] = location.hash.slice(1).split('?');
  const view = hash.replace('view-', '') || 'overview';
  return {view: ['overview','gallery','results','applicability'].includes(view) ? view : 'overview', params: new URLSearchParams(query)};
}
function setRoute(view, params = {}) {
  const p = new URLSearchParams(Object.entries(params).filter(([,v]) => v && v !== 'all' && v !== 'featured'));
  const next = `#view-${view}${p.size ? '?' + p.toString() : ''}`;
  if (location.hash === next) renderRoute(); else location.hash = next;
}
function updateLibraryRoute(replace = false) {
  const {params} = route();
  const values = {task:params.get('task'), q:$('#method-search').value.trim(), family:$('#family-filter').value, year:$('#year-filter').value, sort:$('#sort-methods').value, code:$('#code-filter').value, collection:$('#collection-filter').value};
  if (replace) {
    const p = new URLSearchParams(Object.entries(values).filter(([,v])=>v && !['all','featured'].includes(v)));
    history.replaceState(null, '', '#view-gallery' + (p.size ? '?' + p.toString() : ''));
    renderLibrary(false);
  } else setRoute('gallery', values);
}
function renderRoute() {
  const {view} = route();
  const previous = $$('.view').find(el=>!el.hidden)?.id;
  $$('.view').forEach(el => { el.hidden = el.id !== `view-${view}`; });
  $$('.topnav a').forEach(el => { if (el.dataset.view === view) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current'); });
  if (previous && previous !== `view-${view}`) window.scrollTo({top:0,behavior:'instant'});
  if (view === 'overview') {
    const section = route().params.get('section');
    if (['abstract','framework','taxonomy','resources','citation'].includes(section)) requestAnimationFrame(()=>document.getElementById(section).scrollIntoView({block:'start'}));
    $$('.paper-toc a').forEach(a=>a.classList.toggle('current',a.hash.endsWith('section='+section)));
  }
  if (!data) return;
  if (view === 'gallery') {visibleLimit=24;renderLibrary(true);}
  if (view === 'results') renderResults();
  if (view === 'applicability') renderMatrix();
}

function renderLibrary(syncInputs) {
  const {params} = route();
  const task = Object.hasOwn(taskNames,params.get('task')) ? params.get('task') : 'all';
  const query = params.get('q') || '';
  const family = params.get('family') || 'all';
  const year = params.get('year') || 'all';
  const sort = params.get('sort') || 'featured';
  const code = params.get('code') || 'all';
  const collection = params.get('collection') || 'all';
  const all = data.methods.records;
  if (syncInputs) {
    $('#method-search').value = query;
    const pool = all.filter(m=>task==='all' || m.task===task);
    $('#family-filter').innerHTML = '<option value="all">All families</option>' + [...new Set(pool.map(m=>m.family))].sort().map(v=>`<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`).join('');
    $('#year-filter').innerHTML = '<option value="all">All years</option>' + [...new Set(pool.map(m=>m.year))].sort((a,b)=>b-a).map(v=>`<option value="${v}">${v}</option>`).join('');
    $('#family-filter').value = family;
    if (!$('#family-filter').value) $('#family-filter').value='all';
    $('#code-filter').value=code==='available'?'available':'all';
    $('#collection-filter').value=['survey','companion'].includes(collection)?collection:'all';
    $('#year-filter').value=year;
    if (!$('#year-filter').value) $('#year-filter').value='all';
    $('#sort-methods').value=sort;
    if (!$('#sort-methods').value) $('#sort-methods').value='featured';
  }
  $('#task-directory').innerHTML = Object.entries(taskNames).map(([key,name])=>{
    const pool=all.filter(m=>m.task===key);
    const selected=task===key;
    const families=key==='all'?'':`<div class="directory-family">${[...new Set(pool.map(m=>m.family))].sort().map(f=>`<button class="family-button" data-family-task="${key}" data-library-family="${escapeHTML(f)}" aria-pressed="${selected&&family===f}">${escapeHTML(f)}<span>${pool.filter(m=>m.family===f).length}</span></button>`).join('')}</div>`;
    return `<div class="directory-group"><button class="directory-button" data-library-task="${key}" aria-pressed="${selected&&family==='all'}">${escapeHTML(name)}<span>${key==='all'?all.length:pool.length}</span></button>${families}</div>`;
  }).join('');
  $$('.archive-scope [data-library-task]').forEach(button=>{button.classList.toggle('selected',button.dataset.libraryTask===task);button.setAttribute('aria-pressed',String(button.dataset.libraryTask===task));});
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const found = all.filter(m=>(task==='all'||m.task===task)&&(family==='all'||m.family===family)&&(year==='all'||String(m.year)===year)&&(code!=='available'||hasCode(m))&&(collection==='all'||(collection==='companion'?m.collection==='companion':m.collection!=='companion'))&&terms.every(term=>[m.name,m.title,m.authors,m.description,m.family,taskNames[m.task]].join(' ').toLocaleLowerCase().includes(term)));
  found.sort((a,b)=> sort==='added' ? (b.added_at||'').localeCompare(a.added_at||'')||paperDate(b).localeCompare(paperDate(a))||a.name.localeCompare(b.name) : sort==='newest' ? b.year-a.year||paperDate(b).localeCompare(paperDate(a))||a.name.localeCompare(b.name) : sort==='oldest' ? a.year-b.year||a.name.localeCompare(b.name) : sort==='name' ? a.name.localeCompare(b.name) : Number(b.featured)-Number(a.featured)||b.year-a.year||a.name.localeCompare(b.name));
  $('#method-count').textContent=`${found.length} ${found.length===1?'study':'studies'}${task==='all'?' across all tasks':' in '+taskNames[task].toLowerCase()}${found.length>visibleLimit?` · showing ${visibleLimit}`:''}`;
  $('#method-grid').className='method-grid'+(libraryLayout==='list'?' list':'');
  $('#method-grid').innerHTML=found.slice(0,visibleLimit).map(m=>`<article class="method-card" data-task="${m.task}"><div class="method-card-top"><span class="method-tag">${escapeHTML(taskNames[m.task])}</span><span class="method-year">${m.year}</span></div><div class="method-content"><div class="method-category">${escapeHTML(m.family)}${m.collection==='companion'?'<span class="addition-label">ADDED</span>':''}</div><h2><button class="method-title-button" data-method="${escapeHTML(m.id)}">${escapeHTML(m.name)}</button></h2><p class="method-paper-title">${escapeHTML(m.title)}</p>${m.description?`<div class="method-insight">${escapeHTML(m.description)}</div>`:`<div class="method-location">Survey section ${escapeHTML(m.section)}</div>`}<div class="method-footer">${externalLink(paperURL(m),paperLabel(m))}${hasCode(m)?externalLink(m.code_url,'Code ↗','code-link'):''}<button data-method="${escapeHTML(m.id)}" aria-label="Details for ${escapeHTML(m.name)}">Details ↗</button></div></div></article>`).join('');
  $('#empty-methods').hidden=found.length>0;
  $('#show-more').hidden=found.length<=visibleLimit;
  $('#show-more').textContent=`Show ${Math.min(24,Math.max(0,found.length-visibleLimit))} more studies`;
}
function showMethod(id) {
  const m=data.methods.records.find(m=>m.id===id);
  if (!m) return;
  $('#dialog-content').innerHTML=`<div class="section-kicker">${escapeHTML(taskNames[m.task])} · ${m.year}</div><h2 id="dialog-title" class="dialog-title">${escapeHTML(m.name)}</h2><p class="dialog-paper-title">${escapeHTML(m.title)}</p><p class="dialog-authors">${escapeHTML(m.authors).replace(/ and /g,' · ')}</p>${m.description?`<p class="dialog-description">${escapeHTML(m.description.replace(/[.!?]$/,''))}.</p>`:''}<div class="dialog-meta"><span>${escapeHTML(m.family)}</span><span>${m.collection==='companion'?'Companion addition · '+escapeHTML(m.added_at):'Survey section '+escapeHTML(m.section)}</span>${m.publication_status?`<span>${escapeHTML(m.publication_status)}</span>`:''}${m.last_revised?`<span>Revised ${escapeHTML(m.last_revised)}</span>`:''}${m.featured?'<span>Selected timeline milestone</span>':''}</div><div class="dialog-actions">${externalLink(paperURL(m),safeURL(m.url)?'Read the paper ↗':'Find the paper ↗','button primary')}${hasCode(m)?externalLink(m.code_url,'Official code ↗','button code-button'):''}<button class="button" data-copy-record="${escapeHTML(m.id)}">Copy reference</button></div><p class="code-provenance">${hasCode(m)?`Code link verified ${escapeHTML(m.code_checked_at)} against ${externalLink(m.code_source,'the author-associated source')}. ${escapeHTML(m.code_note||'Availability has been checked. Results have not been independently reproduced.')}`:m.code_status==='Unavailable at verification'?`The author-listed repository was unavailable when checked on ${escapeHTML(m.code_checked_at)}.`:'No official code link has been verified in this index yet.'}</p>`;
  $('#method-dialog').showModal();
}
const protocolShortNames = {pinnacle_pinv:'Poisson recovery · PInv',pinnacle_hinv:'Diffusion recovery · HInv',cindm_one:'One-airfoil design',cindm_two:'Two-airfoil design',burgers_pofc:'Burgers control · PO-FC',pdeinv_ns_compute:'Navier–Stokes compute',pdeinv_darcy_compute:'Darcy compute'};
function formatValue(value, includeUnit = false) {
  if (!value || value.status==='NA') return '<span class="value-na">–</span>';
  if (value.status==='NR' || value.value==null) return '<span class="value-na">NR</span>';
  let out=escapeHTML(value.value);
  if (value.std) out+=`<small>± ${escapeHTML(value.std)}</small>`;
  if (includeUnit && value.unit) out+=`<small>${escapeHTML(value.unit)}</small>`;
  return out;
}
function renderResults() {
  const {params}=route();
  const protocol=Object.hasOwn(data.protocols,params.get('protocol'))?params.get('protocol'):'pinnacle_pinv';
  $('#protocol-directory').innerHTML=Object.entries(data.protocols).map(([key,p],i)=>`${[0,2,4,5].includes(i)?`<div class="directory-title">${i===5?'Efficiency profiles':escapeHTML(taskNames[p.task_class])}</div>`:''}<button class="directory-button" data-protocol="${key}" aria-pressed="${key===protocol}">${escapeHTML(protocolShortNames[key])}<span>${data.results.records.filter(r=>r.protocol_id===key).length}</span></button>`).join('');
  const p=data.protocols[protocol], source=data.sources[p.source_id], rows=data.results.records.filter(r=>r.protocol_id===protocol), compute=p.metrics.length===0, second=p.metrics.length>1;
  const metricHeader=protocol.startsWith('pinnacle')?'Relative L₂ error ↓':protocol.startsWith('cindm')?'−lift + drag ↓':'J actual ↓';
  $('#protocol-content').innerHTML=`<div class="protocol-header"><div><div class="protocol-badge">${compute?'Computational efficiency':escapeHTML(taskNames[p.task_class])} · ${rows.length} methods</div><h2>${escapeHTML(p.title)}</h2><p>${escapeHTML(source.version)}</p></div>${externalLink(source.url,'Original source ↗','protocol-source')}</div><div class="protocol-metrics">${(compute?['Compute-only records. Accuracy is not inferred.']:p.metrics).map(t=>`<span class="metric-description">${escapeHTML(t)}</span>`).join('')}</div><div class="table-scroll" tabindex="0" role="region" aria-label="${escapeHTML(p.title)} results"><table><caption class="sr-only">Literature-reported results for ${escapeHTML(p.title)}</caption><thead><tr><th scope="col">Method</th>${!compute?`<th scope="col">${metricHeader}</th>`:''}${second?'<th scope="col">Lift / drag ↑</th>':''}<th scope="col">${compute?'Training cost':'Offline cost'}</th><th scope="col">${compute?'Batch throughput':'Online cost'}</th>${compute?'<th scope="col">Memory</th>':''}<th scope="col">Source location</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${escapeHTML(r.method)}</strong></td>${!compute?`<td class="number">${formatValue(r.metric_1)}</td>`:''}${second?`<td class="number">${formatValue(r.metric_2)}</td>`:''}<td class="number">${formatValue(r.offline_cost,true)}</td><td class="number">${formatValue(r.online_cost,true)}</td>${compute?`<td class="number">${formatValue(r.memory_gb,true)}</td>`:''}<td><small>${escapeHTML([...new Set([!compute?r.metric_1.source_location:null,r.online_cost.status==='reported'?r.online_cost.source_location:null].filter(Boolean))].join(' · '))}</small></td></tr>`).join('')}</tbody></table></div><details class="protocol-details" open><summary>Experimental protocol & interpretation</summary><dl>${Object.entries({Setting:p.setting,Evaluation:p.evaluation,'Cost definition':p.timing,Hardware:p.hardware,Selection:p.selection}).map(([k,v])=>`<dt>${escapeHTML(k)}</dt><dd>${escapeHTML(v)}</dd>`).join('')}</dl></details><details class="protocol-details"><summary>Per-method hardware & reporting notes</summary><dl>${rows.map(r=>`<dt>${escapeHTML(r.method)}</dt><dd>Offline: ${escapeHTML(r.offline_cost.hardware || 'NR')}. Online: ${escapeHTML(r.online_cost.hardware || 'NR')}.${r.notes?' '+escapeHTML(r.notes):''}</dd>`).join('')}</dl></details><p class="source-list">Source: ${externalLink(source.url,source.title)}. ${escapeHTML(Object.values(source.locations).join(' · '))}.</p>`;
}
function matrixMatches(row) { return matrixTask==='all'||row.tasks.split(',').map(x=>x.trim()).includes(matrixTask); }
function renderMatrix() {
  const rows=data.applicability.rows.filter(matrixMatches);
  const symbols=['–','●','○'], labels=['Not part of the depicted workflow','Included','Variant-dependent'], classes=['absent','yes','variant'];
  $('#matrix tbody').innerHTML=rows.map(r=>`<tr><td><strong>${escapeHTML(r.name)}</strong><small>${escapeHTML(r.examples)}</small></td><td>${escapeHTML(r.tasks)}</td><td>${escapeHTML(r.data.replace(/\n/g,' '))}</td>${r.values.map(v=>`<td><span class="mark ${classes[v]}" aria-label="${labels[v]}" title="${labels[v]}">${symbols[v]}</span></td>`).join('')}</tr>`).join('');
  $('#matrix-count').textContent=`${rows.length} workflows shown`;
  $('#workflow-notes').innerHTML=rows.map(r=>`<details><summary>${escapeHTML(r.name)}</summary><p>${escapeHTML(r.reason)}</p>${r.keys.map(key=>{const m=data.references[key];return m?externalLink(paperURL(m),(safeURL(m.url)?'':'Find paper: ')+m.title+' ↗'):`<p>Survey reference key: ${escapeHTML(key)}</p>`;}).join('')}</details>`).join('');
}
function notify(message) {$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2600);}
async function copyText(text) {try {await navigator.clipboard.writeText(text);notify('Copied to clipboard');} catch {notify('Clipboard unavailable. Select and copy the text below.'); if (!$('#method-dialog').open) {setRoute('overview');$('#citation-text').scrollIntoView({block:'center'});}}}
async function loadData() {
  $('#load-error').hidden=true;
  try {
    const embedded=$('#embedded-research-data');
    if (embedded) data=JSON.parse(embedded.textContent);
    else {
      const names=['methods','results','protocols','sources','applicability','references'];
      const values=await Promise.all(names.map(async name=>{const response=await fetch(`data/${name}.json`);if(!response.ok)throw new Error(`Cannot load ${name}`);return response.json();}));
      data=Object.fromEntries(names.map((name,i)=>[name,values[i]]));
    }
    $$('[data-method-count]').forEach(el=>el.textContent=data.methods.records.length);
    $$('[data-task-count]').forEach(el=>el.textContent=data.methods.records.filter(m=>m.task===el.dataset.taskCount).length);
    $$('[data-code-count]').forEach(el=>el.textContent=data.methods.records.filter(hasCode).length);
    $$('[data-companion-count]').forEach(el=>el.textContent=data.methods.records.filter(m=>m.collection==='companion').length);
    $$('[data-snapshot]').forEach(el=>{el.textContent=new Date(data.methods.updated_at||data.methods.snapshot).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});});
    $$('[data-result-count]').forEach(el=>el.textContent=data.results.records.length);
    renderRoute();
  } catch(error) {$('#load-error').hidden=false;console.error('Research data could not be loaded',error);}
}

$('#citation-text').textContent=citation;
$('#copy-citation').addEventListener('click',()=>copyText(citation));
$('#copy-citation-bottom').addEventListener('click',()=>copyText(citation));
$('#retry').addEventListener('click',loadData);
$('#method-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{visibleLimit=24;updateLibraryRoute(true);},140);});
['family-filter','year-filter','sort-methods','code-filter','collection-filter'].forEach(id=>$('#'+id).addEventListener('change',()=>updateLibraryRoute()));
['reset-filters','empty-reset'].forEach(id=>$('#'+id).addEventListener('click',()=>setRoute('gallery')));
$('#show-more').addEventListener('click',()=>{visibleLimit+=24;renderLibrary(false);});
['grid','list'].forEach(mode=>$('#'+mode+'-mode').addEventListener('click',()=>{libraryLayout=mode;['grid','list'].forEach(key=>$('#'+key+'-mode').setAttribute('aria-pressed',String(key===mode)));renderLibrary(false);}));
document.addEventListener('click',event=>{
  const target=event.target.closest('button'); if(!target||!data)return;
  if(target.dataset.libraryTask) {clearTimeout(searchTimer);setRoute('gallery',{task:target.dataset.libraryTask,q:$('#method-search').value.trim(),year:$('#year-filter').value,sort:$('#sort-methods').value,code:$('#code-filter').value,collection:$('#collection-filter').value});}
  if(target.dataset.libraryFamily) {clearTimeout(searchTimer);setRoute('gallery',{task:target.dataset.familyTask,family:target.dataset.libraryFamily,q:$('#method-search').value.trim(),year:$('#year-filter').value,sort:$('#sort-methods').value,code:$('#code-filter').value,collection:$('#collection-filter').value});}
  if(target.dataset.protocol) setRoute('results',{protocol:target.dataset.protocol});
  if(target.dataset.method)showMethod(target.dataset.method);
  if(target.dataset.copyRecord){const m=data.methods.records.find(m=>m.id===target.dataset.copyRecord);copyText(`${m.authors}. ${m.title}. ${m.year}.${m.url?' '+m.url:''}`);}
  if(target.dataset.matrixTask){matrixTask=target.dataset.matrixTask;$$('[data-matrix-task]').forEach(el=>el.setAttribute('aria-pressed',String(el===target)));renderMatrix();}
});
$('.dialog-close').addEventListener('click',()=>$('#method-dialog').close());
$('#method-dialog').addEventListener('click',event=>{if(event.target===$('#method-dialog')) {const box=event.target.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)event.target.close();}});
document.addEventListener('keydown',event=>{if(event.key==='/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !$('#method-dialog').open){event.preventDefault();if(route().view!=='gallery'){setRoute('gallery');setTimeout(()=>$('#method-search').focus(),0);}else $('#method-search').focus();}});
window.addEventListener('hashchange',renderRoute);
renderRoute();
loadData();

// Original survey figures, displayed without cropping or scientific modifications.
$$('[data-figure]').forEach(button=>button.addEventListener('click',()=>{
  $('#figure-image').src=button.dataset.figure;
  $('#figure-image').alt=button.dataset.caption;
  $('#figure-caption').textContent=button.dataset.caption;
  $('#figure-dialog').showModal();
}));
$('.figure-close').addEventListener('click',()=>$('#figure-dialog').close());
$('#figure-dialog').addEventListener('click',event=>{if(event.target===$('#figure-dialog')) {const box=event.target.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)event.target.close();}});
function updateReadingProgress(){const available=document.documentElement.scrollHeight-innerHeight;$('#reading-progress').style.width=(available>0?Math.min(100,scrollY/available*100):0)+'%';}
window.addEventListener('scroll',updateReadingProgress,{passive:true});
window.addEventListener('resize',updateReadingProgress);
window.addEventListener('hashchange',()=>requestAnimationFrame(updateReadingProgress));

$('.skip-link').addEventListener('click',event=>{event.preventDefault();$('#main').focus();});
