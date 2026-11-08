(() => {
  'use strict';
  const form = document.querySelector('[data-themes-filter]');
  if (!form) return;
  const search = form.querySelector('[data-theme-search]');
  const platform = form.querySelector('[data-theme-platform]');
  const kind = form.querySelector('[data-theme-kind]');
  const cards = [...document.querySelectorAll('[data-theme-card]')];
  const count = document.querySelector('[data-theme-count]');
  const empty = document.querySelector('[data-theme-empty]');
  const more = document.querySelector('[data-theme-more]');
  const batchSize = 36;
  let limit = more ? batchSize : Infinity;
  const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const query = new URLSearchParams(window.location.search);
  const select = (control, value) => { if ([...control.options].some(option => option.value === value)) control.value = value; };
  select(platform, query.get('console'));
  select(kind, query.get('kind'));
  search.value = query.get('q') || '';

  function update(writeUrl = false) {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      const matches = (!platform.value || platform.value === card.dataset.platform) && (!kind.value || kind.value === card.dataset.kind) && terms.every(term => normalize(card.dataset.search).includes(term));
      card.hidden = !matches || visible >= limit;
      if (matches) visible++;
    }
    const label = visible === 1 ? '{count} theme' : '{count} themes';
    count.textContent = window.__scoobyI18n?.t(label, {count:visible}) || label.replace('{count}', visible);
    empty.hidden = visible !== 0;
    if (more) more.hidden = visible <= limit;
    if (writeUrl) {
      const url = new URL(window.location.href);
      for (const [key, value] of [['q', search.value.trim()], ['console', platform.value], ['kind', kind.value]]) {
        if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
      }
      window.history.replaceState(null, '', url);
    }
  }
  function filter() {
    if (more) limit = batchSize;
    update(true);
  }
  form.addEventListener('submit', event => { event.preventDefault(); filter(); });
  form.addEventListener('input', filter);
  form.addEventListener('change', filter);
  more?.addEventListener('click', () => { limit += batchSize; update(); });
  form.addEventListener('reset', event => {
    event.preventDefault();
    search.value = '';
    platform.value = '';
    kind.value = '';
    filter();
  });
  window.addEventListener('scooby:langchange', () => update());
  form.hidden = false;
  update();
})();
