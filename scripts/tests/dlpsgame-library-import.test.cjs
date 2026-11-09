'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {fileHost,mergeSnapshots,parseLinks} = require('../import-dlpsgame-library.cjs');

const publicLinks = Buffer.from(`
  <p>EUR PPSA12345</p>
  <p>Game (10.50+): <a href="https://gofile.io/d/example">GoFile</a></p>
  <p>Update 1.04 (Fix 5.05/6.72): <a href="https://mocha.my/share/example">Mocha</a></p>
  <p><a href="https://downloadgameps3.net/archives/123">Mirror</a></p>
`).toString('base64');
const post = {id:123, link:'https://dlpsgame.com/example-ps5/', title:{rendered:'Example &amp; Friends'}, content:{rendered:`
  <img src="https://dlpsgame.com/wp-content/uploads/cover.jpg">
  <div data-payload="${publicLinks}"></div>
`}};

test('imports public host links and preserves exact update and firmware pins', () => {
  const result = parseLinks(post);
  assert.deepEqual(result.titleIds, ['PPSA12345']);
  assert.equal(result.files.length, 3);
  const [game, update, landing] = result.files;
  assert.equal(landing.url, 'https://downloadgameps3.net/archives/123');
  assert.equal(landing.landing, true);
  assert.equal(fileHost('https://downloadgameps3.net/guide-download-game/'), '');
  assert.equal(game.url, 'https://gofile.io/d/example');
  assert.equal(game.kind, 'base');
  assert.equal(game.version, undefined);
  assert.equal(game.firmware, '10.50+');
  assert.equal(update.url, 'https://mocha.my/share/example');
  assert.equal(update.kind, 'update');
  assert.equal(update.region, 'EUR');
  assert.equal(update.version, '1.04');
  assert.equal(update.firmware, '5.05/6.72');
  assert.equal(fileHost('https://1fichier.com/?example&amp;amp;af=1'), 'https://1fichier.com/?example&af=1');
  assert.equal(fileHost('https://mocha.my/share/example?token=temporary&expires=42'), '');
  assert.equal(fileHost('https://dlpsgame.com/games/example/'), '');
});

test('keeps cover-only listings and preserves earlier package links on repeat imports', () => {
  const state = {index:{titles:[]},details:Array.from({length:32},()=>({}))};
  const coverOnly = {...post,id:124,content:{rendered:'<img src="https://i.imgur.com/cover.jpg">'}};
  const snapshot = {PS5:[post,coverOnly]};
  mergeSnapshots(snapshot,state,()=>true);
  assert.deepEqual(state.index.titles.map(row=>row.count),[3,0]);
  assert.match(state.index.titles[1].cover,/^\/assets\/images\/playstation-library\/dlpsgame\/[a-f0-9]+\.jpg$/);
  const saved = structuredClone(state);
  const game = state.index.titles[0];
  const shard = parseInt(game.id.slice(0,2),16)%32;
  assert.equal(state.details[shard][game.id].page, post.link);
  mergeSnapshots(snapshot,state,()=>true);
  assert.deepEqual(state,saved);
  mergeSnapshots({PS5:[{...post,content:{rendered:''}},coverOnly]},state,()=>false);
  assert.deepEqual(state.index.titles.map(row=>row.count),[3,0]);
  assert.deepEqual(state.index.titles.map(row=>row.cover),saved.index.titles.map(row=>row.cover));
});
