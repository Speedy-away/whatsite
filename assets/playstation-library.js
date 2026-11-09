const $ = id => document.getElementById(id);
const root = new URL('./', document.querySelector('link[rel="canonical"]').href).pathname;
const locale = document.documentElement.lang;
const dataRoot = '/assets/playstation-library/';
const pageSize = 24;
const order = ['base', 'bundle', 'update', 'dlc', 'fix', 'patch', 'other'];
const messages = Object.fromEntries([...$('library-copy').content.querySelectorAll('[data-message]')]
  .map(node => [node.dataset.message, node.textContent]));
const msg = (key, values = {}) => messages[key].replace(/\{([a-z]+)\}/g, (token, name) => values[name] ?? token);
const labels = Object.fromEntries(order.map(kind => [kind, msg('kind-' + kind)]));
const gameId = /^[a-f0-9]{16}$/;
const fmt = new Intl.NumberFormat(locale);
const dateFmt = new Intl.DateTimeFormat(locale, {dateStyle: 'medium', timeZone: 'UTC'});
const listedDate = value => Date.parse(/^[a-z]+ \d{1,2}, \d{4}$/i.test(value || '') ? value + ' UTC' : value);
const featuredCovers = new Map([
  ['https://www.superpsx.com/wp-content/uploads/2024/09/Bloodborne_-PS4-PKG.webp', '/assets/images/playstation-library/bloodborne.webp'],
  ['https://www.superpsx.com/wp-content/uploads/2024/09/God-of-War-III-Remastered-PS4-PKG.webp', '/assets/images/playstation-library/god-of-war-iii.webp'],
  ['https://image.api.playstation.com/vulcan/ap/rnd/202406/0500/8f15268257b878597757fcc5f2c9545840867bc71fc863b1.png?w=260', '/assets/images/playstation-library/astro-bot.png']
]);
const normalize = value => String(value || '').normalize('NFKD').toLowerCase().replace(/\p{M}/gu, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\b(cusa|ppsa)\s+(\d{5})\b/g, '$1$2').trim();
const romanNumerals = ['', 'i', 'ii', 'iii', 'iv', 'v', 'vi'];

function searchText(game) {
  const title = normalize(game.name);
  const numbered = title.replace(/\b(i|ii|iii|iv|v|vi)\b/g, numeral => romanNumerals.indexOf(numeral));
  const roman = title.replace(/\b[1-6]\b/g, number => romanNumerals[Number(number)]);
  const blackOps = numbered.match(/\bblack ops ([1-4])\b/)?.[1];
  const gta = numbered.match(/\bgrand theft auto ([456])\b/)?.[1];
  const platform = game.platform === 'PS4' ? 'PlayStation 4 PS 4' : 'PlayStation 5 PS 5';
  return normalize([title, numbered, roman, blackOps && `BO${blackOps} BO ${blackOps}`,
    gta && `GTA${gta} GTA ${gta} GTA ${romanNumerals[gta]}`, game.platform, platform,
    ...(game.titleIds || []), game.source].filter(Boolean).join(' '));
}
const regionKey = value => ({US: 'USA', EU: 'EUR'}[value] || value || 'Unspecified');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const label = (key, values) => esc(msg(key, values));
const countLabel = (key, count) => msg(key, {count: fmt.format(count)});
const option = (value, text = value) => new Option(text, value);
const regionOption = value => option(value, value === 'Unspecified' ? msg('unspecified') : value);
const query = () => new URLSearchParams(location.search);
const gameUrl = id => root + '?game=' + encodeURIComponent(id);
const transferUrl = (id, file) => root + 'download.html?game=' + encodeURIComponent(id) + '&file=' + encodeURIComponent(file);
const isSuperPSX = g => g.source === 'SuperPSX';

function safeUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value, location.origin);
    const local = value.startsWith('/') && url.origin === location.origin;
    return !url.username && !url.password && (local || (value.startsWith('https://') || value.startsWith('http://'))) ? url.href : '';
  } catch { return ''; }
}

function host(value) {
  const href = safeUrl(value);
  return href ? new URL(href).hostname.replace(/^www\./, '') : msg('source-unavailable');
}

