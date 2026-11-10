'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const layout = require('../catalog-layout.cjs');
const ads = require('../site-ads.cjs');
const fixture = '<html><head><title>Catalogue</title></head><body class="console-guide"><main class="main-content" id="main-content"><header>Introduction</header><section class="section"><div class="container"><div class="ports-grid"><article><a href="https://publisher.example/v1/package.zip">Pinned download</a></article></div></div></section></main></body></html>';

test('responsive integration preserves card markup, generator class hooks and download URLs', () => {
  const result = layout.apply('pc/ports.html', fixture);
  assert.ok(result.includes('<body class="console-guide" data-catalog-page>'));
  assert.ok(result.includes('<div class="ports-grid"><article>'));
  assert.ok(result.includes('https://publisher.example/v1/package.zip'));
  assert.equal(layout.apply('pc/ports.html', result), result);
  assert.equal(result.replace(' data-catalog-page', '').replace('<link rel="stylesheet" href="/assets/catalog-layout.css?v=1">\n', ''), fixture);
});

test('packaged helpers, migration redirects and independent host pages remain byte identical', () => {
  for (const file of ['downloads/tool/index.html', 'console/ps4/whatsite-ps4.html', 'hosts/ps5/index.html']) assert.equal(layout.apply(file, fixture), fixture);
  const redirect = fixture.replace('</head>', '<meta http-equiv="refresh" content="0;url=https://speedy-away.github.io/"></head>');
  assert.equal(layout.apply('console/ps4/index.html', redirect), redirect);
});

test('catalogue rules cover Ports, emulators and shared card families without changing inner media grids', () => {
  const css = fs.readFileSync('assets/catalog-layout.css', 'utf8');
  for (const grid of layout.grids) assert.ok(css.includes('.' + grid), grid);
  for (const grid of ['guide-card-media', 'features-grid', 'guide-hero-grid', 'footer-content']) assert.ok(!layout.grids.has(grid));
  for (const file of ['pc/ports.html', 'pc/emulators.html', 'console/ps5/apps.html', 'games/cod/black-ops-2.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.ok(html.includes('data-catalog-page'), file);
    assert.equal(layout.apply(file, html), html, file);
  }
});

test('Ports ad sits outside its search grid and keeps newer shared asset versions', () => {
  const html = fixture.replace('</head>', '<script src="/assets/console-guide-dialog.js?v=5"></script><link href="/assets/console-guides.css?v=20261103-mobile-images-2"></head>');
  const result = ads.applyAds('pc/ports.html', html);
  assert.equal((result.match(/id="page-advertisement"/g) || []).length, 1);
  assert.ok(result.indexOf('<!-- BEGIN SITE AD -->') > result.indexOf('</header>'));
  assert.ok(result.indexOf('<!-- BEGIN SITE AD -->') > result.indexOf('</section>'));
  assert.ok(result.includes('console-guide-dialog.js?v=5'));
  assert.ok(result.includes('console-guides.css?v=20261103-mobile-images-2'));
  assert.ok(result.includes('script async="async" data-cfasync="false"'));
  assert.equal(ads.applyAds('pc/ports.html', result), result);
});

test('emulator ads follow the introductory filter section and are never inserted inside cards', () => {
  const html = fixture.replace('ports-grid', 'pc-emu-grid').replace('<section class="section">', '<section class="section emu-filters"><form>Filters</form></section><section class="section">');
  const result = ads.applyAds('pc/emulators.html', html);
  assert.ok(result.indexOf('<!-- BEGIN SITE AD -->') > result.indexOf('</form></section>'));
  assert.ok(result.indexOf('<!-- BEGIN SITE AD -->') > result.indexOf('<div class="pc-emu-grid">'));
  assert.equal(ads.applyAds('pc/emulators.html', result), result);
  assert.equal(ads.eligible('console/ps3/browser-downloads.html', '<html><body>Lightweight console list</body></html>'), false);
});
