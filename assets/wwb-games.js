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


const platformAliases = {
  xbox: 'ogxbox xbox classic first generation xbox',
  xbox360: 'xbox360 x360',
  wii: 'nintendo wii',
  wiiu: 'nintendo wii u wiiu',
  'nintendo-switch': 'nintendo switch nswitch',
  ds: 'nintendo ds nds',
  '3ds': 'nintendo 3ds n3ds'
};
const numberedTitles = ['', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix'];
const titleAliases = [
  [/^halo combat evolved\b/, 'haloce'],
  [/^grand theft auto 3\b/, 'gta gta3'],
  [/^grand theft auto 4\b/, 'gta gta4'],
  [/^grand theft auto 5\b/, 'gta gta5'],
  [/^grand theft auto san andreas\b/, 'gta gtasa'],
  [/^grand theft auto vice city\b/, 'gta gtavc'],
  [/^call of duty\b/, 'cod'],
  [/^call of duty modern warfare 2\b/, 'mw2'],
  [/^call of duty modern warfare 3\b/, 'mw3'],
  [/^call of duty world at war\b/, 'waw'],
  [/^(?:the )?legend of zelda\b/, 'loz'],
  [/^(?:the )?legend of zelda breath of the wild\b/, 'botw'],
  [/^(?:the )?legend of zelda tears of the kingdom\b/, 'totk'],
  [/^(?:the )?legend of zelda twilight princess\b/, 'zeldatp'],
  [/^mario kart 7\b/, 'mk7'],
  [/^mario kart 8\b/, 'mk8'],
  [/^mario kart wii\b/, 'mkwii'],
  [/^new super mario bros\b/, 'nsmb'],
  [/^super smash bros\b/, 'ssb']
];
const exactAliases = new Set([...titleAliases.flatMap(([, names]) => names.split(' ')), 'bo1', 'bo2', 'bo3', 'bo4', 'ogxbox']);

function searchText(game, system) {
  const title = normalize(game.title);
  const numbered = title.replace(/\b(i|ii|iii|iv|v|vi|vii|viii|ix)\b/g, numeral => numberedTitles.indexOf(numeral));
  const roman = title.replace(/\b[1-9]\b/g, number => numberedTitles[number]);
  const blackOps = numbered.match(/^call of duty black ops(?: ([1-4])\b|\b(?! \d))/);
  const aliases = titleAliases.filter(([pattern]) => pattern.test(numbered)).map(([, names]) => names);
  if (blackOps) {
    const number = blackOps[1] || '1';
    aliases.push('bo' + number);
  }
  const metadata = normalize([system.textContent, ...(game.genres || []), ...(game.regions || []), game.version, game.languages].join(' '));
  return ' ' + [...new Set([title, numbered, roman, ...aliases, metadata, platformAliases[system.value]])].join(' ') + ' ';
}

function load(system) {
  if (!catalogs.has(system.value)) {
    const request = fetch('/assets/wwb-games/' + system.value + '.json?v=1')
      .then(response => {
        if (!response.ok) throw Error('Catalog unavailable');
        return response.json();
      })
      .then(rows => rows.map(row => ({
        ...row, platform: system.textContent,
        search: searchText(row, system)
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
  const terms = normalize(search.value)
    .replace(/\b(halo ce|zelda tp|og xbox|gta (?:sa|vc|[345])|bo [1-4])\b/g, alias => alias.replaceAll(' ', ''))
    .replace(/\bgta (iii|iv|v)\b/g, (_, numeral) => 'gta' + numberedTitles.indexOf(numeral))
    .split(' ').filter(Boolean)
    .map(term => exactAliases.has(term) ? ' ' + term + ' ' : term);
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
      ' listings could not be loaded. Reload the page to try again.';
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