const json = async url => {
  const response = await fetch(url);
  if (!response.ok) throw Error('Catalog request failed');
  return response.json();
};
let indexPromise;
const index = () => indexPromise ||= json(dataRoot + 'index.json?v=dlpsgame-2');
const shards = new Map();
async function getGame(id, revision) {
  if (!gameId.test(id || '')) return null;
  const key = (parseInt(id.slice(0, 2), 16) % 32).toString(16).padStart(2, '0');
  if (!shards.has(key)) {
    const request = json(dataRoot + key + '.json?v=' + encodeURIComponent(revision));
    shards.set(key, request);
    request.catch(() => shards.delete(key));
  }
  return (await shards.get(key))[id] || null;
}

function cover(g, lazy = false) {
  const url = safeUrl(featuredCovers.get(g.cover) || g.cover);
  return `<div class="cover" data-platform="${esc(g.platform)}" aria-hidden="true"><span>${esc(g.platform)}</span>${
    url ? `<img src="${esc(url)}" alt="" ${lazy ? 'loading="lazy" ' : ''}decoding="async" referrerpolicy="no-referrer">` : ''}</div>`;
}

document.addEventListener('error', event => {
  if (event.target.matches?.('.cover img')) event.target.remove();
}, true);

let noticeTimer;
function toast(message) {
  const element = $('library-toast');
  clearTimeout(noticeTimer);
  element.textContent = message;
  element.hidden = false;
  element.setAttribute('popover', 'manual');
  element.showPopover?.();
  noticeTimer = setTimeout(() => { element.hidePopover?.(); element.hidden = true; }, 2600);
}

async function copy(text, success) {
  try {
    await navigator.clipboard.writeText(text);
    toast(success);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('aria-label', msg('copy-field'));
    area.className = 'copy-fallback';
    const button = document.activeElement;
    (document.querySelector('dialog[open]') || document.body).append(area);
    area.select();
    try {
      if (document.execCommand('copy')) { area.remove(); button?.focus(); toast(success); return; }
    } catch {}
    toast(msg('copy-selected'));
    area.addEventListener('blur', () => area.remove(), {once: true});
  }
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-copy]');
  if (button) copy(button.dataset.copy, msg(button.dataset.copy === 'SuperPSX' ? 'password-copied' : 'link-copied'));
});

function sourceLink(url, label, {button = false} = {}) {
  const href = safeUrl(url);
  return href ? `<a${button ? ' class="action secondary"' : ''} href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>` : '';
}

