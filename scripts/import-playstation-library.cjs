'use strict';

// Import public catalog metadata from a saved OnlyGames HTML response.
// This script does not load reference JavaScript or download packages.
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const addOns = require('../docs/ps4-game-add-ons.json');

const root = path.resolve(__dirname, '..');
const source = 'https://onlygames.pages.dev/';
const hash = value => createHash('sha256').update(value).digest('hex');
const shard = id => (parseInt(id.slice(0, 2), 16) % 32).toString(16).padStart(2, '0');
const compact = object => Object.fromEntries(Object.entries(object).filter(([,value]) => value !== '' && value != null && (!Array.isArray(value) || value.length)));
const clean = value => String(value ?? '').trim();
const unique = values => [...new Set(values.filter(Boolean))];

function upstream(value) {
  if (!value) return '';
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw Error('Unexpected upstream URL');
  if ([...url.searchParams.keys()].some(key => /^(?:token|expires|signature|sig|hm|x-amz-signature)$/i.test(key))) {
    throw Error('Temporary signed link requires a stable source page before import');
  }
  return value;
}

function sizeBytes(text) {
  const m = /^([\d.,]+)\s*(B|KB|MB|GB|TB|KiB|MiB|GiB|TiB)$/i.exec(clean(text));
  if (!m) return 0;
  const unit = m[2].toUpperCase();
  return Number(m[1].replace(',', '.')) * (unit.includes('I') ? 1024 : 1000) ** 'BKMGT'.indexOf(unit[0]);
}

const regionKey = value => ({US: 'USA', EU: 'EUR'}[value] || value || 'Unspecified');
const idPattern = /\b(?:CUSA|PPSA)\d{5}\b/gi;

function localEntries() {
  return addOns.games.map((g, i) => {
    const base = '/console/ps4/';
    const guide = base + 'game-downloads.html';
    const links = [
      {label: 'Base game + update ' + g.update, kind: 'bundle', version: g.update, title_id: g.titleId, url: g.bundlePage},
      {label: 'Base game + update folder', kind: 'bundle', version: g.update, title_id: g.titleId, url: g.updateFolder},
      {label: 'Season Pass source', kind: 'dlc', title_id: g.titleId, url: addOns.dlcPost, source_url: base + 'dlcs.html#' + g.id}
    ];
    if (i === 1) links.push({
      label: 'Multiplayer and Zombies crash fix', kind: 'fix', version: '1.11', title_id: 'CUSA57548',
      url: '/downloads/ps4-ps5/bo2-fpkg-111-crash-fix/BO2_ZMMP_CrashFix.pkg', direct: 'bo2-fpkg-111',
      source_url: base + 'fpkg-fixes.html#resource-bo2-fpkg-111-crash-fix'
    });
    return {name: 'Call of Duty: ' + g.title, title_id: g.titleId, platform: 'PS4', source: 'WhatWhatBoy',
      cover_image: '/assets/images/covers/cod-' + g.id + '.jpg', page_url: guide, release_links: links,
      description: 'The VikingFile folder lists a combined base game and update marked [5.05]. The Season Pass source may require Discord access.'};
  });
}

