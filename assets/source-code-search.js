(function () {
  'use strict';
  function install() {
    const input = document.getElementById('sourceProjectSearch');
    const reset = document.getElementById('sourceProjectReset');
    const count = document.getElementById('sourceProjectCount');
    const empty = document.getElementById('sourceProjectEmpty');
    if (!input || !reset || !count || !empty || input.dataset.sourceSearchReady) return;
    input.dataset.sourceSearchReady = 'true';
    const sections = [...document.querySelectorAll('[data-source-project-section]')];
    const cards = [...document.querySelectorAll('[data-source-project]')];
    const fold = value => String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim();
    const update = () => {
      const terms = fold(input.value).split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const card of cards) {
        const matches = terms.every(term => fold(card.dataset.search || card.textContent).includes(term));
        card.hidden = !matches;
        if (matches) shown++;
      }
      for (const section of sections) section.hidden = ![...section.querySelectorAll('[data-source-project]')].some(card => !card.hidden);
      count.textContent = shown + (shown === 1 ? ' project shown' : ' projects shown');
      empty.hidden = shown !== 0;
      reset.disabled = input.value.length === 0;
    };
    input.addEventListener('input', update);
    reset.addEventListener('click', () => { input.value = ''; update(); input.focus(); });
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape' && input.value) { event.preventDefault(); input.value = ''; update(); }
    });
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once: true});
  else install();
})();
