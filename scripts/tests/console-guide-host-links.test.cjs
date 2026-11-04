'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {apply, destinations} = require('../console-guide-host-links.cjs');

test('guide launch links use the correct host while retaining the original pinned URL', () => {
  const original = 'https://aminegold0.github.io/silverps4hen/raw13/jb.html?log=1&amp;hx1400=1&amp;v=6';
  const result = apply('console/ps4/jailbreak.html', '<a href="' + original + '">Open supplied 14.00 host</a>');
  assert.ok(result.includes('href="' + destinations.ps4 + '"'));
  assert.ok(result.includes('data-original-host-url="' + original + '"'));
  const ps5 = apply('console/ps5/umtx2.html', '<a href="https://umtx2.pages.dev/">https://umtx2.pages.dev/</a>');
  assert.ok(ps5.includes('href="' + destinations.ps5 + '"'));
  assert.ok(ps5.includes('>' + destinations.ps5 + '</a>'));
  assert.equal(apply('console/ps4/jailbreak.html', result), result);
});

test('downloads, store installation links, source references and packaged tools remain unchanged', () => {
  const references = '<ul class="guide-source-list"><li><a href="https://umtx2.pages.dev/">Host preview image credit</a></li></ul>' +
    '<a href="https://store.playstation.com/">WebKit Autoloader browser entry</a>' +
    '<a href="https://github.com/etaHEN/etaHEN/releases">etaHEN releases</a>' +
    '<a href="/downloads/exact.bin" download>Download</a>' +
    '<a href="http://127.0.0.1:6701/whatsite-ps5.html?file=exact">Save on PS5</a>';
  assert.equal(apply('console/ps5/relapse.html', references), references);
  const launch = '<a href="https://gamerhack.github.io/g2all/">Host</a>';
  assert.equal(apply('console/ps4/whatsite-ps4.html', launch), launch);
  assert.equal(apply('console/ps3/index.html', launch), launch);
});

test('legacy own-host addresses retain labels and explicit platform destinations', () => {
  const html = '<a href="https://speedy-away.github.io/WWB-HOST/hosts/ps4/">Open PS4 loader</a>';
  const result = apply('console/ps5/downloads.html', html);
  assert.equal(result, '<a href="' + destinations.ps4 + '">Open PS4 loader</a>');
  const card = '<a class="guide-host" href="http://karo218.ir/"><h3>Karo</h3><span>PS4</span></a>';
  const routed = apply('console/ps4/index.html', card);
  assert.ok(routed.includes('Open WWB Host →'));
  assert.equal(apply('console/ps4/index.html', routed), routed);
});

test('authored pages retain compatibility and are ready for repeat generation', () => {
  for (const file of ['ps4/index.html', 'ps4/jailbreak.html', 'ps4/jailbreak-13-52.html', 'ps5/index.html', 'ps5/relapse.html', 'ps5/umtx2.html']) {
    const html = fs.readFileSync('console/' + file, 'utf8');
    assert.equal(apply('console/' + file, html), html, file);
    assert.ok(html.includes(destinations[file.split('/')[0]]), file);
  }
  const umtx = fs.readFileSync('console/ps5/umtx2.html', 'utf8');
  assert.ok(umtx.includes('1.00–5.50'));
  assert.ok(umtx.includes('does not make this browser chain compatible with 6.00–7.61'));
  const relapse = fs.readFileSync('console/ps5/relapse.html', 'utf8');
  assert.ok(relapse.includes('does not list 9.05, 10.60 or 11.40'));
});
