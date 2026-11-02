(function () {
  'use strict';
  const search = document.getElementById('modCatalogSearch');
  const game = document.getElementById('modCatalogGame');
  const count = document.getElementById('modCatalogCount');
  const empty = document.getElementById('modCatalogEmpty');
  const type = document.getElementById('modCatalogType');
  if (!search || !game || !count || !empty) return;
  const rows = [...document.querySelectorAll('.mod-catalog-entry')];
  const normalize = value => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9.]+/g, ' ').trim();
  const searchable = new Map(rows.map(row => [row, normalize(row.dataset.catalogSearch)]));
  function update() {
    const words = normalize(search.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const row of rows) {
      row.hidden = !!game.value && row.dataset.catalogGame !== game.value || !!type?.value && row.dataset.catalogCategory !== type.value || !words.every(word => searchable.get(row).includes(word));
      row.style.display = row.hidden ? 'none' : '';
      if (!row.hidden) ++visible;
    }
    count.textContent = visible + (visible === 1 ? ' entry' : ' entries');
    empty.hidden = visible !== 0;
  }
  search.addEventListener('input', update);
  game.addEventListener('change', update);
  type?.addEventListener('change', update);
  update();
})();
