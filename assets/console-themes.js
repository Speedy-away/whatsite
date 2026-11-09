(async () => {
  'use strict';
  const form = document.querySelector('[data-themes-filter]');
  if (!form) return;
  const search = form.querySelector('[data-theme-search]');
  const platform = form.querySelector('[data-theme-platform]');
  const kind = form.querySelector('[data-theme-kind]');
  const category = form.querySelector('[data-theme-category]');
  const gallery = document.querySelector('[data-theme-catalog]');
  if (gallery) {
    try {
      const response = await fetch(gallery.dataset.themeCatalog);
      if (!response.ok) throw new Error('Could not fetch the theme catalog');
      const {themes} = await response.json();
      const template = document.querySelector('[data-theme-card-template]');
      const batch = document.createDocumentFragment();
      const titleTags = [
        [/\b4K\b/i, '4K'], [/\bAnime\b/i, 'Anime'], [/\bAbstract\b/i, 'Abstract'],
        [/\bJapanese\b/i, 'Japanese'], [/\bAnniversary\b/i, 'Anniversary'], [/\b(?:Christmas|Halloween|Holiday)\b/i, 'Holiday']
      ];
      for (const [, tag] of titleTags) category.add(new Option(tag, tag));
      for (const {title, url, thumbnail, preview} of themes) {
        const card = template.content.firstElementChild.cloneNode(true);
        const type = /\bDynamic\b/i.test(title) ? 'Dynamic' : /\bStatic\b/i.test(title) ? 'Static' : 'Unspecified';
        const categories = titleTags.filter(([pattern]) => pattern.test(title)).map(([, tag]) => tag);
        const tags = ['PS4', 'RAR', ...(type === 'Unspecified' ? [] : [type]), ...categories];
        card.hidden = true;
        card.dataset.kind = type;
        card.dataset.categories = categories.join('|');
        card.dataset.search = [title, 'PS4 PlayStation 4 theme download preview archive', ...tags].join(' ');
        card.querySelector('h3').textContent = title;
        const badges = card.querySelector('.themes-badges');
        for (const tag of tags) {
          const badge = document.createElement('span');
          badge.textContent = tag;
          badges.append(badge);
        }
        const previewLink = card.querySelector('.themes-preview');
        previewLink.href = preview;
        previewLink.setAttribute('aria-label', 'Open full-size preview of ' + title);
        const img = previewLink.querySelector('img');
        img.alt = title + ' theme preview';
        img.src = thumbnail;
        const download = card.querySelector('.themes-actions a');
        download.href = url;
        download.setAttribute('aria-label', 'Download ' + title);
        batch.append(card);
      }
      gallery.append(batch);
    } catch {
      document.querySelector('[data-theme-error]').hidden = false;
      return;
    }
  }
  const cards = [...document.querySelectorAll('[data-theme-card]')];
  const count = document.querySelector('[data-theme-count]');
  const empty = document.querySelector('[data-theme-empty]');
  const pagination = document.querySelector('[data-theme-pagination]');
  const pageSize = 36;
  let page = 1;
  const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function readUrl() {
    const query = new URLSearchParams(window.location.search);
    for (const control of [platform, kind, category].filter(Boolean)) {
      const value = query.get(control.name);
      control.value = [...control.options].some(option => option.value === value) ? value : '';
    }
    search.value = query.get('q') || '';
    const requestedPage = Number(query.get('page'));
    page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  }

  function pageUrl(number) {
    const url = new URL(window.location.href);
    if (number > 1) url.searchParams.set('page', number);
    else url.searchParams.delete('page');
    url.hash = 'theme-library';
    return url;
  }

  function renderPages(total) {
    if (!pagination) return;
    pagination.hidden = total < 2;
    pagination.replaceChildren();
    if (total < 2) return;
    const addPage = (number, label = String(number), current = false) => {
      const link = document.createElement('a');
      link.href = pageUrl(number).href;
      link.dataset.themePage = number;
      link.className = 'btn ' + (current ? 'btn-primary' : 'btn-outline');
      link.textContent = label;
      if (current) link.setAttribute('aria-current', 'page');
      pagination.append(link);
    };
    if (page > 1) addPage(page - 1, 'Previous');
    for (let number = 1; number <= total; number++) addPage(number, String(number), number === page);
    if (page < total) addPage(page + 1, 'Next');
  }

  function update(writeUrl = false) {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    const matches = cards.filter(card => {
      const matchesCategory = !category?.value || card.dataset.categories.split('|').includes(category.value);
      return matchesCategory && (!platform.value || platform.value === card.dataset.platform) && (!kind.value || kind.value === card.dataset.kind) && terms.every(term => normalize(card.dataset.search).includes(term));
    });
    const visible = matches.length;
    const totalPages = Math.max(1, Math.ceil(visible / pageSize));
    page = Math.min(page, totalPages);
    const start = (page - 1) * pageSize;
    const shown = new Set(pagination ? matches.slice(start, start + pageSize) : matches);
    for (const card of cards) card.hidden = !shown.has(card);
    const label = visible === 1 ? '{count} theme' : '{count} themes';
    count.textContent = window.__scoobyI18n?.t(label, {count:visible}) || label.replace('{count}', visible);
    empty.hidden = visible !== 0;
    if (writeUrl) {
      const url = new URL(window.location.href);
      for (const [key, value] of [['q', search.value.trim()], ['console', platform.value], ['kind', kind.value]]) {
        if (value) url.searchParams.set(key, value); else url.searchParams.delete(key);
      }
      if (category) {
        if (category.value) url.searchParams.set('category', category.value);
        else url.searchParams.delete('category');
      }
      if (pagination) url.searchParams.delete('page');
      window.history.replaceState(null, '', url);
    }
    renderPages(totalPages);
  }
  function filter() {
    page = 1;
    update(true);
  }
  form.addEventListener('submit', event => { event.preventDefault(); filter(); });
  form.addEventListener('input', filter);
  form.addEventListener('change', filter);
  pagination?.addEventListener('click', event => {
    const link = event.target.closest('[data-theme-page]');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const nextPage = Number(link.dataset.themePage);
    if (nextPage === page) return;
    page = nextPage;
    window.history.pushState(null, '', link.href);
    update();
    pagination.querySelector('[aria-current="page"]')?.focus({preventScroll:true});
    pagination.closest('section')?.scrollIntoView();
  });
  form.addEventListener('reset', event => {
    event.preventDefault();
    search.value = '';
    platform.value = '';
    kind.value = '';
    if (category) category.value = '';
    filter();
  });
  window.addEventListener('scooby:langchange', () => update());
  window.addEventListener('popstate', () => { readUrl(); update(); });
  readUrl();
  form.hidden = false;
  update();
})();
