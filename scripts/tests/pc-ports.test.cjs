const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {normalize, matches, mount} = require('../../assets/pc-ports.js');
const data = require('../../docs/pc-ports.json');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const searchable = entry => ({search: [entry.title, entry.requestedTitle, ...entry.aliases, ...entry.tags, entry.platform].join(' '), platform: entry.platform, availability: entry.availability});
test('Ports includes all 49 requested sources with exact supplied release pins', () => {
  assert.equal(data.entries.length, 49);
  assert.equal(data.entries.filter(e => e.download).length, 45, 'All available selected packages are archived before publication');
  assert.equal(new Set(data.entries.map(e => e.source)).size, 49);
  for (const entry of data.entries) {
    const tag = new URL(entry.source).pathname.match(/\/releases\/tag\/(.+)$/)?.[1];
    if (tag) assert.equal(entry.release.tag, decodeURIComponent(tag), entry.id);
    assert.ok(entry.requirements && entry.cover && entry.aliases.length, entry.id);
    if (entry.download) {
      assert.equal(entry.download.version, entry.release.tag);
      assert.doesNotMatch(entry.download.sourceUrl, /\/latest(?:\/|$)/);
      assert.equal(entry.download.local, undefined, 'No repository binary mirrors');
      assert.match(entry.download.sha256, /^[a-f0-9]{64}$/);
      if (entry.download.upstreamSha256) assert.equal(entry.download.sha256, entry.download.upstreamSha256);
    }
  }
});
test('game aliases and accents find the intended cards with AND search and exact filters', () => {
  assert.equal(normalize('Pokémon — Snap!'), 'pokemon snap');
  for (const [query, id] of [['Bloodborne pc port','bloodborne'],['Windwaker','the-legend-of-zelda-the-wind-waker'],['Deaf Jam','def-jam-fight-for-ny'],['Ridge Racer 5','ridge-racer-v'],['Pokemon Snap','pokemon-snap'],['CoD MW2','call-of-duty-modern-warfare-2']]) assert.ok(matches(searchable(data.entries.find(e => e.id === id)), query, '', ''), query);
  assert.equal(matches(searchable(data.entries.find(e => e.id === 'bloodborne')), 'Bloodborne Mario', '', ''), false);
  assert.equal(matches(searchable(data.entries.find(e => e.id === 'bloodborne')), '', 'PS4', 'release'), true);
  assert.equal(matches(searchable(data.entries.find(e => e.id === 'bloodborne')), '', 'PS3', ''), false);
});
test('filter controls hide cards, announce counts and restore the complete list', () => {
  function control(value='') { return {value, handlers:{}, addEventListener(type, fn){this.handlers[type]=fn;}, focus(){this.focused=true;}}; }
  const query=control(), platform=control(), availability=control(), reset=control(), count={}, empty={};
  const cards=data.entries.map(e=>({hidden:false,getAttribute(name){return {'data-search':searchable(e).search,'data-platform':e.platform,'data-availability':e.availability}[name];}}));
  const controls={'[data-ports-query]':query,'[data-ports-platform]':platform,'[data-ports-availability]':availability,'[data-ports-count]':count,'[data-ports-empty]':empty,'[data-ports-reset]':reset};
  mount({querySelector(){return {querySelector(s){return controls[s];},querySelectorAll(s){return s==='[data-port-card]'?cards:[];}};}});
  query.value='Bloodborne pc port';query.handlers.input();
  assert.equal(cards.filter(c=>!c.hidden).length,1);assert.equal(count.textContent,'1 of 49 projects');
  platform.value='GameCube';platform.handlers.change();assert.equal(empty.hidden,false);
  reset.handlers.click();assert.equal(cards.filter(c=>!c.hidden).length,49);assert.equal(empty.hidden,true);assert.equal(query.focused,true);
});
test('project statuses distinguish unavailable sources, build docs and companion tools', () => {
  const byId = id => data.entries.find(e=>e.id===id);
  assert.equal(byId('super-mario-sunshine').availability,'unavailable');assert.equal(byId('super-mario-sunshine').download,undefined);
  assert.equal(byId('crackdown').availability,'project');
  assert.equal(byId('infamous').kind,'Companion server');assert.match(byId('infamous').requirements,/not a PC port/);
  assert.equal(byId('prince-of-persia-mod-manager-openjade').kind,'Mod manager');
  assert.equal(byId('god-of-war-iii').platform,'PS4');assert.equal(byId('resident-evil-code-veronica').platform,'PS3');assert.equal(byId('crash-team-racing-nitro-fueled').platform,'PS4');
  assert.match(byId('bloodborne').requirements,/CUSA03173/);assert.match(byId('pokemon-snap').requirements,/edc7c49/);assert.match(byId('eternal-darkness-sanity-s-requiem').requirements,/USA disc GEDE01 is explicitly unsupported/);
});
test('every source cover remains intact and the layout fits instead of cropping', () => {
  const html = read('pc/ports.html'), css = read('assets/pc-ports.css');
  for (const e of data.entries) {const b=fs.readFileSync(path.join(root,e.cover.path));assert.equal(b.length,e.cover.bytes,e.id);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),e.cover.sha256,e.id);assert.ok(html.includes(e.cover.path));}
  assert.equal((html.match(/data-port-card /g)||[]).length,49);
  assert.match(css,/\.port-cover img\{[^}]*object-fit:contain/);assert.doesNotMatch(css,/object-fit:cover|line-clamp/);
  const schema=JSON.parse(html.match(/<script id="ports-catalog-schema" type="application\/ld\+json">([^<]+)<\/script>/)[1]);assert.equal(schema.numberOfItems,49);assert.equal(schema.itemListElement.length,49);
});
test('PC hub and generated sidebar keep a single Ports destination', () => {
  const nav=require('../pc-ports-navigation.cjs');
  const html=read('pc/index.html');
  assert.ok(html.includes('Browse Ports'));assert.ok(html.includes('data-pc-ports-navigation'));
  assert.equal(nav.apply('pc/index.html',html),html);
  const page=read('pc/ports.html');assert.ok(page.includes('href="/pc/ports.html" class="nav-link nav-sublink active" aria-current="page"'));
});
test('search metadata contains every requested game and the Bloodborne PC port phrase', () => {
  const overrides=JSON.parse(read('docs/seo/search-editorial-overrides.json'))['pc/ports.html'];
  const html=read('pc/ports.html'),keywords=html.match(/<meta name="keywords" content="([^"]+)"/)[1];
  assert.ok(keywords.includes('Bloodborne PC port'));
  for(const e of data.entries) assert.ok(keywords.includes(e.tags[0].replaceAll('&','&amp;')),e.id);
  assert.ok(overrides.description.length<=165);
});
