(() => {
  const form = document.getElementById('xboxFilters');
  if (!form) return;
  const search = document.getElementById('xboxSearch'), model = document.getElementById('xboxModel'), category = document.getElementById('xboxCategory');
  const apps = [...document.querySelectorAll('[data-xbox-app]')];
  function update() {
    const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const app of apps) {
      const matches = terms.every(t => app.dataset.search.includes(t)) && (model.value === 'all' || app.dataset.models.split(' ').includes(model.value)) && (category.value === 'all' || app.dataset.category === category.value);
      app.hidden = !matches;
      if (matches) shown++;
      for (const file of app.querySelectorAll('.xbox-file[data-models]')) file.hidden = model.value !== 'all' && !file.dataset.models.split(' ').includes(model.value);
    }
    document.getElementById('xboxCount').textContent = `${shown} of ${apps.length} apps`;
    document.getElementById('xboxEmpty').hidden = shown !== 0;
  }
  form.addEventListener('submit',event => event.preventDefault());
  form.addEventListener('input',update);
  form.addEventListener('change',update);
  form.addEventListener('reset',() => {search.value='';model.value='all';category.value='all';update()});
  update();
})();
