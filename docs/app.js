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
const benchmarkAreas = {
  inverse_problems: {name:'Inverse problems', short:'Inverse problems', code:'IP', description:'Recover coefficients, parameters, and unobserved fields.', targets:'Parameter identification · field reconstruction · sparse observations'},
  inverse_design: {name:'Inverse design', short:'Inverse design', code:'ID', description:'Evaluate design objectives and physical constraints.', targets:'Structural topology · airfoil geometry · compositional design'},
  control: {name:'Control problems', short:'Control', code:'C', description:'Compare control quality, inference time, and safety.', targets:'Burgers tracking · terminal control · smoke transport'},
  efficiency: {name:'Computational efficiency', short:'Compute profiles', code:'E', description:'Training cost, throughput, and GPU memory under reported hardware.', targets:'Training time · batch throughput · GPU memory'}
};
const benchmarkSelections = new Map();
const benchmarkTables = () => data.benchmarks.groups.flatMap(group=>group.tables);
const benchmarkEntryCount = () => benchmarkTables().reduce((count,table)=>count+table.rows.length,0);

function benchmarkValue(cell) {
  if (!cell || cell.value == null) return `<span class="value-na">${cell?.status==='NA'?'–':'NR'}</span>`;
  return `${escapeHTML(cell.value)}${cell.std!=null?`<small>± ${escapeHTML(cell.std)}</small>`:''}${cell.unit && !['dimensionless','source_objective_units','source_control_error_units'].includes(cell.unit)?`<small>${escapeHTML(cell.unit)}</small>`:''}`;
}
function benchmarkTableHTML(table, group) {
  const best = Object.fromEntries(table.metrics.map(metric=>{
    const values = table.rows.map(row=>row.values[metric.key]?.value).filter(value=>value!=null).map(Number);
    return [metric.key, metric.direction==='higher' ? Math.max(...values) : Math.min(...values)];
  }));
  return `<div class="benchmark-setting"><div><strong>${escapeHTML(table.label)}</strong><p>${escapeHTML(table.setting)}</p></div>${externalLink(table.source_url,table.location+' ↗','benchmark-table-source')}</div>
    <div class="benchmark-scroll-hint">Scroll horizontally to compare all columns →</div><div class="table-scroll benchmark-table-wrap" tabindex="0" role="region" aria-label="${escapeHTML(group.title+' '+table.label)} comparison"><table class="benchmark-table"><caption class="sr-only">${escapeHTML(group.title+' — '+table.label)}. Literature-reported results.</caption><thead><tr><th scope="col">Method</th>${table.metrics.map(metric=>`<th scope="col" class="number" title="${escapeHTML(metric.definition||metric.label)}">${escapeHTML(metric.label)} <span>${metric.direction==='higher'?'↑':'↓'}</span>${metric.unit?`<small>${escapeHTML(metric.unit)}</small>`:''}</th>`).join('')}</tr></thead><tbody>${table.rows.map(row=>`<tr><th scope="row">${escapeHTML(row.method)}</th>${table.metrics.map(metric=>{
      const cell=row.values[metric.key];
      const winner=table.highlight && cell?.value!=null && Number(cell.value)===best[metric.key];
      return `<td class="number${winner?' best-value':''}">${winner?'<strong>':''}${benchmarkValue(cell)}${winner?'</strong>':''}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table></div>
    <p class="benchmark-table-note">${escapeHTML(table.note)}</p>
    <details class="benchmark-protocol"><summary>Protocol, metric definitions &amp; reporting notes</summary><dl>${Object.entries(table.details).map(([name,value])=>`<dt>${escapeHTML(name)}</dt><dd>${escapeHTML(value)}</dd>`).join('')}${table.metrics.filter(metric=>metric.definition).map(metric=>`<dt>${escapeHTML(metric.label)}</dt><dd>${escapeHTML(metric.definition)}</dd>`).join('')}</dl>${table.rows.some(row=>row.note)?`<ul>${table.rows.filter(row=>row.note).map(row=>`<li><strong>${escapeHTML(row.method)}.</strong> ${escapeHTML(row.note)}</li>`).join('')}</ul>`:''}<p>${externalLink(group.source.paper_url,group.source.title+' ↗')}</p></details>`;
}
function benchmarkGroupHTML(group) {
  const {params}=route();
  const selected=params.get('protocol');
  const current=group.tables.find(table=>table.id===selected)||group.tables.find(table=>table.id===benchmarkSelections.get(group.id))||group.tables[0];
  return `<article class="benchmark-card" id="benchmark-${escapeHTML(group.id)}" data-benchmark-area="${group.task}">
    <header class="benchmark-card-header"><div><div class="benchmark-card-kicker">${escapeHTML(group.source.version)}<span>${group.tables.length} ${group.tables.length===1?'protocol':'protocols'}</span></div><h3>${escapeHTML(group.title)} <span>${escapeHTML(group.subtitle)}</span></h3><p>${escapeHTML(group.summary)}</p></div><div class="benchmark-source-links">${externalLink(group.source.paper_url,'Paper ↗')}${externalLink(group.source.code_url,'Benchmark code ↗')}</div></header>
    ${group.tables.length>1?`<div class="benchmark-tabs" role="group" aria-label="${escapeHTML(group.title)} evaluation setting">${group.tables.map(table=>`<button data-benchmark-group="${escapeHTML(group.id)}" data-benchmark-table="${escapeHTML(table.id)}" aria-pressed="${table===current}">${escapeHTML(table.label)}</button>`).join('')}</div>`:''}
    <div class="benchmark-table-panel" id="benchmark-panel-${escapeHTML(group.id)}">${benchmarkTableHTML(current,group)}</div>
  </article>`;
}
function renderBenchmarkGroups() {
  const {params}=route();
  const task=Object.hasOwn(benchmarkAreas,params.get('task'))?params.get('task'):'all';
  const terms=(params.get('q')||'').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const groups=data.benchmarks.groups.filter(group=>(task==='all'||group.task===task)&&terms.every(term=>[group.title,group.subtitle,group.summary,group.source.version,...group.tables.flatMap(table=>[table.label,table.setting,...table.rows.map(row=>row.method)])].join(' ').toLocaleLowerCase().includes(term)));
  $('#benchmark-groups').innerHTML=Object.entries(benchmarkAreas).map(([area,meta],i)=>{
    const found=groups.filter(group=>group.task===area);
    if(!found.length)return '';
    return `<section class="benchmark-area" aria-labelledby="benchmark-area-${area}"><header class="benchmark-area-heading"><span class="benchmark-area-code" data-area="${area}">${meta.code}</span><div><h2 id="benchmark-area-${area}">${escapeHTML(meta.name)}</h2><p>${escapeHTML(meta.description)}</p></div><span class="benchmark-area-total">${found.length} ${found.length===1?'comparison':'comparisons'}</span></header>${found.map(benchmarkGroupHTML).join('')}</section>`;
  }).join('');
  $('#benchmark-empty').hidden=groups.length>0;
  const protocolCount=groups.reduce((n,g)=>n+g.tables.length,0);
  $('#benchmark-count').textContent=`${groups.length} benchmark ${groups.length===1?'comparison':'comparisons'} · ${protocolCount} evaluation ${protocolCount===1?'protocol':'protocols'}${terms.length?' matching “'+(params.get('q')||'')+'”':''}`;
  $$('#benchmark-filters button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.benchmarkTask===task)));
}
function renderResults() {
  const groups=data.benchmarks.groups;
  const sources=new Set(groups.map(group=>group.source.id));
  $('#benchmark-stats').innerHTML=[['Evaluation protocols','Distinct tasks, splits & settings',benchmarkTables().length],['Method entries','Accuracy, quality & cost',benchmarkEntryCount()],['Primary sources','Every source includes code',sources.size],['Research areas','Inverse problems · design · control',3]].map(([label,note,count])=>`<div class="benchmark-stat"><strong>${count}</strong><span>${label}</span><small>${note}</small></div>`).join('');
  $('#benchmark-updated').textContent=new Date(data.benchmarks.updated_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  $('#benchmark-coverage').innerHTML=Object.entries(benchmarkAreas).map(([area,meta])=>{
    const found=groups.filter(group=>group.task===area);
    return `<tr><th scope="row"><button data-benchmark-task="${area}" class="coverage-link"><span class="benchmark-area-code" data-area="${area}">${meta.code}</span>${meta.name} ↗</button></th><td>${meta.targets}</td><td>${found.map(group=>escapeHTML(group.title)).join(' · ')}</td><td class="number">${found.reduce((n,group)=>n+group.tables.length,0)}</td></tr>`;
  }).join('');
  $('#benchmark-filters').innerHTML=Object.entries({all:{short:'All benchmarks'},...benchmarkAreas}).map(([task,meta])=>`<button data-benchmark-task="${task}" aria-pressed="false">${meta.short}</button>`).join('');
  $('#benchmark-search').value=route().params.get('q')||'';
  renderBenchmarkGroups();
  const selected=route().params.get('protocol');
  const group=groups.find(group=>group.tables.some(table=>table.id===selected));
  if(group)requestAnimationFrame(()=>$('#benchmark-'+group.id)?.scrollIntoView({block:'start'}));
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
      const names=['methods','results','protocols','sources','applicability','references','benchmarks'];
      const values=await Promise.all(names.map(async name=>{const response=await fetch(`data/${name}.json`);if(!response.ok)throw new Error(`Cannot load ${name}`);return response.json();}));
      data=Object.fromEntries(names.map((name,i)=>[name,values[i]]));
    }
    $$('[data-method-count]').forEach(el=>el.textContent=data.methods.records.length);
    $$('[data-task-count]').forEach(el=>el.textContent=data.methods.records.filter(m=>m.task===el.dataset.taskCount).length);
    $$('[data-code-count]').forEach(el=>el.textContent=data.methods.records.filter(hasCode).length);
    $$('[data-companion-count]').forEach(el=>el.textContent=data.methods.records.filter(m=>m.collection==='companion').length);
    $$('[data-snapshot]').forEach(el=>{el.textContent=new Date(data.methods.updated_at||data.methods.snapshot).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});});
    $$('[data-result-count]').forEach(el=>el.textContent=benchmarkEntryCount());
    renderRoute();
  } catch(error) {$('#load-error').hidden=false;console.error('Research data could not be loaded',error);}
}

$('#benchmark-search').addEventListener('input',()=>{
  const {params}=route();
  const query=$('#benchmark-search').value.trim();
  if(query)params.set('q',query);else params.delete('q');
  params.delete('protocol');
  history.replaceState(null,'','#view-results'+(params.size?'?'+params.toString():''));
  renderBenchmarkGroups();
});
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
  if(target.dataset.benchmarkTask) setRoute('results',{task:target.dataset.benchmarkTask,q:$('#benchmark-search').value.trim()});
  if(target.hasAttribute('data-benchmark-reset')) setRoute('results');
  if(target.dataset.benchmarkTable) {
    const group=data.benchmarks.groups.find(group=>group.id===target.dataset.benchmarkGroup);
    const table=group?.tables.find(table=>table.id===target.dataset.benchmarkTable);
    if(table) {
      benchmarkSelections.set(group.id,table.id);
      const {params}=route();params.set('protocol',table.id);
      history.replaceState(null,'','#view-results?'+params.toString());
      $('#benchmark-panel-'+group.id).innerHTML=benchmarkTableHTML(table,group);
      $$('[data-benchmark-group="'+group.id+'"]').forEach(button=>button.setAttribute('aria-pressed',String(button===target)));
    }
  }
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
