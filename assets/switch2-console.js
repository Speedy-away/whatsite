(() => {
  'use strict';
  const root = document.querySelector('[data-switch2-resources]');
  if (!root) return;
  const controls = root.querySelector('[data-switch2-controls]');
  const search = root.querySelector('[data-switch2-search]');
  const category = root.querySelector('[data-switch2-category]');
  const clear = root.querySelector('[data-switch2-clear]');
  const count = root.querySelector('[data-switch2-count]');
  const empty = root.querySelector('[data-switch2-empty]');
  const cards = [...root.querySelectorAll('[data-switch2-card]')];
  if (!controls || !search || !category || !clear || !count || !empty) return;
  function filter() {
    const terms = search.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const card of cards) {
      const matches = (category.value === 'all' || card.dataset.category === category.value)
        && terms.every(term => card.dataset.search.includes(term));
      card.hidden = !matches;
      if (matches) shown++;
    }
    count.textContent = `${shown} of ${cards.length} resources`;
    empty.hidden = shown !== 0;
    clear.disabled = !search.value && category.value === 'all';
  }
  controls.hidden = false;
  controls.addEventListener('submit', event => event.preventDefault());
  search.addEventListener('input', filter);
  category.addEventListener('change', filter);
  clear.addEventListener('click', () => { search.value = ''; category.value = 'all'; filter(); search.focus(); });
  filter();
})();
