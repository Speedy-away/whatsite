(() => {
  'use strict';
  const search = document.querySelector('[data-theme-search]');
  const menu = document.querySelector('[data-theme-menu]');
  if (!search || !menu) return;
  const cards = [...document.querySelectorAll('[data-switch-theme]')];
  const groups = [...document.querySelectorAll('[data-theme-group]')];
  const count = document.querySelector('[data-theme-count]');
  const empty = document.querySelector('[data-theme-empty]');
  const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const t = (key, params) => window.__scoobyI18n?.t(key, params) || Object.entries(params || {}).reduce((text,[key,value]) => text.replaceAll('{'+key+'}', value),key);
  function update() {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let total = 0;
    for (const card of cards) {
      card.hidden = !terms.every(term => normalize(card.dataset.search).includes(term)) || !!menu.value && !card.dataset.menus.split(' ').includes(menu.value);
      if (!card.hidden) total++;
    }
    for (const group of groups) group.hidden = !group.querySelector('[data-switch-theme]:not([hidden])');
    count.textContent = t(total === 1 ? '{count} result' : '{count} results', {count:total});
    empty.hidden = total !== 0;
  }
  function revealHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = cards.find(card => card.id === id);
    if (!target) return;
    search.value = ''; menu.value = ''; update();
    requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
  }
  search.addEventListener('input', update);
  menu.addEventListener('change', update);
  document.querySelector('[data-theme-reset]').addEventListener('click', () => {search.value='';menu.value='';update();search.focus();});
  window.addEventListener('scooby:langchange', update);
  window.addEventListener('hashchange', revealHash);
  update(); revealHash();
})();
