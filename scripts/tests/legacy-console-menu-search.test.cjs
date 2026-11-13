'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const legacy = require('../legacy-console-menu-search.cjs');
const tags = require('../page-search-tags.cjs');
const metadata = require('../page-search-metadata.cjs');
const {pages} = require('../update-legacy-menu-search.cjs');
const article = (file, id) => [...fs.readFileSync(file, 'utf8').matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].find(match => match[0].includes('id="' + id + '"'))?.[0];

test('Jimbo keeps source-confirmed games and separate PS3 HEN/DEX search terms', () => {
  const file = 'console/ps3/mods/menus.html', card = article(file, 'discord-ps3-jimbo');
  assert.ok(card);
  const terms = legacy.termsForCard(file, card, 'Jimbo');
  for (const term of ['Jimbo PS3', 'Jimbo download', 'Jimbo guide', 'Jimbo HEN download', 'Jimbo DEX download']) assert.ok(terms.includes(term), term);
  assert.doesNotMatch(terms.join(' '), /Xbox|PS4|Black Ops II/);
  const unavailable = legacy.termsForCard(file, card.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, ''), 'Jimbo');
  assert.ok(!unavailable.includes('Jimbo download'));
  assert.ok(!unavailable.includes('Jimbo guide'));
});

test('Xbox mismatch references never acquire positive menu keywords for the wrong game', () => {
  const file = 'console/xbox360/mods/gta-v/index.html';
  const card = article(file, 'discord-xbox360-gta5-myten-1-3');
  assert.ok(card);
  assert.deepEqual(legacy.termsForCard(file, card, 'Myten'), []);
  const valid = 'console/xbox360/mods/call-of-duty/black-ops-1/index.html';
  const terms = legacy.termsForCard(valid, article(valid, 'discord-xbox360-gta5-myten-1-3'), 'Myten');
  assert.ok(terms.some(term => term.includes('Xbox 360')));
  assert.doesNotMatch(terms.join(' '), /\b(?:HEN|DEX|PS3|PS4)\b|Grand Theft Auto V/);
});

test('original Xbox COD4 archives receive filename searches without invented installation guides', () => {
  const file = 'console/xbox360/mods/call-of-duty/cod4/index.html';
  const records = legacy.recordsForPage(file, fs.readFileSync(file, 'utf8'));
  const tree = records.find(record => record.id === 'xbox360-cod4-tree-patch-v1');
  assert.ok(tree);
  assert.ok(tree.keywords.includes('Tree Patch v1 download'));
  assert.ok(tree.keywords.includes('Tree_Patch.rar'));
  assert.ok(!tree.keywords.includes('Tree Patch v1 installation guide'));
});

test('all eligible named resources retain keywords in schema, stable tags and original links', () => {
  const counts = {ps3: new Set(), xbox360: new Set()};
  for (const file of pages()) {
    const before = fs.readFileSync(file, 'utf8');
    if (!legacy.metadataForPage(file, before)) continue;
    const tagged = tags.apply(file, before);
    assert.equal(tags.apply(file, tagged), tagged, file + ': repeat tags');
    const result = metadata.transform(file, tagged).html;
    const schema = JSON.parse(result.match(/<script id="site-page-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const items = schema['@graph'].find(node => node['@type'] === 'CollectionPage').mainEntity?.itemListElement || [];
    for (const record of legacy.recordsForPage(file, before)) {
      counts[record.platform].add(record.id);
      assert.ok(items.some(item => item.name === record.name && item.url === record.url && item.item.keywords === record.keywords.join(', ')), file + ': ' + record.name);
    }
    const urls = html => [...html.matchAll(/(?:href|src)="([^"]*)"/g)].map(match => match[1]);
    assert.deepEqual(urls(result), urls(before), file + ': links');
  }
  assert.ok(counts.ps3.size > 300);
  assert.ok(counts.xbox360.size > 130);
});

test('unrelated platforms and noindex aliases are not assigned legacy menu metadata', () => {
  assert.equal(legacy.metadataForPage('console/mods/ps4/gta5/index.html', ''), null);
  assert.equal(legacy.metadataForPage('console/ps3/hen.html', ''), null);
  assert.equal(legacy.metadataForPage('console/ps3/mods/call-of-duty/cod4-modern-warfare/index.html', '<meta name="robots" content="noindex, follow">'), null);
});
