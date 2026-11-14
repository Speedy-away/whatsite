'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const nav=require('../mod-menu-navigation.cjs');
test('PC hub is removed without losing the other PC menu destinations',()=>{
 const source='<div><a href="/pc/">PC hub</a><a href="/pages/mods.html">Game mods</a><a href="/pc/emulators.html">Emulators</a><a href="/pc/ports.html">Ports</a><a href="/tools/">Tools</a></div>';
 const result=nav.apply('index.html',source);assert.ok(!result.includes('PC hub'));for(const path of ['/pages/mods.html','/pc/emulators.html','/pc/ports.html','/tools/'])assert.ok(result.includes('href="'+path+'"'));
 const moved=nav.apply('pc/index.html','<h1>PC hub</h1>');assert.match(moved,/noindex, follow/);assert.ok(moved.includes('/pages/pc-mods-selector.html'));assert.ok(!moved.includes('<h1>PC hub'));
});
test('homepage puts mod selector first while PC navigation still reaches the game list',()=>{
 const source='<header><a href="/pages/mods.html">Game mods</a></header><div class="home-directory-grid"><a href="/games-downloads/"><strong>Game downloads</strong></a><a href="/console/"><strong>Console guides</strong></a><a href="/pages/mods.html"><strong>Game mods</strong></a><a href="/tools/"><strong>Tools</strong></a></div>';
 const html=nav.apply('index.html',source);
 assert.ok(html.includes('<header><a href="/pages/mods.html">Game Mods / Mod Menus</a></header>'));
 const cards=[...html.match(/<div class="home-directory-grid">([\s\S]*?)<\/div>/)[1].matchAll(/href="([^"]+)"/g)].map(x=>x[1]);assert.deepEqual(cards,[nav.selector,'/games-downloads/','/console/','/tools/']);assert.equal(nav.apply('index.html',html),html);
});
test('Console and PC choices lead to working static destinations and PC keeps all game cards',()=>{
 const selector=fs.readFileSync('pages/mods-selector.html','utf8'),pc=fs.readFileSync('pages/pc-mods-selector.html','utf8'),mods=fs.readFileSync('pages/mods.html','utf8');
 assert.match(selector,/href="\/console\/mods\/"/);assert.ok(selector.includes('href="'+nav.pcSelector+'"'));
 assert.match(pc,/href="\/cheats\/"/);assert.match(pc,/href="\/pages\/mods.html"/);assert.match(pc,/<h2>Free Cheats<\/h2>/);assert.match(pc,/<h2>Game Mods \/ Mod Menus<\/h2>/);
 assert.match(mods,/<h1[^>]*>Game Mods \/ Mod Menus<\/h1>/);assert.ok(mods.includes('href="'+nav.pcSelector+'"'));assert.match(mods,/id="gameSearch"/);assert.match(mods,/Grand Theft Auto V/);
});
