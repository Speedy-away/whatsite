const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const directories = require('../console-game-directories.cjs');
const root = path.resolve(__dirname, '../..');
const catalogue = () => directories.registry();
const byId = id => catalogue().platforms.find(platform => platform.id === id);
const hrefs = html => [...html.matchAll(/\bhref=["']([^"']*)["']/g)].map(match => match[1].replaceAll('&amp;', '&'));
const sourceContains = (platform, url) => platform.providers.some(provider => provider.url === url);
const fixture = '<html><head><title>Console</title></head><body class="console-guide"><main id="main-content"><div class="container"><nav class="guide-nav" aria-label="Console pages"><a href="#start">Start</a></nav></div><div id="content"><section class="section" id="start"><div class="container"><div class="section-header"><h2>Guides &amp; downloads</h2></div><div class="games-grid"><article class="guide-resource"><h3>Existing resource</h3><a href="/downloads/pinned-v1.elf" download>Download exact release</a><a href="/console/retro/ps2.html#picodrive">Bookmarked guide</a></article></div></div></section></div></main></body></html>';

test('console directories match actual console routes without crossing generations', () => {
  const ps2 = byId('ps2');
  assert.ok(ps2);
  for (const file of ['console/ps2/index.html', 'console/ps2/apps.html', path.join(root, 'console/ps2/apps.html'), 'console/retro/ps2.html']) {
    assert.equal(directories.platformFor(file)?.id, ps2.id, file);
  }
  assert.equal(directories.platformFor('console/psvita/home.html')?.id, 'psvita');
  assert.equal(directories.platformFor('console/nintendo-switch-2/index.html')?.id, 'nintendo-switch-2');
  assert.equal(directories.platformFor('console/nintendo-switch/apps.html')?.id, 'nintendo-switch');
  assert.equal(directories.platformFor('console/xbox360/apps.html')?.id, 'xbox360');
  assert.ok(directories.platformFor('console/retro/xbox.html'), 'Original Xbox native page is included');
  assert.equal(directories.platformFor('pc/emulators.html'), null);
});

test('the exact user-supplied category links stay assigned to their matching systems', () => {
  const expected = [
    ['wii', 'https://vimm.net/vault/Wii'],
    ['gamecube', 'https://vimm.net/vault/GameCube'],
    ['ps3', 'https://dlpsgame.com/list-all-game-ps3/'],
    ['ps4', 'https://dlpsgame.com/category/ps4/'],
    ['ps5', 'https://dlpsgame.com/category/ps5/'],
    ['psvita', 'https://downloadgamepsp.org/category/psvita-game-free-new/'],
    ['nintendo-switch', 'https://nswgame.com/category/switch/'],
    ['3ds', 'https://nswgf.com/category/3ds/']
  ];
  for (const [id, url] of expected) assert.ok(sourceContains(byId(id), url), id + ': ' + url);
  for (const id of ['xbox', 'xbox360']) {
    const platform = byId(id);
    assert.equal(platform.providers.length, 0);
    const html = fs.readFileSync(path.join(root, directories.directoryPath(platform).slice(1)), 'utf8');
    assert.doesNotMatch(html, /vimm|dlxbgame|downloadgamexbox/i);
    assert.ok(hrefs(html).includes('/console/xbox-game-library/?platform=' + id));
  }
  const allProviders = [...catalogue().general, ...catalogue().platforms.flatMap(platform => platform.providers)];
  for (const url of ['https://vimm.net/vault', 'https://dlpsgame.com/']) assert.ok(allProviders.some(provider => provider.url === url), url);
  for (const id of ['nintendo-switch-2', 'xbox-one-series', 'steamdeck']) {
    assert.equal(byId(id).providers.length, 0, id + ' does not inherit another system’s game directory');
  }
});

test('hub integration adds a game directory card and navigation idempotently while retaining old downloads', () => {
  const platform = byId('ps2');
  const output = directories.apply('console/ps2/index.html', fixture);
  assert.ok(hrefs(output).includes(directories.directoryPath(platform)));
  assert.equal((output.match(/<article\b/g) || []).length, 2, 'one directory card is added beside the existing resource');
  for (const preserved of ['href="/downloads/pinned-v1.elf" download', 'href="/console/retro/ps2.html#picodrive"', 'Existing resource']) assert.ok(output.includes(preserved));
  assert.equal(directories.apply('console/ps2/index.html', output), output);
});

test('ordinary topic pages gain navigation without an unrelated resource card', () => {
  const output = directories.apply('console/ps2/apps.html', fixture);
  assert.ok(hrefs(output).includes(directories.directoryPath(byId('ps2'))));
  assert.equal((output.match(/<article\b/g) || []).length, 1);
  assert.equal(directories.apply('console/ps2/apps.html', output), output);
});

test('curated libraries retain every ready-file card while gaining their external provider directories', () => {
  const platform = byId('wiiu');
  const ready = '<article id="batch2-ready-build"><h3>Original complete build</h3><p>Exact game update 1.2; native Wii U only.</p><a href="/downloads/wiiu/pinned-v1.zip" download>Download original ZIP</a><details><summary>Source details</summary><code>original-sha256</code></details></article>';
  const input = '<html><body><main id="main-content"><nav class="guide-nav"><a href="/console/wiiu/">Wii U</a></nav><section id="wiiu-games">' + ready + '</section><footer class="guide-footer">Existing footer</footer></main></body></html>';
  const output = directories.apply('console/wiiu/game-downloads.html', input);
  assert.ok(output.includes(ready), 'ready files, requirements and hashes stay byte-identical');
  for (const provider of platform.providers) assert.ok(hrefs(output).includes(provider.url), provider.url);
  assert.equal((output.match(/id="game-directories"/g) || []).length, 1);
  assert.ok(output.indexOf('id="game-directories"') > output.indexOf('id="batch2-ready-build"'));
  assert.equal(directories.apply('console/wiiu/game-downloads.html', output), output);
});