function convert(html) {
  const payload = /<script\b[^>]*\bid="onlygamesEmbeddedCatalog"[^>]*>([\s\S]*?)<\/script\s*>/i.exec(html)?.[1];
  if (!payload) throw Error('OnlyGames catalog was not found');
  const catalog = JSON.parse(payload);
  if (!catalog.records?.length) throw Error('OnlyGames catalog has no records');
  const details = Array.from({length: 32}, () => ({}));
  const titles = [];
  const ids = new Set();
  let links = 0;
  for (const [records, local] of [[catalog.records, false], [localEntries(), true]]) for (const record of records) {
    const {platform, name, cover_image, page_url, release_date} = record;
    if (!['PS4', 'PS5'].includes(platform) || !name || !Array.isArray(record.release_links)) throw Error('Unexpected title record');
    const id = hash(JSON.stringify([platform, local ? '' : page_url, record.title_id, name])).slice(0, 16);
    if (ids.has(id)) throw Error('Duplicate game identity: ' + name);
    ids.add(id);
    const check = value => local && /^\/(?!\/)/.test(value || '') ? value : upstream(value);
    const duplicates = new Map();
    const fileRows = record.release_links.map(link => {
      if (!link.url) throw Error('Missing package URL for ' + name);
      const url = check(link.url);
      const pkg = compact({
        url, label: clean(link.label || link.source_label), kind: clean(link.kind) || 'other',
        region: clean(link.region), titleId: clean(link.title_id || record.title_id),
        version: clean(link.version), firmware: clean(link.firmware || link.min_fw),
        size: clean(link.size), variant: clean(link.variant), edition: clean(link.edition),
        section: clean(link.source_section), source: check(link.source_url),
        direct: local ? link.direct : undefined
      });
      const key = hash(JSON.stringify(pkg)).slice(0, 16);
      const occurrence = (duplicates.get(key) || 0) + 1;
      duplicates.set(key, occurrence);
      return {id: occurrence === 1 ? key : key + '-' + occurrence, ...pkg};
    });
    // Refuse to silently drop any links if the upstream schema changes.
    const urls = new Set(fileRows.map(link => link.url));
    for (const url of Object.values(record.download_links || {}).flat()) {
      if (!urls.has(url)) throw Error('Unclassified source URL for ' + name);
    }
    const notes = clean(record.description);
    const titleIds = unique([record.title_id, ...fileRows.map(x => x.titleId), ...(notes.match(idPattern) || [])]);
    const facets = unique(fileRows.map(file => regionKey(file.region) + ':' + file.kind));
    const regionsInNotes = local ? [] : /^(?:Region|Tags):\s*(.+)$/im.exec(notes)?.[1].match(/\b(?:USA|EUR|JPN|ASIA|UK)\b/g) || [];
    const noteSize = sizeBytes(/^Size:\s*(.+)$/im.exec(notes)?.[1]);
    const size = Math.max(noteSize, 0, ...fileRows.map(file => sizeBytes(file.size)));
    titles.push(compact({id, name, platform, cover: check(cover_image), titleIds,
      count: fileRows.length, facets, regions: unique([...facets.map(x => x.split(':')[0]), ...regionsInNotes]),
      date: release_date, size: size || undefined, source: record.source}));
    details[parseInt(shard(id), 16)][id] = compact({
      name, platform, cover: check(cover_image), titleIds, date: release_date, source: record.source,
      page: check(page_url), sourcePages: (record.download_pages || []).map(check), notes, files: fileRows
    });
    links += fileRows.length;
  }
  // Include the site entries and the importer output in the cache key.
  const revision = hash(JSON.stringify(details)).slice(0, 16);
  const stats = {referenceTitles: catalog.records.length, referenceLinks: links - localEntries().reduce((n, r) => n + r.release_links.length, 0), titles: titles.length, links};
  return {index: {source, revision, stats, titles}, details};
}

function write(input, out) {
  const {index, details} = convert(fs.readFileSync(input, 'utf8'));
  fs.mkdirSync(out, {recursive: true});
  for (const [i, games] of details.entries()) {
    const entries = Object.entries(games).map(([id, record]) => `"${id}":${JSON.stringify(record)}`);
    fs.writeFileSync(path.join(out, i.toString(16).padStart(2, '0') + '.json'), '{\n' + entries.join(',\n') + '\n}\n');
  }
  const {titles, ...metadata} = index;
  fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(metadata).slice(0, -1) +
    ',\n"titles":[\n' + titles.map(record => JSON.stringify(record)).join(',\n') + '\n]}\n');
  return index.stats;
}

module.exports = {convert, shard, write};
if (require.main === module) {
  if (!process.argv[2]) throw Error('Usage: node scripts/import-playstation-library.cjs <saved-reference.html>');
  console.log(write(process.argv[2], path.join(root, 'assets/playstation-library')));
}