function renderGame(id, game, initialRegion, initialKind, related) {
  const detail = $('game-detail');
  const regionOptions = [...new Set(game.files.map(file => regionKey(file.region)))].sort();
  const kinds = order.filter(kind => game.files.some(file => file.kind === kind));
  const sourcePage = safeUrl(game.page);
  const sourceUrls = [...new Set((game.sourcePages || []).map(safeUrl).filter(url => url && url !== sourcePage))];
  const sources = [sourceLink(sourcePage, msg('source-listing'), {button: true}), ...sourceUrls.map((url, i) =>
    sourceLink(url, msg('source-download') + (sourceUrls.length > 1 ? ' ' + fmt.format(i + 1) : ''), {button: true}))].filter(Boolean);
  const otherListings = related.length ? `<div class="source-notes"><h3>${label('related-title-ids')}</h3><ul>${related.map(listing =>
    `<li><a href="${gameUrl(listing.id)}" data-game="${listing.id}">${esc(listing.name)}</a></li>`).join('')}</ul></div>` : '';
  detail.innerHTML = `
    <div class="detail-header">
      ${cover(game)}
      <div><p class="label-line">${esc(game.platform)}</p>
        <h2 id="game-title">${esc(game.name)}</h2>
        <p class="meta-line">${(game.titleIds || []).map(esc).join(' · ')}</p>
        ${sources.length ? `<div class="library-source">${sources.join('')}</div>` : ''}
        ${game.files.length ? `<button type="button" class="action secondary" id="copy-all">${label('copy-all')} <span aria-hidden="true">⧉</span></button>` : ''}
      </div>
    </div>
    <p class="detail-note">${label('install-note')}</p>
    ${isSuperPSX(game) ? `<p class="detail-note">${label('password-note')} <button type="button" class="inline-copy" data-copy="SuperPSX">SuperPSX <span aria-hidden="true">⧉</span></button></p>` : ''}
    ${game.notes ? `<details class="source-notes"><summary>${label('source-notes')}</summary><p>${esc(game.notes)}</p></details>` : ''}
    ${game.files.length ? `
    <div class="file-filter">
      <h3>${label('package-links')}</h3>
      <div>
        <label>${label('region')}<select id="file-region"><option value="">${label('all-regions')}</option></select></label>
        <label>${label('type')}<select id="file-kind"><option value="">${label('all-types')}</option></select></label>
      </div>
    </div>
    <p id="file-count" class="meta-line" role="status"></p>
    <div class="file-list" id="file-list"></div>` : sources.length ? '' : `
    <p class="detail-note">${label('source-unavailable')}</p>`}
    ${otherListings}`;
  if (!game.files.length) return;
  const regionSelect = $('file-region'), kindSelect = $('file-kind');
  regionSelect.append(...regionOptions.map(regionOption));
  kindSelect.append(...kinds.map(k => option(k, labels[k])));
  if (regionOptions.includes(initialRegion)) regionSelect.value = initialRegion;
  if (kinds.includes(initialKind)) kindSelect.value = initialKind;
  const files = game.files.slice().sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  function renderFiles() {
    const filtered = files.filter(file => (!regionSelect.value || regionKey(file.region) === regionSelect.value) &&
      (!kindSelect.value || file.kind === kindSelect.value));
    $('file-count').textContent = countLabel('link-count', filtered.length);
    $('file-list').innerHTML = filtered.length ? filtered.map(file => {
      const meta = [labels[file.kind], file.titleId, file.region, file.version && 'v' + file.version,
        file.firmware && 'FW ' + file.firmware, file.size].filter(Boolean).map(esc).join(' · ');
      const url = safeUrl(file.url);
      const action = file.direct
        ? `<a class="action secondary" href="${transferUrl(id, file.id)}">${label('download-options')} <span aria-hidden="true">→</span></a>`
        : url ? sourceLink(url, msg(file.landing ? 'source-download' : 'open-host'), {button: true}) : '';
      return `<article class="package-row">
        <div><h3>${esc(file.label || labels[file.kind] || msg('package'))}</h3><p class="meta-line">${meta}</p></div>
        ${action}
      </article>`;
    }).join('') : `<p class="empty-state">${label('no-packages')}</p>`;
  }
  regionSelect.addEventListener('change', renderFiles);
  kindSelect.addEventListener('change', renderFiles);
  $('copy-all').addEventListener('click', () => {
    const links = files.map(f => f.direct ? new URL(transferUrl(id, f.id), location.origin).href : safeUrl(f.url));
    copy([...new Set(links.filter(Boolean))].join('\n'), msg('links-copied'));
  });
  renderFiles();
}

