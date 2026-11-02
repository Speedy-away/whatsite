(() => {
  'use strict';
  const search = document.querySelector('[data-switch-search]');
  const category = document.querySelector('[data-switch-category]');
  if (!search || !category) return;
  const apps = [...document.querySelectorAll('[data-switch-app]')];
  const result = document.querySelector('[data-switch-count]');
  const empty = document.querySelector('[data-switch-empty]');
  const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const requestedCategory = new URLSearchParams(window.location.search).get('category');
  if ([...category.options].some(option => option.value === requestedCategory)) category.value = requestedCategory;
  function update() {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    for (const app of apps) {
      const matches = (!category.value || app.dataset.category === category.value) && terms.every(term => normalize(app.dataset.search).includes(term));
      app.hidden = !matches;
      if (matches) count++;
    }
    const template = count === 1 ? '{count} app' : '{count} apps';
    result.textContent = window.__scoobyI18n?.t(template, { count }) || template.replace('{count}', count);
    empty.hidden = count !== 0;
  }
  search.addEventListener('input', update);
  category.addEventListener('change', () => {
    const url = new URL(window.location.href);
    if (category.value) url.searchParams.set('category', category.value);
    else url.searchParams.delete('category');
    window.history.replaceState(null, '', url);
    update();
  });
  window.addEventListener('scooby:langchange', update);
  update();
})();
