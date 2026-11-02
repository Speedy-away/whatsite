/* Scoped search deliberately leaves the preserved system/GameCube resources visible. */
(() => {
  const search = document.getElementById('wii-more-search');
  if (!search) return;
  const model = document.getElementById('wii-more-model');
  const cards = [...document.querySelectorAll('[data-wii-card]')];
  const buttons = [...document.querySelectorAll('[data-wii-filter]')];
  let category = 'all';
  function update() {
    const query = search.value.toLowerCase().trim();
    let shown = 0;
    for(const card of cards) {
      const visible = (!query || card.dataset.search.includes(query)) && (category === 'all' || card.dataset.category === category) && (model.value === 'all' || card.dataset.platforms.split(' ').includes(model.value));
      card.hidden = !visible;
      if(visible) shown++;
    }
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.wiiFilter === category)));
    document.getElementById('wii-more-status').textContent = `${shown} resource${shown===1?'':'s'} shown`;
    document.getElementById('wii-more-empty').hidden = shown !== 0;
  }
  search.addEventListener('input',update);
  model.addEventListener('change',update);
  buttons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.wiiFilter;update();}));
  document.getElementById('wii-more-reset').addEventListener('click',()=>{search.value='';model.value='all';category='all';update();search.focus();});
  update();
})();
