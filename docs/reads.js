/* Shared page views. Cache server observations only. Never increment locally. */
(() => {
  'use strict';
  const productionOrigin = 'https://tanpig-x.github.io';
  const productionPath = '/Awesome-Inverse-PDE-Problems/';
  const namespace = 'tanpig-x.github.io';
  const key = 'awesome-inverse-pde-problems';
  const endpoint = `https://counterapi.com/api/${namespace}/view/${key}`;
  const cacheKey = 'inverse-pde-shared-reads-v1';
  // Observed in Safari during the 2026-10-12 deployment verification.
  // This is an outage fallback, never a seed added to the server's total.
  const verifiedSnapshot = {value: 16, observedAt: '2026-10-12', source: endpoint};
  const onProduction = location.origin === productionOrigin &&
    [productionPath, productionPath + 'index.html'].some(path => path.toLowerCase() === location.pathname.toLowerCase());
  const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const render = (count, state, observedAt) => {
    const saved = state === 'saved';
    const label = count === null ? '—' : count.toLocaleString('en-US') + (saved ? '+' : '');
    const date = observedAt && new Date(observedAt).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'});
    const status = saved ? `Last verified ${date}. Live count unavailable.` : '';
    const description = state === 'ready'
      ? `${label} shared page views. ${onProduction ? 'New page loads are counted. Switching sections is not.' : 'Preview only. This visit is not counted.'}`
      : saved ? `${count.toLocaleString('en-US')} shared page views were verified on ${date}. Live count unavailable. Visits during the outage may not be recorded.`
      : state === 'loading' ? 'Loading shared page views' : 'Shared page-view count is temporarily unavailable';
    document.querySelectorAll('[data-reads-count]').forEach(el => { el.textContent = label; });
    document.querySelectorAll('[data-reads-label]').forEach(el => { el.textContent = saved ? 'Reads (saved)' : 'Reads'; });
    document.querySelectorAll('[data-reads-status]').forEach(el => { el.textContent = status; });
    ['nav-reads-badge', 'footer-reads-badge'].forEach(id => {
      const badge = document.getElementById(id);
      if (!badge) return;
      badge.dataset.readsState = state;
      badge.title = description;
      badge.setAttribute('aria-label', description);
    });
  };
  // Unrecognized mirrors do not call the owner's counter.
  if (!onProduction && !isLocal) { render(null, 'unavailable'); return; }
  let lastVerified = verifiedSnapshot;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached && cached.source === endpoint && Number.isSafeInteger(cached.value) && cached.value >= 0 &&
        typeof cached.observedAt === 'string' && Date.parse(cached.observedAt) >= Date.parse(verifiedSnapshot.observedAt) &&
        Date.parse(cached.observedAt) <= Date.now()) lastVerified = cached;
  } catch { /* Storage may be unavailable in private browsing. */ }
  render(null, 'loading');
  async function requestCount(readOnly) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      // Omit readOnly on the single live hit. Even "false" suppresses counting.
      const response = await fetch(endpoint + (readOnly ? '?readOnly=true' : ''), {
        credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: controller.signal
      });
      if (!response.ok) throw new Error('Counter unavailable');
      const result = await response.json();
      if (!result || !Number.isSafeInteger(result.value) || result.value < 0 ||
          result.ns !== namespace || result.key !== key || result.action !== 'view') {
        throw new Error('Invalid counter response');
      }
      lastVerified = {value: result.value, observedAt: new Date().toISOString(), source: endpoint};
      try { localStorage.setItem(cacheKey, JSON.stringify(lastVerified)); } catch { /* Display still works. */ }
      render(result.value, 'ready');
    } finally {
      clearTimeout(timeout);
    }
  }
  requestCount(!onProduction).catch(async () => {
    render(lastVerified.value, 'saved', lastVerified.observedAt);
    // The first request might have counted before its response was lost.
    // Recover with one read-only request, never another increment.
    try { await requestCount(true); } catch { /* Keep the dated, verified observation. */ }
  });
})();
