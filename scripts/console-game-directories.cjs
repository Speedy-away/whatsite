// Console-specific external game directories; existing ready files are untouched.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const registry = () => JSON.parse(fs.readFileSync(path.join(root, 'docs/console-game-directories.json'), 'utf8'));
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const normalized = file => (/^\/(?:console|downloads|pc|source-codes)\//.test(file) ? file : path.isAbsolute(file) ? path.relative(root, file) : file).replaceAll('\\', '/').replace(/^\/+/, '').split(/[?#]/)[0];
const directoryPath = platform => platform.base + 'game-downloads.html';
const ps4AddOns = require('./ps4-game-add-ons.cjs');
const libraryRoutes = require('./playstation-library-routes.cjs');
const {providerLogo} = require('./game-directory-card-layout.cjs');
const fpkgFixesFile = 'console/ps4/fpkg-fixes.html';
const blackOps2Mods = '/console/mods/ps4/call-of-duty/black-ops-2/';
function orbitStoreCard() {
  const image = JSON.parse(fs.readFileSync(path.join(root, 'docs/console-software-images.json'), 'utf8')).orbit.image;
  return `<article class="guide-resource" id="orbit-store" data-search="orbit store 1.8.1 ps5 playstation 5 download manager game downloads homebrew store orbit_store.elf"><img src="${esc(image)}" alt="Orbit Store 1.8.1 interface on PS5" loading="lazy"><h3>Orbit Store 1.8.1</h3><p>PS5 download manager and store interface. Download the pinned ELF and launch it through Payload Manager or your compatible ELF loader.</p><div class="guide-links"><a href="https://github.com/saawant12/orbit-store-ps5/releases/download/v1.8.1/orbit_store.elf" download="orbit_store.elf">Download orbit_store.elf <i class="fas fa-download" aria-hidden="true"></i></a>${external('https://github.com/saawant12/orbit-store-ps5/releases/tag/v1.8.1', '1.8.1 release')}<a href="/console/ps5/apps.html#install">Setup guide <i class="fas fa-arrow-right" aria-hidden="true"></i></a></div></article>`;
}
function platformFor(file, data = registry()) {
  const current = '/' + normalized(file);
  return data.platforms.find(p => current.startsWith(p.base) || current === p.hub || current === '/' + p.source || (p.aliases || []).includes(current)) || null;
}
function protectedFile(file, html) {
  const current = normalized(file);
  return current.startsWith('downloads/') || (current.startsWith(libraryRoutes.legacy) || current.startsWith(libraryRoutes.directory)) ||
    /(?:^|\/)whatsite-ps[45]\.html$/.test(current) || /\bid=["']receiver-catalog["']/.test(html);
}
function range(html, tag, predicate) {
  const tags = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
  let opening;
  while ((opening = tags.exec(html))) if (predicate(opening[0])) {
    const same = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
    same.lastIndex = tags.lastIndex;
    let depth = 1, token;
    while (depth && (token = same.exec(html))) depth += token[1] ? -1 : 1;
    return depth ? null : {start: opening.index, content: tags.lastIndex, close: token.index, end: same.lastIndex};
  }
  return null;
}
const gameLibraries = {
  ps2: 'PlayStation',
  ps3: 'PlayStation',
  ps4: 'PlayStation',
  ps5: 'PlayStation',
  psp: 'PlayStation',
  psvita: 'PlayStation',
  xbox: 'Xbox',
  xbox360: 'Xbox',
  wii: 'Nintendo',
  wiiu: 'Nintendo',
  'nintendo-switch': 'Nintendo',
  ds: 'Nintendo',
  '3ds': 'Nintendo'
};
const libraryPaths = {
  PlayStation: '/' + libraryRoutes.directory,
  Xbox: '/console/xbox-game-library/',
  Nintendo: '/console/nintendo-game-library/'
};
const libraryLogo = '/assets/images/wwbsgames.svg';
const overviewSummary = 'Browse WWBsgames libraries for PlayStation, Xbox and Nintendo, or choose a console to see game directories such as Vimm’s Lair, DLPSGame, DownloadGamePSP, NSWGame and NSWGF.';

function applyLibraryCard(html, platform) {
  const {id: platformId, title: platformTitle} = platform;
  const family = gameLibraries[platformId];
  const playStation = family === 'PlayStation';
  const route = libraryPaths[family];
  const platformFilter = playStation ? (platformId === 'psvita' ? 'PS Vita' : platformId.toUpperCase()) : platformId;
  const library = route + '?platform=' + encodeURIComponent(platformFilter);
  const id = 'id="' + family.toLowerCase() + '-game-library"';
  const legacy = range(html, 'section', opening => opening.includes(id));
  if (legacy) html = html.slice(0, legacy.start) + html.slice(legacy.end);
  const directory = range(html, 'section', opening => opening.includes('id="game-directories"'));
  if (!directory) return html;

  const name = family + ' Game Library';
  const {resource, link} = require('./build-console-guides.cjs');
  const detail = playStation
    ? `Search ${platformFilter} games by title or genre. Compare listings and see the available regions, versions and download links.`
    : 'Search game titles, browse genre labels where available and open the original source listings.';
  const keywords = [
    'WWBsgames', name, platformTitle + ' game library', platformTitle + ' game downloads',
    platformTitle + ' game list', 'search by game title', 'game genre filters', platformTitle + ' game catalog', platformTitle + ' games by genre',
    ...(platformId === 'xbox' ? ['OG Xbox', 'Xbox Classic', 'regional editions', 'disc versions', 'game language search', 'disc revision lookup'] : []),
    ...(platformId === 'xbox360' ? ['Xbox360', 'X360', 'Xbox 360 JTAG', 'Xbox 360 RGH', 'Xbox 360 ISO', 'Xbox Live Arcade', 'XBLA', 'Xbox 360 Indie Games', 'XBLIG'] : []),
    ...(platformId === 'ds' ? ['Nintendo DS', 'NDS game library'] : []),
    ...(platformId === '3ds' ? ['Nintendo 3DS', 'Nintendo 2DS game library'] : []),
    ...(playStation ? [platformFilter + ' games', platformFilter + ' game catalog', platformFilter + ' game region filter', 'PlayStation game catalog'] : []),
    ...(platformId === 'ps4' ? ['CUSA title ID', 'PS4 PKG games', 'DLC', 'title updates', 'package version lookup'] : []),
    ...(platformId === 'ps5' ? ['PPSA title ID', 'PS5 game packages', 'DLC', 'title updates', 'package version lookup'] : [])
  ];
  const card = resource(name, detail, link(library, 'Open the game library'))
    .replace('<article class="guide-resource"', '<article ' + id + ' class="guide-resource game-directory-card" data-card-art="fixed" data-search="' + esc(keywords.join(' ').toLowerCase()) + '"')
    .replace('<h3>', '<span class="library-card-brand"><img src="' + libraryLogo + '" alt="WWBsgames" width="152" height="36" loading="lazy"></span><h3>');
  let block = html.slice(directory.start, directory.end);
  const existing = range(block, 'article', opening => opening.includes(id));
  block = existing
    ? block.slice(0, existing.start) + card + block.slice(existing.end)
    : block.replace('<div class="games-grid">', opening => opening + card + '\n');
  block = block.replace(/<p class="section-subtitle">[^<]*<\/p>/,
    family === 'Xbox' ? '<p class="section-subtitle">Browse WWBsgames by console, title or genre.</p>'
      : '<p class="section-subtitle">Browse WWBsgames or choose an external download source.</p>');
  html = html.slice(0, directory.start) + block + html.slice(directory.end);
  const ps5Downloads = '/console/ps5/game-downloads.html';
  return html.replace(/<nav\b(?=[^>]*class="[^"]*\bguide-nav\b)[^>]*>[\s\S]*?<\/nav>/, nav => {
    nav = nav.replace(/WWB’s PS4 and PS5 Game Library/g, 'PlayStation Game Library');
    if (playStation) nav = nav.replace('href="' + route + '"', 'href="' + library + '"');
    if (!nav.includes('href="' + library + '"')) nav = nav.replace('</nav>', '<a href="' + library + '">' + name + '</a></nav>');
    if (platformId === 'ps4' && !nav.includes('href="' + ps5Downloads + '"')) {
      nav = nav.replace('</nav>', '<a href="' + ps5Downloads + '">PS5 game downloads</a></nav>');
    }
    return nav;
  });
}
function hubCard(platform) {
  const detail = gameLibraries[platform.id] === 'Xbox' ? 'Browse the Xbox Game Library by title and genre.'
    : platform.providers.length ? `Find ${platform.title} game directories, with direct links to the matching console categories.` : 'Browse game directories by console and choose the system listed by the provider.';
  const title = platform.id === 'ps4' ? ps4AddOns.title : 'Game downloads';
  const description = platform.id === 'ps4' ? ps4AddOns.description : detail;
  return `<article class="guide-resource" data-console-game-card="${platform.id}"><img src="${esc(platform.image)}" alt="${esc(platform.title)} game downloads" loading="lazy"><h3>${esc(title)}</h3><p>${esc(description)}</p><div class="guide-links"><a href="${directoryPath(platform)}">Browse ${platform.id === 'ps4' ? 'PS4 downloads' : 'game downloads'} <i class="fas fa-arrow-right" aria-hidden="true"></i></a></div></article>`;
}
function apply(file, html, data = registry()) {
  const currentFile = normalized(file);
  if (currentFile === 'console/game-downloads/index.html' || currentFile === 'games-downloads/index.html') {
    return compactOverview(currentFile, html, data);
  }
  // The PS5 hub explicitly links to the shared PS4/PS5 game download page.
  if (normalized(file) === 'console/ps5/index.html') return html;
  if (protectedFile(file, html) || !/<main\b|<div\b[^>]*\bid="main-content"/i.test(html)) return html;
  const platform = platformFor(file, data);
  if (!platform) return html;
  const destination = directoryPath(platform);
  const item = `<a data-console-game-nav href="${destination}"${'/' + normalized(file) === destination ? ' aria-current="page"' : ''}>Game downloads</a>`;
  let hasNav = false;
  html = html.replace(/<nav\b(?=[^>]*class="[^"]*\bguide-nav\b)[^>]*>[\s\S]*?<\/nav>/g, nav => {
    hasNav = true;
    return nav.includes(`href="${destination}"`) ? nav : nav.replace('</nav>', item + '</nav>');
  });
  if (!hasNav) html = html.replace(/<main\b[^>]*>|<div\b(?=[^>]*\bid="main-content")[^>]*>/i, main => main + `<div class="container"><nav class="guide-nav" aria-label="${esc(platform.title)} game downloads">${item}</nav></div>`);
  const current = '/' + normalized(file), hubFile = platform.hub.endsWith('/') ? platform.hub + 'index.html' : platform.hub;
  if (current === destination && platform.id === 'ps4' && !html.includes('id="fpkg-fixes"')) {
    const {section, grid, resource, link} = require('./build-console-guides.cjs');
    const card = resource("FPKG's Fixes", 'Browse PS4 FPKG patches, including the Black Ops II (BO2) 1.11 Multiplayer and Zombies crash fix for CUSA57548.',
      link('/' + fpkgFixesFile + '#resource-bo2-fpkg-111-crash-fix', "Browse FPKG's Fixes"), '/assets/images/covers/cod-black-ops-2.jpg');
    const patches = resource('Game Patches', 'Browse PS4 patch XMLs, including Bloodborne’s 60 FPS patch, RDR2 FPS unlocks and other graphics and gameplay options.',
      link('/console/ps4/game-patches.html', 'Browse Game Patches'), '/assets/images/game-patches/bloodborne-official.jpg');
    html = html.replace(/<section\b[^>]*\bid="game-directories"[^>]*>/, opening => section('fpkg-fixes', 'PS4 game fixes and patches', grid(card, patches)) + opening);
  }
  if (current === ps4AddOns.hub) html = ps4AddOns.applyToDirectory(html);
  if (current === destination && platform.id === 'ps5' && !html.includes('id="ps5-game-patches"')) {
    const {section, grid, resource, link} = require('./build-console-guides.cjs');
    const card = resource('Game Patches', 'Browse native PPSA patches and PS4 CUSA patches for backward compatibility. Search by title ID, update or patch type.',
      link('/console/ps4/game-patches.html#native-ps5-patches', 'Browse native PS5 patches'), '/assets/images/game-patches/bloodborne-official.jpg');
    html = html.replace(/<section\b[^>]*\bid="game-directories"[^>]*>/, opening => section('ps5-game-patches', 'PS5 game patches', grid(card)) + opening);
  }
  if (current === destination && platform.id === 'ps5' && !html.includes('id="free-shops"')) {
    const existing = range(html, 'article', tag => /\bid="orbit-store"/.test(tag));
    if (existing) html = html.slice(0, existing.start) + orbitStoreCard() + html.slice(existing.end);
    else {
      const section = range(html, 'section', tag => /\bid="game-directories"/.test(tag));
      if (section) {
        const block = html.slice(section.start, section.end).replace('<div class="games-grid">', '<div class="games-grid">' + orbitStoreCard());
        html = html.slice(0, section.start) + block + html.slice(section.end);
      }
    }
  }
  if (current === destination && platform.directoryMode === 'curated-library') {
    const block = directorySection(platform);
    const existing = range(html, 'section', tag => /\bid="game-directories"/.test(tag));
    if (existing) html = html.slice(0, existing.start) + block + html.slice(existing.end);
    else {
      const footer = range(html, 'footer', tag => /\bclass="[^"]*\bguide-footer\b/.test(tag));
      const main = range(html, 'main', () => true) || range(html, 'div', tag => /\bid="main-content"/.test(tag));
      const position = footer?.start ?? main?.close;
      if (position !== undefined) html = html.slice(0, position) + block + html.slice(position);
    }
  }
  if (current === destination && gameLibraries[platform.id]) html = applyLibraryCard(html, platform);
  if (current === hubFile && platform.id === 'ps4') {
    const existingCard = /<article\b[\s\S]*?<\/article>/g;
    let found = false;
    html = html.replace(existingCard, card => {
      if (!card.includes('href="' + destination + '"')) return card;
      found = true;
      return ps4AddOns.applyToHubCard(card);
    });
    if (found) return require('./category-card-art.cjs').apply(normalized(file), html);
  }
  if (current === hubFile) {
    const existing = range(html, 'article', tag => tag.includes(`data-console-game-card="${platform.id}"`));
    if (existing) html = html.slice(0, existing.start) + html.slice(existing.end);
    const start = range(html, 'section', tag => /\bid="start"/.test(tag));
    if (start) {
      const section = html.slice(start.start, start.end);
      const grid = range(section, 'div', tag => /\bclass="[^"]*\bgames-grid\b/.test(tag));
      if (grid) {
        const position = start.start + grid.content;
        html = html.slice(0, position) + hubCard(platform) + html.slice(position);
      } else {
        const marker = '<!-- console-game-directory-card -->';
        // The Original Xbox start section is a text guide rather than a grid.
        const empty = /<!-- console-game-directory-card --><div class="container"><div class="games-grid"><\/div><\/div>/;
        html = html.replace(empty, '');
        const freshStart = range(html, 'section', tag => /\bid="start"/.test(tag));
        const block = marker + `<div class="container"><div class="games-grid">${hubCard(platform)}</div></div>`;
        html = html.slice(0, freshStart.end) + block + html.slice(freshStart.end);
      }
    }
  }
  return require('./category-card-art.cjs').apply(normalized(file), html);
}
function external(url, label) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw Error('Invalid game-directory URL');
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} <i class="fas fa-external-link-alt" aria-hidden="true"></i></a>`;
}
function directoryChoice(url, label, logo, {externalSite = false, preserveColor = false} = {}) {
  const attributes = externalSite ? ' target="_blank" rel="noopener noreferrer"' : '';
  const icon = externalSite ? 'fa-external-link-alt' : 'fa-arrow-right';
  const image = logo
    ? `<img class="download-directory-logo" src="${esc(logo)}" alt="" width="58" height="24" loading="lazy" decoding="async"${preserveColor ? ' data-logo-color' : ''}>`
    : '<span aria-hidden="true"></span>';
  return `<li><a href="${esc(url)}"${attributes}>${image}<span>${esc(label)}</span><i class="fas ${icon}" aria-hidden="true"></i></a></li>`;
}
function consolePicker(data) {
  const specialLogos = {'3ds': '3ds.png', xbox: 'xbox.png', 'nintendo-switch-2': 'nintendo-switch-2-symbol.svg'};
  const choices = data.platforms.map(platform => directoryChoice(directoryPath(platform), platform.title,
    '/assets/images/platform-logos/' + (specialLogos[platform.id] || platform.id + '.svg')));
  return require('./build-console-guides.cjs').section('consoles', 'Choose your console',
    `<ul class="download-directory">${choices.join('\n')}</ul>`);
}
function libraryChoices() {
  return Object.entries(libraryPaths).map(([family, url]) => directoryChoice(url, 'WWBsgames · ' + family, libraryLogo));
}
function providerOverview(data) {
  const links = [...libraryChoices(), ...data.general.map(provider =>
    directoryChoice(provider.url, provider.label, providerLogo(provider.url), {externalSite: true}))];
  return require('./build-console-guides.cjs').section('all-websites', 'Game libraries and websites',
    `<ul class="download-directory">${links.join('\n')}</ul>`);
}
function retroOverview(data) {
  const group = (type, title) => {
    const links = data.vaultSystems.filter(system => system.group === type)
      .map(system => directoryChoice(system.url, system.label, system.logo, {
        externalSite: true, preserveColor: system.preserveLogoColor
      }));
    return `<h3 class="retro-directory-heading">${title}</h3><ul class="download-directory">${links.join('\n')}</ul>`;
  };
  const links = group('console', 'Home consoles and WiiWare') + group('handheld', 'Handhelds and tabletop');
  const vault = `<div class="guide-links">${external('https://vimm.net/vault', 'Browse every system in The Vault')}</div>`;
  return require('./build-console-guides.cjs').section('more-systems', 'Retro consoles',
    links + vault, 'Browse classic systems in Vimm’s Vault.');
}
function compactOverview(file, html, data) {
  const general = file === 'games-downloads/index.html';
  const stylesheet = `<link rel="stylesheet" href="/assets/game-downloads-overview.css?v=${general ? 2 : 4}">`;
  html = html.includes('/assets/game-downloads-overview.css')
    ? html.replace(/<link\b[^>]*href="\/assets\/game-downloads-overview\.css[^"]*"[^>]*>/, stylesheet)
    : html.replace('</head>', stylesheet + '\n</head>');
  html = html.replace(/<body\b[^>]*>/i, tag => tag.includes('downloads-overview') ? tag :
    tag.replace(/class="([^"]*)"/, 'class="$1 downloads-overview"'));
  const picker = range(html, 'section', tag => /\bid="(?:consoles|console-game-downloads)"/.test(tag));
  if (picker) html = html.slice(0, picker.start) + consolePicker(data) + html.slice(picker.end);
  if (general) {
    const hero = range(html, 'section', tag => /\bclass="hero"/.test(tag));
    const intro = '<header class="downloads-intro container"><h1>Game Downloads</h1><p>Choose a console, browse WWBsgames libraries, or find PC game downloads.</p></header>';
    if (hero) html = html.slice(0, hero.start) + intro + html.slice(hero.end);
    else html = html.replace(/<header class="downloads-intro container">[\s\S]*?<\/header>/, intro);
    const libraries = require('./build-console-guides.cjs').section('wwbsgames-libraries', 'WWBsgames libraries',
      `<ul class="download-directory">${libraryChoices().join('\n')}</ul>`);
    const existing = range(html, 'section', tag => tag.includes('id="wwbsgames-libraries"'));
    if (existing) html = html.slice(0, existing.start) + libraries + html.slice(existing.end);
    else html = html.replace(/<section\b[^>]*\bid="downloads"[^>]*>/, opening => libraries + '\n' + opening);
    return html.replace('<h2 class="section-title">Available Downloads</h2>', '<h2 class="section-title">PC game downloads</h2>')
      .replace('href="../index.html#tools"', 'href="/tools/"');
  }
  const providers = range(html, 'section', tag => tag.includes('id="all-websites"'));
  if (providers) html = html.slice(0, providers.start) + providerOverview(data) + html.slice(providers.end);
  const retro = range(html, 'section', tag => tag.includes('id="more-systems"'));
  if (retro) html = html.slice(0, retro.start) + retroOverview(data) + html.slice(retro.end);
  const footer = range(html, 'footer', tag => /\bclass="[^"]*\bguide-footer\b/.test(tag));
  if (footer) {
    const updated = new Date(data.updatedAt);
    const date = updated.toLocaleDateString('en-GB', {timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric'});
    const markup = `<footer class="guide-footer directory-footer"><div class="container"><div class="directory-footer-row"><p>Directory updated <time datetime="${updated.toISOString().slice(0, 10)}">${esc(date)}</time></p><a href="/pages/contact.html">Report a broken link</a></div></div></footer>`;
    html = html.slice(0, footer.start) + markup + html.slice(footer.end);
  }
  html = html.replace(/<nav\b(?=[^>]*class="[^"]*\bguide-nav\b)[^>]*>[\s\S]*?<\/nav>/, nav =>
    nav.includes('href="#more-systems"') ? nav : nav.replace('</nav>', '<a href="#more-systems">Retro consoles</a></nav>'));
  return html.replace(/(<h1>Console Game Downloads<\/h1><p>)[^<]*(<\/p>)/, '$1' + overviewSummary + '$2')
    .replace(/<div class="hero-buttons"><a class="btn btn-primary" href="#consoles">Choose your console<\/a><\/div>/, '');
}
function providerCard(provider, platform = null) {
  const accessed = ['retrieved', 'retrieved-after-redirect'].includes(provider.status);
  const check = accessed ? 'The directory page was retrieved. Individual game downloads were not checked.' : 'Automated access to this directory could not be confirmed. The original link is retained; individual game availability has not been checked.';
  return `<article class="guide-resource">${require('./merged-category-covers.cjs').directory(platform)}<p>External game directory</p><h3>${esc(provider.label)}</h3><p>${esc(provider.description)}</p><div class="guide-links">${external(provider.url, 'Open game directory')}</div><details><summary>Link check</summary><p>${esc(check)}</p></details></article>`;
}
function directorySection(platform) {
  const title = `External ${esc(platform.title)} game directories`;
  const content = platform.providers.length
    ? `<div class="games-grid">${platform.providers.map(provider => providerCard(provider, platform)).join('\n')}</div>`
    : '<div class="guide-links"><a href="/console/game-downloads/">Browse all console directories <i class="fas fa-arrow-right" aria-hidden="true"></i></a></div>';
  return `<section class="section" id="game-directories"><div class="container"><div class="section-header"><h2 class="section-title">${title}</h2><p class="section-subtitle">Open the matching console category on an external website.</p></div>${content}</div></section>`;
}
function prepare(file) {
  const target = path.join(root, file);
  let html = fs.readFileSync(target, 'utf8');
  html = html.replace(/<div class="container guide-hero-grid(?: guide-hero-text)?">/, '<div class="container guide-hero-grid guide-hero-text">').replace(/<img src="[^"]*" alt="[^"]*" width="1280" height="720">/, '');
  html = require('./apply-site-background.cjs').improve(html, file);
  fs.writeFileSync(target, require('./search-page-output.cjs').finish(file, html));
}
function updatePublicPages({check = false} = {}) {
  const skip = new Set(['.git', '.agents', '.codex', '.claude', 'node_modules', 'assets', 'docs', 'downloads', 'languages', 'i18n-tools', 'scripts', 'tmp', 'design-references']);
  const files = directory => fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => entry.isDirectory() ? skip.has(entry.name) ? [] : files(path.join(directory, entry.name)) : entry.name.endsWith('.html') ? [path.join(directory, entry.name)] : []);
  const data = registry();
  let changed = 0, checked = 0;
  for (const file of files(path.join(root, 'console'))) {
    const before = fs.readFileSync(file, 'utf8');
    if (protectedFile(file, before)) continue;
    checked++;
    const after = apply(file, before, data);
    if (after !== before) { changed++; if (!check) fs.writeFileSync(file, after); }
  }
  return {checked, changed, mode: check ? 'check' : 'write'};
}
function buildFpkgFixes() {
  const {page, section, grid} = require('./build-console-guides.cjs');
  const {files} = require('../downloads/ps4-ps5/manifest.json');
  const {card} = require('./console-resource-renderer.cjs').createResourceRenderer({files});
  const {resources} = require('../docs/ps4-ps5-cod-resources.json');
  const fix = resources.find(item => item.id === 'bo2-fpkg-111-crash-fix');
  page(fpkgFixesFile, "FPKG's Fixes", 'Browse PS4 FPKG patches by game, update and title ID. The Black Ops II 1.11 fix targets crashes when loading Multiplayer or Zombies.',
    '/assets/images/covers/cod-black-ops-2.jpg',
    [['/console/ps4/', 'PS4'], ['/console/ps4/game-downloads.html', 'Game downloads'], ['/console/ps4/game-patches.html', 'Game Patches'],
      ['#call-of-duty', 'Call of Duty'], ['#other-games', 'Other Games'], [blackOps2Mods, 'Black Ops II mods']],
    section('call-of-duty', 'Call of Duty', grid(card(fix))) +
    section('other-games', 'Other Games', '<p>No fixes are listed for other games yet.</p>'), '#call-of-duty', 'Browse fixes');
  return fpkgFixesFile;
}
function build() {
  const data = registry();
  const guides = require('./build-console-guides.cjs');
  const files = [buildFpkgFixes(), ...ps4AddOns.build()];
  for (const platform of data.platforms) {
    // This route has its own ready-file library builder. Preserve that page;
    // generic provider rendering must not replace its games and setup details.
    if (platform.directoryMode === 'curated-library') continue;
    const destination = directoryPath(platform), file = destination.slice(1);
    const xboxLibrary = gameLibraries[platform.id] === 'Xbox';
    const content = platform.providers.length || xboxLibrary
      ? guides.section('game-directories', `${esc(platform.title)} game downloads`, guides.grid(...platform.providers.map(provider => providerCard(provider, platform))), platform.id === 'ps5' ? 'Download Orbit Store or choose an external game directory for this console.' : xboxLibrary ? 'Browse the Xbox Game Library.' : 'Choose an external directory for this console.')
      : guides.section('game-directories', 'Browse games by console', `<p>Browse the all-console index and choose the exact platform named by the source website.</p><div class="guide-links"><a href="/console/game-downloads/">Browse all console directories <i class="fas fa-arrow-right" aria-hidden="true"></i></a></div>`);
    guides.page(file, `${platform.title} Game Downloads`, xboxLibrary ? 'Browse game listings by title and genre on WWBsgames.' : `External game directories for ${platform.title}. Open a source website and check its console, region and file-format details.`, platform.image, [[platform.hub, platform.title], [destination, 'Game downloads'], ['/console/game-downloads/', 'All consoles']], content + guides.section('more-directories', 'More game directories', `<div class="guide-links"><a href="/console/game-downloads/">All console game directories <i class="fas fa-arrow-right" aria-hidden="true"></i></a>${xboxLibrary ? '' : external('https://vimm.net/vault', 'Vimm’s Vault · all systems') + external('https://dlpsgame.com/', 'DLPSGame · all games')}</div>`), '#game-directories', xboxLibrary ? 'Browse the game library' : 'Browse game directories');
    prepare(file);
    files.push(file);
  }
  const file = 'console/game-downloads/index.html';
  guides.page(file, 'Console Game Downloads', overviewSummary, '/assets/images/custom-console-art/xbox360-game-library.jpg', [['/console/', 'Consoles'], ['/console/game-downloads/', 'Game downloads'], ['/console/vault.html', 'The Vault']], consolePicker(data) + providerOverview(data) + retroOverview(data), '#consoles', 'Choose your console');
  prepare(file);
  files.push(file);
  // Add an entry to the existing general download page without replacing its cards.
  const general = path.join(root, 'games-downloads/index.html');
  let html = fs.readFileSync(general, 'utf8');
  if (!html.includes('id="consoles"') && !html.includes('id="console-game-downloads"')) {
    html = html.replace(/<section\b[^>]*\bid="downloads"[^>]*>/i, opening => consolePicker(data) + opening);
  }
  html = html.replace('Launchers, modpacks, and legacy editions. Everything here is free and links straight to the official source.', 'Game launchers, fan projects and console game directories. Choose a section to browse its sources.');
  fs.writeFileSync(general, require('./console-free-shops.cjs').apply('games-downloads/index.html',
    compactOverview('games-downloads/index.html', html, data)));
  const sitemapFile = path.join(root, 'sitemap.xml');
  let sitemap = fs.readFileSync(sitemapFile, 'utf8');
  for (const item of files) {
    const url = 'https://whatwhatboy.com/' + item.replace(/index\.html$/, '');
    if (!sitemap.includes('<loc>' + url + '</loc>')) sitemap = sitemap.replace('</urlset>', `  <url><loc>${url}</loc><lastmod>2026-11-02</lastmod></url>\n</urlset>`);
  }
  fs.writeFileSync(sitemapFile, sitemap);
  files.push(...require('./console-free-shops.cjs').build());
  require('./build-console-topic-hubs.cjs').finalizeMetadata(files);
  files.forEach(prepare);
  const integration = updatePublicPages();
  return {platforms: data.platforms.length, platformLinks: data.platforms.reduce((n, p) => n + p.providers.length, 0), files, integration};
}
module.exports = {registry, directoryPath, platformFor, protectedFile, apply, updatePublicPages, build, buildFpkgFixes, orbitStoreCard};
if (require.main === module) console.log(JSON.stringify(process.argv.includes('--check') ? updatePublicPages({check: true}) : build(), null, 2));
