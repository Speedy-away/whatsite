(() => {
  'use strict';
  const search = document.querySelector('[data-mod-search]');
  const game = document.querySelector('[data-mod-game]');
  if (!search || !game) return;
  const cards = [...document.querySelectorAll('[data-switch-mod]')];
  const groups = [...document.querySelectorAll('.switch-mod-grid')];
  const count = document.querySelector('[data-mod-count]');
  const empty = document.querySelector('[data-mod-empty]');
  const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function update() {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const card of cards) {
      card.hidden = Boolean(game.value && card.dataset.game !== game.value) || !terms.every(term => normalize(card.dataset.search).includes(term));
      if (!card.hidden) shown++;
    }
    for (const group of groups) {
      group.hidden = ![...group.querySelectorAll('[data-switch-mod]')].some(card => !card.hidden);
      const heading = group.previousElementSibling;
      if (heading?.classList.contains('section-header')) heading.hidden = group.hidden;
    }
    const template = shown === 1 ? '{count} resource' : '{count} resources';
    count.textContent = window.__scoobyI18n?.t(template, {count: shown}) || template.replace('{count}', shown);
    empty.hidden = shown !== 0;
  }
  for (const shortcut of document.querySelectorAll('.switch-mod-game')) {
    shortcut.addEventListener('click', () => {
      const title = shortcut.dataset.modPickGame;
      const option = [...game.options].find(option => option.value === title);
      if (option) { game.value = option.value; search.value = ''; update(); }
    });
  }
  search.addEventListener('input', update);
  game.addEventListener('change', update);
  window.addEventListener('scooby:langchange', update);
  update();
})();