test('ready builds, downloaded artifacts and unrelated pages remain byte-identical', () => {
  for (const file of ['console/ps4/whatsite-ps4.html', 'console/ps5/whatsite-ps5.html', 'downloads/archive/console.html', 'source-codes/games/example.html', 'pc/emulators.html']) {
    assert.equal(directories.apply(file, fixture), fixture, file);
  }
  const receiver = fixture.replace('<body ', '<body data-helper="receiver" ').replace('<main ', '<script id="receiver-catalog" type="application/json">[]</script><main ');
  assert.equal(directories.apply('console/ps4/receiver.html', receiver), receiver);
});

test('generated directory pages expose provider websites and a route back to their console', () => {
  for (const platform of catalogue().platforms) {
    const route = directories.directoryPath(platform);
    const file = path.join(root, route.replace(/^\//, ''));
    assert.ok(fs.existsSync(file), route);
    const html = fs.readFileSync(file, 'utf8');
    const links = hrefs(html);
    if (platform.directoryMode === 'curated-library') {
      assert.equal(platform.id, 'wiiu');
      assert.match(html, /id="wiiu-games"/);
      assert.ok(links.some(link=>link.startsWith('/downloads/')), 'curated Wii U builds remain downloadable');
      assert.ok(links.includes(platform.hub), 'curated library retains console navigation');
    }
    for (const provider of platform.providers) {
      assert.ok(links.includes(provider.url), platform.id + ': ' + provider.url);
      const start = [...html.matchAll(/<a\b[^>]*>/g)].map(match => match[0]).find(tag => hrefs(tag).includes(provider.url));
      assert.match(start, /target="_blank"/);
      assert.match(start, /rel="[^"]*noopener/);
    }
    assert.ok(links.includes(platform.hub), platform.id + ' retains console navigation');
    assert.doesNotMatch(html, /<video\b|<iframe\b/i);
  }
});

test('PlayStation directory cards preselect the corresponding WWBsgames platform', () => {
  const values = {ps2: 'PS2', ps3: 'PS3', ps4: 'PS4', ps5: 'PS5', psp: 'PSP', psvita: 'PS Vita'};
  const library = fs.readFileSync(path.join(root, 'console/playstation-library/index.html'), 'utf8');
  const options = library.match(/<select id="platform"[^>]*>([\s\S]*?)<\/select>/)[1];
  for (const [id, value] of Object.entries(values)) {
    const page = fs.readFileSync(path.join(root, directories.directoryPath(byId(id)).slice(1)), 'utf8');
    const card = page.match(/<article id="playstation-game-library"[^>]*>[\s\S]*?<\/article>/)?.[0];
    assert.ok(card, id);
    assert.ok(card.includes('/assets/images/wwbsgames.svg'));
    assert.ok(hrefs(card).includes('/console/playstation-library/?platform=' + encodeURIComponent(value)));
    assert.ok(options.includes('<option>' + value + '</option>'));
  }
});

test('both download overviews show all console logos and link to the three WWBsgames libraries', () => {
  for (const file of ['console/game-downloads/index.html', 'games-downloads/index.html']) {
    const page = fs.readFileSync(path.join(root, file), 'utf8');
    const picker = page.match(/<section[^>]*id="consoles"[^>]*>[\s\S]*?<\/section>/)[0];
    const logos = [...picker.matchAll(/class="download-directory-logo" src="([^"]+)"/g)].map(match => match[1]);
    assert.equal(logos.length, catalogue().platforms.length);
    assert.ok(logos.every(logo => fs.existsSync(path.join(root, logo.slice(1)))));
    for (const library of ['/console/playstation-library/', '/console/xbox-game-library/', '/console/nintendo-game-library/']) {
      assert.ok(hrefs(page).includes(library), file + ' ' + library);
    }
    assert.equal(directories.apply(file, page), page);
  }
});

test('the retro picker renders each additional Vault category once with its own artwork', () => {
  const data = catalogue();
  const file = 'console/game-downloads/index.html';
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const retro = html.match(/<section[^>]*id="more-systems"[^>]*>[\s\S]*?<\/section>/)[0];
  const links = hrefs(retro);
  const existingCategories = new Set(data.platforms.flatMap(platform => platform.providers.map(provider => provider.url)));
  assert.equal(data.vaultSystems.length, 25);
  for (const {url, logo} of data.vaultSystems) {
    assert.equal(links.filter(link => link === url).length, 1, url);
    assert.ok(!existingCategories.has(url), url);
    assert.ok(retro.includes('src="' + logo + '"') && fs.existsSync(path.join(root, logo.slice(1))), logo);
  }
  assert.ok(links.includes('https://vimm.net/vault'));
  assert.ok(hrefs(html).includes('#more-systems'));
  assert.equal(directories.apply(file, html, data), html);
});
