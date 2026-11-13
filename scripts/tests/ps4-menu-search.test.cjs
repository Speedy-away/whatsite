'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {discoveryTerms} = require('../console-resource-tags.cjs');
const {termsForCard} = require('../console-mod-search-tags.cjs');
const {catalog} = require('../console-mod-catalog.cjs');
const {transform} = require('../page-search-metadata.cjs');
const {metadataByPage} = require('../console-mod-metadata.cjs');

test('resource discovery describes only supplied downloads, guides, controls and platforms', () => {
  const item = {name: 'Example', category: 'menu', gameIds: ['black-ops-3']};
  const bare = discoveryTerms(item).join(' ');
  assert.doesNotMatch(bare, /download|guide|controls|PS4|PS5|GoldHEN|14\.02/);
  assert.match(bare, /Example Black Ops III/);
  const ready = discoveryTerms({...item, platforms: ['ps4'], downloads: [{url: 'https://example.com/menu.gsc'}],
    guideBlocks: [{type: 'steps'}], controls: [{input: 'Aim + Square'}]});
  for (const term of ['Example download', 'Example PS4', 'Example installation guide', 'how to open Example']) assert.ok(ready.includes(term));
  assert.doesNotMatch(discoveryTerms({...item, downloads: [{url: 'https://example.com/unavailable', distribution: 'excluded'}]}).join(' '), /download/);
  assert.deepEqual(discoveryTerms({...item, category: 'reference', downloads: []}), []);
});

test('named catalogue entries get their own keywords without leaking another game into a card', () => {
  const {entries} = catalog();
  for (const entry of entries.filter(entry => entry.keywords.length)) {
    const terms = termsForCard('console/mods/ps4/menus.html', '<article></article>', entry.name);
    for (const keyword of entry.keywords) assert.ok(terms.includes(keyword), entry.name + ': ' + keyword);
  }
  const rdr = termsForCard('console/mods/ps4/rdr2/index.html', '<article></article>', 'North');
  assert.ok(rdr.includes('North Beta download'));
  assert.doesNotMatch(rdr.join(' '), /GTA|Black Ops|PS5/);
  assert.deepEqual(termsForCard('console/ps3/index.html', '<article></article>', 'North'), []);
  const sharedNames = entries.filter(entry => entry.keywords.length && entries.some(other => other.name === entry.name && other.gameId !== entry.gameId));
  for (const entry of sharedNames) {
    const terms = termsForCard('console/mods/ps4/menus.html', '<article data-catalog-game="' + entry.gameId + '"></article>', entry.name);
    assert.deepEqual(new Set(terms), new Set(entries.filter(other => other.gameId === entry.gameId && other.name === entry.name).flatMap(other => other.keywords)));
  }
});

test('every named menu retains individual structured keywords despite the page keyword cap', () => {
  const entries = catalog().entries;
  for (const [file, data] of metadataByPage()) {
    if (!data.searchKeywords?.length) continue;
    const html = '<html><head><title>Guide</title><link rel="canonical" href="https://whatwhatboy.com/' + file.replace(/index\.html$/, '') + '"></head><body><h1>Guide</h1></body></html>';
    const output = transform(file, html).html;
    const schema = JSON.parse(output.match(/<script id="site-page-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const items = schema['@graph'].find(node => node['@type'] === 'CollectionPage').mainEntity.itemListElement;
    for (const entry of entries.filter(entry => entry.keywords.length && entry.url.split('#')[0] === '/' + file.replace(/index\.html$/, ''))) {
      const item = items.find(item => item.name === entry.name && item.url.endsWith(entry.url));
      assert.ok(item?.item?.keywords.includes(entry.name), file + ': ' + entry.name);
    }
  }
});