async function library() {
  const controls = $('catalog-controls');
  const fields = ['query', 'platform', 'region', 'kind', 'sort'].map($);
  const [search, platform, region, kind, sort] = fields;
  const results = $('results'), state = $('catalog-state'), dialog = $('game-dialog');
  const more = $('more-results'), clear = $('clear-filters'), view = $('view-toggle');
  let visible = pageSize, list = false, data, titles, activeGame, request = 0;
  const sorted = new Map();
  try { list = localStorage.getItem('playstation-library-view') === 'list'; } catch {}
  const currentView = () => {
    results.classList.toggle('is-list', list);
    view.setAttribute('aria-pressed', String(list));
    view.textContent = msg(list ? 'grid-view' : 'list-view');
  };
  currentView();

  function loadFilters() {
    const params = query();
    for (const field of fields) {
      const value = params.get(field.name);
      field.value = field === search ? (value || '') :
        [...field.options].some(o => o.value === value) ? value : field.options[0].value;
    }
  }
  function writeFilters() {
    const url = new URL(location.href);
    for (const field of fields) {
      if (field.value && !(field === sort && field.value === 'recent')) url.searchParams.set(field.name, field.value);
      else url.searchParams.delete(field.name);
    }
    history.replaceState(history.state, '', url);
  }
  function sortTitles(key) {
    if (!sorted.has(key)) {
      const byName = (a, b) => a.name.localeCompare(b.name, locale, {sensitivity: 'base'});
      const knownSize = (a, b) => Number(!a.size) - Number(!b.size);
      const compare = {recent: (a,b) => b.timestamp - a.timestamp, az: byName, za: (a,b) => byName(b,a),
        count: (a,b) => b.count - a.count, largest: (a,b) => knownSize(a,b) || (b.size || 0) - (a.size || 0),
        smallest: (a,b) => knownSize(a,b) || (a.size || 0) - (b.size || 0)}[key];
      sorted.set(key, titles.slice().sort((a,b) => compare(a,b) || byName(a,b)));
    }
    return sorted.get(key);
  }
  function render(reset = true) {
    if (!data) return;
    if (reset) { visible = pageSize; writeFilters(); }
    const terms = normalize(search.value).split(/\s+/).filter(Boolean);
    const filtered = sortTitles(sort.value).filter(g =>
      (!platform.value || g.platform === platform.value) && terms.every(term => g.search.includes(term)) &&
      (!region.value || g.regions?.includes(region.value)) && (!kind.value || g.facets?.some(facet => {
        const [r, k] = facet.split(':');
        return k === kind.value && (!region.value || r === region.value);
      })));
    $('results-count').textContent = filtered.length === titles.length ? countLabel('listing-count', titles.length) :
      msg('filtered-count', {count: fmt.format(filtered.length), total: fmt.format(titles.length)});
    clear.hidden = ![search, platform, region, kind].some(f => f.value) && sort.value === 'recent';
    state.hidden = filtered.length > 0;
    state.textContent = msg('no-games');
    more.hidden = visible >= filtered.length;
    // Append the next page so previously loaded images and focus remain intact.
    const start = reset ? 0 : results.childElementCount;
    const cards = filtered.slice(start, visible).map(g => `
      <a href="${gameUrl(g.id)}" class="game-card" data-game="${g.id}">
        ${cover(g, true)}
        <div><p class="card-meta"><strong>${esc(g.platform)}</strong></p><h3>${esc(g.name)}</h3></div>
      </a>`).join('');
    if (reset) results.innerHTML = cards; else results.insertAdjacentHTML('beforeend', cards);
    if (!reset) results.children[start]?.focus();
  }

  async function open(id) {
    if (!gameId.test(id || '')) return;
    const serial = ++request;
    activeGame = id;
    $('game-detail').innerHTML = `<h2 id="game-title">${label('game-details')}</h2><p class="meta-line">${label('loading-links')}</p>`;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    try {
      const game = await getGame(id, (await index()).revision);
      if (serial !== request || !dialog.open) return;
      if (!game) throw Error('Listing not found');
      const titleIds = new Set(game.titleIds || []);
      const related = game.files.some(file => !file.landing) || !titleIds.size ? [] : (titles || []).filter(listing =>
        listing.id !== id && listing.platform === game.platform && listing.count > 0 &&
        listing.titleIds?.some(titleId => titleIds.has(titleId))).slice(0, 8);
      renderGame(id, game, region.value, kind.value, related);
    } catch {
      if (serial === request) $('game-detail').innerHTML = `<h2 id="game-title">${label('game-details')}</h2><p class="empty-state">${label('listing-error')}</p>`;
    }
  }

  let typing;
  controls.addEventListener('submit', event => { event.preventDefault(); clearTimeout(typing); render(); });
  search.addEventListener('input', () => { clearTimeout(typing); typing = setTimeout(render, 100); });
  fields.slice(1).forEach(field => field.addEventListener('change', () => render()));
  clear.addEventListener('click', () => { controls.reset(); render(); search.focus(); });
  more.addEventListener('click', () => { visible += pageSize; render(false); });
  view.addEventListener('click', () => {
    list = !list; currentView();
    try { localStorage.setItem('playstation-library-view', list ? 'list' : 'grid'); } catch {}
  });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-game]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const id = link.dataset.game;
    const url = new URL(location.href);
    url.searchParams.set('game', id);
    history.pushState({...history.state, libraryGame: true}, '', url);
    open(id);
  });
  dialog.addEventListener('close', () => {
    ++request;
    const id = activeGame;
    activeGame = null;
    if (query().get('game') === id) {
      if (history.state?.libraryGame) history.back();
      else {
        const url = new URL(location.href);
        url.searchParams.delete('game');
        history.replaceState(history.state, '', url);
      }
    }
  });
  window.addEventListener('popstate', () => {
    if (data) {
      const previous = fields.map(field => field.value);
      loadFilters();
      // Opening and closing a listing changes only the game parameter.
      // Keep the loaded results and the dialog's focus return target in place.
      if (fields.some((field, i) => field.value !== previous[i])) render();
    }
    const id = query().get('game');
    if (id && id !== activeGame) open(id);
    else if (!id && dialog.open) dialog.close();
  });
  $('open-help').addEventListener('click', () => $('help-dialog').showModal());
  for (const modal of [dialog, $('help-dialog')]) {
    modal.addEventListener('click', event => {
      if (event.target !== modal) return;
      const r = modal.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) modal.close();
    });
  }
  try {
    data = await index();
    titles = data.titles.map(g => ({...g, timestamp: listedDate(g.date) || 0, search: searchText(g)}));
    region.append(...[...new Set(titles.flatMap(g => g.regions || []))].sort().map(regionOption));
    $('library-totals').textContent = countLabel('listing-count', data.stats.titles) + ' · ' + countLabel('package-count', data.stats.links);
    loadFilters();
    render();
    if (query().has('game')) open(query().get('game'));
  } catch {
    $('results-count').textContent = msg('catalog-unavailable');
    state.hidden = false;
    state.innerHTML = `${label('catalog-error')} <a href="${esc(location.pathname + location.search)}">${label('reload')}</a> · <a href="https://onlygames.pages.dev/">${label('source-catalog')}</a>`;
  }
}

