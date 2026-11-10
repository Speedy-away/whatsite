'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');

const root = path.join(__dirname, '..');
const snapshotDir = process.argv[2];
if (!snapshotDir) throw Error('Pass a directory containing the public catalog snapshots.');
const read = name => JSON.parse(fs.readFileSync(path.join(snapshotDir, name + '.json'), 'utf8'));
const output = path.join(root, 'assets/wwb-games');

function text(value) {
  const entities = {amp:'&', apos:"'", quot:'"', lt:'<', gt:'>', nbsp:' ', ndash:'–', mdash:'—', hellip:'…', rsquo:'’', lsquo:'‘', rdquo:'”', ldquo:'“', trade:'™', reg:'®', copy:'©', eacute:'é', ouml:'ö'};
  return value.replace(/<[^>]*>/g, '').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, name) => {
    if (name[0] !== '#') return entities[name] ?? entity;
    const code = name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  }).replace(/\uFEFF/g, '').replace(/\s+/g, ' ').trim();
}

function secureUrl(value, expectedHost) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password && (!expectedHost || url.hostname === expectedHost)) return url.href;
  } catch {}
  return '';
}

function posts(platform) {
  const first = read(platform + '-1');
  const rows = Array.from({length:first.pages}, (_, i) => i === 0 ? first.rows : read(platform + '-' + (i + 1)).rows).flat();
  if (rows.length !== first.total || new Set(rows.map(post => post.id)).size !== rows.length ||
      rows.some(post => !Number.isSafeInteger(post.id))) throw Error('Incomplete snapshot for ' + platform);
  return rows;
}

const genreNames = new Set([
  'Action', 'Adventure', 'Arcade', 'Board', 'Card', 'Casual', 'Classic', 'Dancing', 'Education', 'Edutainment',
  'Fighting', 'First-Person', 'Flight', 'Horror', 'Hunting', 'Kids', 'Music', 'Narrative adventure', 'Party',
  'Pinball', 'Platformer', 'Puzzle', 'Racing', 'RPG', 'Shooter', 'Simulation', 'Sports', 'Strategy', 'Tabletop',
  'Third-Person', 'Training', 'Turn-Based', 'Visual Novel', 'Zombies'
]);

function categoryLabels(host) {
  return new Map(read(host + '-categories').rows.map(term => {
    const name = text(term.name).replace(/\s+PS[2-5]$/i, '');
    return [term.id, name === 'Sport' ? 'Sports' : name];
  }));
}

function genres(categories, labels) {
  return [...new Set(categories.map(id => labels.get(id)).filter(name => genreNames.has(name)))].sort();
}

function wordpress(platform, host) {
  const labels = categoryLabels(host);
  const coversFile = path.join(snapshotDir, platform + '-covers.json');
  const covers = fs.existsSync(coversFile) ? read(platform + '-covers') : {};
  return posts(platform).map(post => {
    const title = text(post.title.rendered);
    const url = secureUrl(post.link, host);
    if (!title || !url) throw Error('Invalid listing: ' + platform + ' ' + post.id);
    const cover = secureUrl(text(post.yoast_head_json?.og_image?.[0]?.url || covers[post.id] || ''));
    const tags = genres(post.categories, labels);
    return {title, url, ...(cover && {cover}), ...(tags.length && {genres:tags})};
  });
}


