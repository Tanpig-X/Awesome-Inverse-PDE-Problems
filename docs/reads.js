/* Shared page views. No browser-local count, visitor ID, or fabricated seed. */
(() => {
  'use strict';
  const productionOrigin = 'https://tanpig-x.github.io';
  const productionPath = '/Awesome-Inverse-PDE-problems/';
  const namespace = 'tanpig-x.github.io';
  const key = 'awesome-inverse-pde-problems';
  const endpoint = `https://counterapi.com/api/${namespace}/view/${key}`;
  const onProduction = location.origin === productionOrigin &&
    [productionPath, productionPath + 'index.html'].includes(location.pathname);
  const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const render = (count, state) => {
    const label = count === null ? '—' : count.toLocaleString('en-US');
    const description = state === 'ready'
      ? `${label} shared page views. ${onProduction ? 'New page loads are counted. Switching sections is not.' : 'Preview only. This visit is not counted.'}`
      : state === 'loading' ? 'Loading shared page views' : 'Shared page-view count is temporarily unavailable';
    document.querySelectorAll('[data-reads-count]').forEach(el => { el.textContent = label; });
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
  render(null, 'loading');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  // One request per document load. Local QA only reads the same public total.
  // Do not retry a failed hit: the server might already have counted it.
  // Omit readOnly on live visits. The service treats even the string "false"
  // as read-only, so sending readOnly=false prevents the count from increasing.
  fetch(endpoint + (onProduction ? '' : '?readOnly=true'), {
    credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: controller.signal
  }).then(response => {
    if (!response.ok) throw new Error('Counter unavailable');
    return response.json();
  }).then(result => {
    if (!Number.isSafeInteger(result.value) || result.value < 0 ||
        result.ns !== namespace || result.key !== key || result.action !== 'view') {
      throw new Error('Invalid counter response');
    }
    render(result.value, 'ready');
  }).catch(() => render(null, 'unavailable')).finally(() => clearTimeout(timeout));
})();