async function download() {
  const card = $('transfer-card');
  const id = query().get('game'), fileId = query().get('file');
  const back = $('back-to-game');
  const gameLink = new URL(root, location.origin);
  if (gameId.test(id || '')) {
    gameLink.searchParams.set('game', id);
    back.href = gameLink;
    back.textContent = '← ' + msg('back-to-list');
  }
  try {
    if (!gameId.test(id || '') || !/^[a-f0-9]{16}(?:-\d+)?$/.test(fileId || '')) throw Error('Invalid package link');
    const game = await getGame(id, (await index()).revision);
    const file = game?.files.find(candidate => candidate.id === fileId);
    if (!file) throw Error('Unknown package');
    // The static link lets the Pages builder substitute its pinned raw URL
    // when this exact archived package is served outside GitHub Pages.
    const directLink = [...$('direct-files').content.querySelectorAll('[data-file]')].find(a => a.dataset.file === file.direct);
    const direct = Boolean(directLink);
    const url = safeUrl(directLink?.getAttribute('href') || file.url);
    if (!url) throw Error('Invalid source URL');
    const title = file.label || labels[file.kind] || msg('package');
    const date = listedDate(game.date);
    const sourceDetails = [sourceLink(file.source || game.page, msg('source-listing')),
      Number.isFinite(date) ? label('listed-date', {date: dateFmt.format(date)}) : ''].filter(Boolean);
    const metadata = [['host', host(url)], ['package', labels[file.kind]], ['title-id', file.titleId],
      ['region', file.region], ['version', file.version], ['firmware', file.firmware], ['size', file.size],
      ['variant', file.variant], ['edition', file.edition]];
    document.title = game.name + ' | ' + document.title;
    card.innerHTML = `
      <div class="transfer-title">${cover(game)}
        <div><p class="label-line">${esc(game.platform)} / ${label(direct ? 'direct' : 'external')}</p>
        <p class="meta-line">${esc(game.name)}</p></div>
      </div>
      <h1>${esc(title)}</h1>
      <dl class="transfer-meta">${metadata.filter(([, value]) => value).map(([key,value]) => `<div><dt>${label(key)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>
      ${file.section ? `<p class="meta-line">${label('source-label')} ${esc(file.section)}</p>` : ''}
      <p>${label(direct ? 'direct-note' : 'host-note')}</p>
      <div class="transfer-actions">
        <a id="download-action" class="action primary" href="${esc(url)}" ${direct ? 'download rel="noreferrer"' : 'target="_blank" rel="noopener noreferrer"'}>${direct ? label('download-file') + ' ↓' : label('continue', {host: host(url)}) + ' ↗'}</a>
        <button type="button" class="action secondary" data-copy="${esc(url)}">${label('copy-link')} <span aria-hidden="true">⧉</span></button>
      </div>
      ${isSuperPSX(game) ? `<p class="detail-note">${label('password-note')} <button type="button" class="inline-copy" data-copy="SuperPSX">SuperPSX <span aria-hidden="true">⧉</span></button></p>` : ''}
      ${game.notes ? `<details class="source-notes"><summary>${label('source-notes')}</summary><p>${esc(game.notes)}</p></details>` : ''}
      ${sourceDetails.length ? `<p class="library-source">${sourceDetails.join(' · ')}</p>` : ''}`;
  } catch {
    card.innerHTML = `<h1>${label('package-unavailable')}</h1><p>${label('package-error')}</p><a class="action secondary" href="${esc(root)}">${label('browse-library')} →</a>`;
  }
}

if ($('results')) library();
if ($('transfer-card')) download();
