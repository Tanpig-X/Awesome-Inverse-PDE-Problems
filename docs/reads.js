/* Shared page loads persisted in the dedicated database. No local increments. */
(() => {
  'use strict';
  const productionOrigin = 'https://tanpig-x.github.io';
  const productionPath = '/Awesome-Inverse-PDE-Problems/';
  const page = productionOrigin + productionPath;
  const endpoint = 'https://inverse-pde-reads.tiannini0707.chatgpt.site/api/reads';
  const source = 'inverse-pde-d1-v1';
  const startedOn = '2026-10-19';
  const cacheKey = 'inverse-pde-shared-reads-v2';
  const onProduction = location.origin === productionOrigin &&
    [productionPath, productionPath + 'index.html'].some(path => path.toLowerCase() === location.pathname.toLowerCase());
  const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const render = (record, state) => {
    const saved = state === 'saved';
    const label = record ? record.value.toLocaleString('en-US') + (saved ? '+' : '') : '—';
    const date = record && new Date(record.observedAt).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'});
    const details = 'Page views since 19 Oct 2026. Earlier verified count: 16 on 12 Oct 2026, excluded from this total.';
    const description = state === 'ready'
      ? `${label} shared page views. ${details} ${onProduction ? 'One event per page load. Switching sections is not counted.' : 'Preview only. This visit is not counted.'}`
      : saved ? `${label} shared page views. Last verified ${date}. Live count temporarily unavailable. ${details}`
      : state === 'loading' ? 'Loading shared page views' : 'Shared page-view count is temporarily unavailable';
    document.querySelectorAll('[data-reads-count]').forEach(el => { el.textContent = label; });
    document.querySelectorAll('[data-reads-label]').forEach(el => { el.textContent = saved ? 'Reads (saved)' : 'Reads'; });
    document.querySelectorAll('[data-reads-status]').forEach(el => {
      el.textContent = (saved ? `Last verified ${date}. Live count unavailable. ` : state === 'unavailable' ? 'Live count unavailable. ' : '') + details;
    });
    ['nav-reads-badge', 'footer-reads-badge'].forEach(id => {
      const badge = document.getElementById(id);
      if (!badge) return;
      badge.dataset.readsState = state;
      badge.title = description;
      badge.setAttribute('aria-label', description);
    });
  };
  if (!onProduction && !isLocal) { render(null, 'unavailable'); return; }
  let lastVerified = null;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached && cached.source === source && Number.isSafeInteger(cached.value) && cached.value >= 0 &&
        typeof cached.observedAt === 'string' && Date.parse(cached.observedAt) >= Date.parse(startedOn) &&
        Date.parse(cached.observedAt) <= Date.now()) lastVerified = cached;
  } catch { /* Private browsing can disable storage. */ }
  render(null, 'loading');
  const showSaved = () => render(lastVerified, lastVerified ? 'saved' : 'unavailable');
  async function requestCount(method, eventId) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch(endpoint, {
        method, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: controller.signal,
        ...(method === 'POST' ? {headers: {'Content-Type': 'application/json'}, body: JSON.stringify({eventId, page})} : {})
      });
      if (!response.ok) throw new Error('Counter unavailable');
      const result = await response.json();
      if (!result || result.success !== true || result.source !== source || result.page !== page ||
          result.started_on !== startedOn || !Number.isSafeInteger(result.reads) || result.reads < 0) {
        throw new Error('Invalid counter response');
      }
      lastVerified = {value: result.reads, observedAt: new Date().toISOString(), source};
      try { localStorage.setItem(cacheKey, JSON.stringify(lastVerified)); } catch { /* Rendering still works. */ }
      render(lastVerified, 'ready');
    } finally { clearTimeout(timeout); }
  }
  async function update() {
    // A fresh random ID belongs to this document only, never to a visitor.
    const eventId = onProduction ? crypto.randomUUID() : null;
    try { await requestCount(onProduction ? 'POST' : 'GET', eventId); return; } catch { showSaved(); }
    if (onProduction) {
      // The database deduplicates the same event if a response was lost.
      try { await requestCount('POST', eventId); return; } catch { showSaved(); }
    }
    try { await requestCount('GET'); } catch { showSaved(); }
  }
  update().catch(showSaved);
})();
