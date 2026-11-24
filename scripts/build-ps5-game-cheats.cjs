// Native PS5 definitions only. Saving and enabling cheats remain separate actions.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {page, section, grid, resource, link, ps5nav} = require('./build-console-guides.cjs');
const root = path.resolve(__dirname, '..');
const otherGamesURL = '/console/ps5/game-cheats.html';
const featuredGameSlug = 'gta-v';
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const h = value => String(value || '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const fallback = '/assets/images/consoles/ps5-featured-image.avif';
const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function validateIdentity(entry) {
  if (!/^PPSA\d{5}$/.test(entry.titleId) || !/^\d{2}\.\d{3}\.\d{3}$/.test(entry.gameVersion) || !['JSON','MC4','SHN'].includes(entry.format) || entry.filename!==entry.titleId+'_'+entry.gameVersion+'.'+entry.format.toLowerCase()) throw Error('Invalid native PS5 identity: '+entry.id);
}
function collect() {
  const extra = [...read('docs/ps5-native-extra-cheats.json').resources,
    ...read('docs/ps5-native-batch5.json').resources];
  const old = read('docs/host-current-cheat-actions.json').actions.filter(item => item.platform === 'ps5' && item.titleIds?.every(id=>/^PPSA\d{5}$/.test(id)));
  const files = read('docs/download-audit.json').items.flatMap(item=>item.status==='downloaded' ? item.files || [] : []);
  const entries = [...extra, ...old.map(item=>({
    ...item, name:item.label, gameSlug:slug(item.game), gameVersion:item.gameVersion,
    titleId:item.titleIds[0], filename:path.posix.basename(item.downloadURL),
    url:item.downloadURL, image:item.image || fallback,
    preparation:item.requirements.join(' '), installationPath:item.installPath,
    platforms:['ps5'], format:item.format
  }))];
  const groups = new Map();
  for (const entry of entries) {
    validateIdentity(entry);
    // A site rebuild can use the verified archive record when the backup drive is offline.
    const file = files.find(file => file.local === entry.url && file.sha256 === entry.sha256 && file.bytes === entry.bytes &&
      file.backupPath && ((file.archiveAvailability === 'present' && file.archiveCheckedAt) || fs.existsSync(file.backupPath)));
    if (!file || !entry.url?.startsWith('/downloads/')) continue;
    const local = path.resolve(root, '.' + decodeURIComponent(entry.url));
    if (!local.startsWith(path.join(root,'downloads') + path.sep) || !fs.existsSync(local) || fs.statSync(local).size!==entry.bytes) continue;
    if (createHash('sha256').update(fs.readFileSync(local)).digest('hex') !== entry.sha256) continue;
    const key = entry.gameSlug || slug(entry.game);
    if (!/^[a-z0-9-]+$/.test(key)) throw Error('Invalid game slug');
    if (!groups.has(key)) groups.set(key,{slug:key,title:entry.game,image:require('./ps4-ps5-card-images.cjs').gameImage(key,entry.game)||entry.image||fallback,files:[]});
    groups.get(key).files.push(entry);
  }
  return [...groups.values()];
}
function gameURL(game) { return '/console/ps5/game-cheats/'+game.slug+'/'; }
function gameCard(game) {
  const builds = game.files.length === 1 ? '1 build' : game.files.length + ' builds';
  const search = game.files.map(file => file.titleId.toLowerCase() + ' ' + file.gameVersion).join(' ');
  return resource(h(game.title), builds + ' · native PS5', link(gameURL(game), 'View downloads'), game.image === fallback ? '' : game.image)
    .replace('data-search="', 'data-search="' + search + ' ');
}
function cards(games = collect()) {
  return grid(...games.map(gameCard));
}
function rows(game) {
  return game.files.map(file=>`<article class="guide-resource multicod-card"><img src="${h(game.image)}" alt="${h(game.title)} artwork" loading="lazy" decoding="async"><h3>${h(file.titleId)} · ${h(file.gameVersion)}</h3><p>${h(file.format)} cheat file</p><div class="guide-links"><a class="btn btn-outline" href="${h(file.url)}" download="${h(file.filename)}" data-no-file-options>Download</a><a class="btn btn-primary" href="/console/ps5/downloads.html?file=${encodeURIComponent(file.id)}#files">Save on PS5</a></div><details class="multicod-details"><summary>Setup &amp; source</summary><p>${h(file.preparation)}</p>${file.cheats?.length?`<p>Included options: ${file.cheats.map(h).join('; ')}.</p>`:''}${file.cheatDetails?.length?`<ul>${file.cheatDetails.map(option=>`<li>${h(option.name)}: ${h(option.description)}</li>`).join('')}</ul>`:''}${file.credits?.length?`<p>Credits: ${file.credits.map(h).join(', ')}</p>`:''}${file.metadataValidation?`<p>${h(file.metadataValidation)}</p>`:''}<p>Destination: <code>${h(file.installationPath)}</code></p><p><a href="${h(file.source)}" target="_blank" rel="noopener noreferrer">Publisher source</a>${file.licenceDownload?` · <a href="${h(file.licenceDownload)}">Licence</a>`:''}</p><code class="console-file-hash">SHA-256 ${h(file.sha256)}</code></details></article>`).join('');
}
function build({indexOnly = false} = {}) {
  const games = collect();
  const nav = [...ps5nav,[otherGamesURL,'Native game cheats']];
  const index = otherGamesURL.slice(1);
  const pages = [index];
  for (const game of indexOnly ? [] : games) {
    const file = gameURL(game).slice(1)+'index.html'; pages.push(file);
    page(file,game.title+' · PS5 Cheats','Native PS5 cheat downloads. Match the PPSA title ID and installed game update.',game.image,nav,
      section('files','Choose your installed build',grid(rows(game)))+
      section('setup','Use with your cheat manager','<p>Save the file, then follow Setup &amp; source for its folder and matching game build. Enable individual options through the compatible cheat manager.</p>')+
      section('more-games','More native PS5 games',`<div class="guide-links">${link(otherGamesURL,'All native PS5 cheats')}${link('/console/ps5/mods.html','Game mods')}</div>`),'#files','View downloads');
  }
  const otherGames = games.filter(game => game.slug !== featuredGameSlug).sort((a, b) => a.title.localeCompare(b.title, 'en'));
  const search = `<div class="extra-game-filter"><label for="extraGameSearch">Search games, title IDs or updates</label>
    <input id="extraGameSearch" type="search" placeholder="Find a game, PPSA title ID or update…" autocomplete="off">
    <p id="extraGameCount" role="status" aria-live="polite">${otherGames.length} game collections</p></div>`;
  const gta = games.find(game => game.slug === featuredGameSlug);
  const related = (gta ? link(gameURL(gta), 'GTA V downloads') : '') +
    link('/console/ps4/game-patches.html#native-ps5-patches', 'FPS &amp; graphics patches');
  page(index, 'Other Games · PS5', 'Browse native PS5 cheat downloads by game, PPSA title ID or game update.', fallback, nav,
    section('games', 'Choose a game', search +
      cards(otherGames).replace('<div class="games-grid">', '<div class="games-grid" data-extra-game-grid>') +
      '<p id="extraGameEmpty" hidden>No matching games.</p>') +
    section('compatibility', 'PS5 game builds', '<p>Match the PPSA title ID and update to your installed game.</p><div class="guide-links">' + related + '</div>') +
    '<script defer src="/assets/console-extra-games.js"></script>', '#games', 'Browse games');
  const target = path.join(root, index);
  const html = fs.readFileSync(target, 'utf8');
  fs.writeFileSync(target, html.replace('</head>', '<link rel="stylesheet" href="/assets/console-extra-games.css">\n</head>'));
  const sitemapPath = path.join(root,'sitemap.xml'); let sitemap = fs.readFileSync(sitemapPath,'utf8');
  const urls = pages.map(file=>'https://whatwhatboy.com/'+file.replace(/index\.html$/,''));
  const added = urls.filter(url=>!sitemap.includes('<loc>'+url+'</loc>'));
  if (added.length) fs.writeFileSync(sitemapPath,sitemap.replace('</urlset>',added.map(url=>`  <url><loc>${url}</loc><lastmod>2026-11-02</lastmod></url>`).join('\n')+'\n</urlset>'));
  console.log('Built native PS5 cheat downloads: '+games.length+' games.');
  return {games:games.length,pages};
}
module.exports = {collect,cards,gameCard,gameURL,validateIdentity,featuredGameSlug,otherGamesURL,build};
if (require.main === module) build({indexOnly: process.argv.includes('--index-only')});
