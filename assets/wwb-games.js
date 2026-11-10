const $ = id => document.getElementById(id);
const form = $('catalog-controls');
const search = $('query');
const platform = $('platform');
const genre = $('genre');
const sort = $('sort');
const results = $('results');
const state = $('catalog-state');
const more = $('more-results');
const clear = $('clear-filters');
const view = $('view-toggle');
const fields = [search, platform, genre, sort];
const systems = [...platform.options].filter(option => option.value);
const fmt = new Intl.NumberFormat(document.documentElement.lang);
const byTitle = new Intl.Collator(document.documentElement.lang, {sensitivity: 'base', numeric: true});
const pageSize = 24;
const catalogs = new Map();
const normalize = text => text.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const esc = text => String(text).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
let titles = [];
let limit = pageSize;
let request = 0;
let savedView;
try { savedView = localStorage.getItem('wwb-games-view'); } catch {}
let list = savedView === 'list';

function setView() {
  results.classList.toggle('is-list', list);
  view.setAttribute('aria-pressed', String(list));
  view.textContent = list ? 'Grid view' : 'List view';
}
setView();
view.addEventListener('click', () => {
  list = !list;
  setView();
  savedView = list ? 'list' : 'grid';
  try { localStorage.setItem('wwb-games-view', savedView); } catch {}
});

function load(system) {
  if (!catalogs.has(system.value)) {
    const request = fetch('/assets/wwb-games/' + system.value + '.json?v=1')
      .then(response => {
        if (!response.ok) throw Error('Catalog unavailable');
        return response.json();
      })
      .then(rows => rows.map(row => ({
        ...row, platform: system.textContent,
        search: normalize([row.title, system.textContent, ...(row.genres || []), ...(row.regions || []), row.version, row.languages].join(' '))
      })));
    catalogs.set(system.value, request);
    request.catch(() => catalogs.delete(system.value));
  }
  return catalogs.get(system.value);
}

function updateUrl() {
  const url = new URL(location.href);
  for (const field of fields) {
    if (field.value) url.searchParams.set(field.name, field.value);
    else url.searchParams.delete(field.name);
  }
  history.replaceState(history.state, '', url);
}

function card(game) {
  const tags = game.genres || [];
  const details = [...(game.regions || []), game.version && 'v' + game.version, game.languages].filter(Boolean);
  const image = game.cover
    ? '<img src="' + esc(game.cover) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">' : '';
  return '<a class="game-card" href="' + esc(game.url) + '" target="_blank" rel="noopener noreferrer">' +
    '<div class="cover" aria-hidden="true"><span>' + esc(game.platform) + '</span>' + image + '</div>' +
    '<div><p class="card-meta"><strong>' + esc(game.platform) + '</strong>' + details.map(detail => '<span>' + esc(detail) + '</span>').join('') + '</p><h3>' + esc(game.title) + '</h3>' +
    (tags.length ? '<p class="genre-labels">' + tags.map(tag => '<span>' + esc(tag) + '</span>').join('') + '</p>' : '') +
    '</div></a>';
}

function render(reset = true) {
  if (reset) {
    limit = pageSize;
    updateUrl();
  }
  const terms = normalize(search.value).split(' ').filter(Boolean);
  const matches = titles.filter(game => terms.every(term => game.search.includes(term)) &&
    (!genre.value || game.genres?.includes(genre.value)));
  if (sort.value === 'za') matches.reverse();
  $('results-count').textContent = fmt.format(matches.length) + ' of ' + fmt.format(titles.length) + ' listings';
  clear.hidden = !fields.some(field => field.value);
  state.hidden = matches.length !== 0;
  state.textContent = 'No games match these filters.';
  more.hidden = limit >= matches.length;
  const start = reset ? 0 : results.childElementCount;
  const html = matches.slice(start, limit).map(card).join('');
  if (reset) results.innerHTML = html;
  else {
    results.insertAdjacentHTML('beforeend', html);
    results.children[start]?.focus();
  }
}

async function selectPlatform(preferredGenre = genre.value) {
  const serial = ++request;
  const selected = platform.value ? systems.filter(system => system.value === platform.value) : systems;
  form.setAttribute('aria-busy', 'true');
  genre.disabled = true;
  sort.disabled = true;
  search.disabled = true;
  clear.hidden = true;
  more.hidden = true;
  results.replaceChildren();
  $('results-count').textContent = 'Loading game listings…';
  $('catalog-warning').hidden = true;
  state.hidden = true;

  const loaded = await Promise.allSettled(selected.map(load));
  if (serial !== request) return;
  const failed = selected.filter((_, index) => loaded[index].status === 'rejected');
  titles = loaded.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  titles.sort((a, b) => byTitle.compare(a.title, b.title));
  if (!savedView) {
    list = selected.length === 1 && selected[0].value === 'xbox';
    setView();
  }
  const allGenres = [...new Set(titles.flatMap(game => game.genres || []))].sort();
  genre.replaceChildren(new Option('All genres', ''), ...allGenres.map(name => new Option(name)));
  genre.value = allGenres.includes(preferredGenre) ? preferredGenre : '';
  genre.disabled = !allGenres.length;
  sort.disabled = search.disabled = false;
  form.removeAttribute('aria-busy');
  render();
  if (failed.length) {
    $('catalog-warning').hidden = false;
    $('catalog-warning').textContent = 'The ' + failed.map(option => option.textContent).join(', ') +
      ' listings could not be loaded. You can still browse the original catalogs below.';
  }
}

document.addEventListener('error', event => {
  if (event.target.matches?.('.cover img')) event.target.remove();
}, true);

const initial = new URLSearchParams(location.search);
search.value = initial.get('q') || '';
if (systems.some(system => system.value === initial.get('platform'))) platform.value = initial.get('platform');
if (initial.get('sort') === 'za') sort.value = 'za';

form.addEventListener('submit', event => { event.preventDefault(); render(); });
search.addEventListener('input', () => render());
platform.addEventListener('change', () => selectPlatform());
genre.addEventListener('change', () => render());
sort.addEventListener('change', () => render());
clear.addEventListener('click', async () => {
  form.reset();
  await selectPlatform('');
  search.focus();
});
more.addEventListener('click', () => { limit += pageSize; render(false); });
selectPlatform(initial.get('genre') || '');