function xboxTitleKey(name) {
  return text(name).normalize('NFKD').toLowerCase()
    .replace(/^(the|an?)\s+|,\s*(the|an?)(?=$|[:(])/g, '')
    .replace(/\s*\((?:disc|disk) \d+[^)]*\)/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

function xboxGenres() {
  const matches = new Map();
  const aliases = new Map([
    ['Action Adventure', ['Action', 'Adventure']], ['Action RPG', ['Action', 'RPG']],
    ['Role-Playing', ['RPG']], ['Sim', ['Simulation']], ['Sport', ['Sports']],
    ['Rhythm', ['Music']], ['Beat-\'Em-Up', ['Fighting']]
  ]);
  for (const row of read('xbox-synopsis')) {
    const key = xboxTitleKey(row.title);
    const names = text(row.genre).split(',').map(value => value.trim());
    const tags = names.flatMap(name => aliases.get(name) || [name]).filter(name => genreNames.has(name));
    if (!key || !tags.length) continue;
    const previous = matches.get(key);
    matches.set(key, previous ? previous.filter(tag => tags.includes(tag)) : [...new Set(tags)].sort());
  }
  return matches;
}


function originalXbox() {
  const listings = new Map();
  const labels = xboxGenres();
  for (const letter of [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'number']) {
    const name = 'xbox-full-' + letter;
    const first = read(name);
    const pages = [...new Set([...first.matchAll(/href="[^"]*\?page=(\d+)"/g)].map(match => match[1]))];
    for (const html of [first, ...pages.map(page => read(name + '-' + page))]) {
      const list = html.match(/<\/caption\s*>\s*(<tr[\s\S]*?)<\/table>/i)?.[1];
      if (!list && !/No (?:games|results|matches)/i.test(html)) throw Error('Missing Xbox list: ' + letter);
      for (const [row] of (list || '').matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)) {
        const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)];
        const [, link, title] = cells[0][1].match(/<a href="(\/vault\/\d+(?:\?[^"]*)?)"[^>]*>([^<]+)<\/a>/i) || [];
        if (!link) throw Error('Missing Xbox listing link: ' + letter);
        const url = secureUrl('https://vimm.net' + text(link), 'vimm.net');
        const regions = [...cells[1][1].matchAll(/<img\b[^>]*class="flag"[^>]*title="([^"]+)"/gi)].map(flag => text(flag[1]));
        const version = text(cells[2][1]);
        const languages = text(cells[3][1]);
        const tags = labels.get(xboxTitleKey(title));
        listings.set(url, {title:text(title), url, ...(regions.length && {regions}),
          ...(/^\d/.test(version) && {version}), ...(languages !== '-' && languages && {languages}),
          ...(tags?.length && {genres:tags})});
      }
    }
  }
  return [...listings.values()];
}

function playStationGenres() {
  const index = JSON.parse(fs.readFileSync(path.join(root, 'assets/playstation-library/index.json'), 'utf8'));
  const tagged = new Map();
  const titleKeys = new Map();
  const byId = new Map(index.titles.map(row => [row.id, row]));
  const key = row => row.platform + ' ' + row.name.normalize('NFKD').toLowerCase()
    .replace(/\b(?:ps[2-5]|psp|ps vita)$/, '').replace(/[^\p{L}\p{N}]/gu, '');
  for (const [platform, slug] of Object.entries({PS2:'ps2',PS3:'ps3',PS4:'ps4',PS5:'ps5',PSP:'psp','PS Vita':'psvita'})) {
    const provider = ['psp','psvita'].includes(slug) ? 'downloadgamepsp' : 'dlpsgame';
    const labels = categoryLabels(provider + (provider === 'dlpsgame' ? '.com' : '.org'));
    for (const post of posts(slug)) {
      const id = createHash('sha256').update(provider + ':' + platform + ':' + post.id).digest('hex').slice(0,16);
      const row = byId.get(id);
      const tags = genres(post.categories, labels);
      if (!row || !tags.length) continue;
      tagged.set(id, tags);
      for (const matchKey of [key(row), ...(row.titleIds || []).map(titleId => platform + ':' + titleId)]) {
        if (!titleKeys.has(matchKey)) titleKeys.set(matchKey, new Set());
        titleKeys.get(matchKey).add(JSON.stringify(tags));
      }
    }
  }
  for (const row of index.titles) {
    if (tagged.has(row.id)) continue;
    const candidates = new Set([key(row), ...(row.titleIds || []).map(titleId => row.platform + ':' + titleId)]
      .flatMap(matchKey => [...(titleKeys.get(matchKey) || [])]));
    if (candidates.size === 1) tagged.set(row.id, JSON.parse([...candidates][0]));
  }
  return Object.fromEntries(tagged);
}

const imports = {};
const platforms = ['xbox', 'xbox360', 'wii', 'wiiu', 'nintendo-switch', 'ds', '3ds', 'playstation'];
for (const platform of process.argv.slice(3).length ? process.argv.slice(3) : platforms) {
  if (!platforms.includes(platform)) throw Error('Unknown platform: ' + platform);
  imports[platform] = platform === 'xbox' ? originalXbox()
    : platform === 'playstation' ? playStationGenres()
    : wordpress(platform, platform === 'xbox360' ? 'dlxbgame.com' : 'nswgf.com');
}

fs.mkdirSync(output, {recursive:true});
for (const [platform, rows] of Object.entries(imports)) {
  const file = platform === 'playstation'
    ? path.join(root, 'assets/playstation-library/genres.json')
    : path.join(output, platform + '.json');
  fs.writeFileSync(file, JSON.stringify(rows) + '\n');
  console.log(platform, Object.keys(rows).length, 'listings');
}
