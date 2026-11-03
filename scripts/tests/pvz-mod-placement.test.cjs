'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {move}=require('../move-pvz-to-mods.cjs'),art=require('../category-card-art.cjs'),root=path.resolve(__dirname,'../..');
test('Plants vs Zombies Fusion belongs to Game Mods, preserving every original resource URL',()=>{
 const [downloads,mods,detail]=['games-downloads/index.html','pages/mods.html','games-downloads/plants-vs-zombies.html'].map(f=>fs.readFileSync(path.join(root,f),'utf8'));
 assert.ok(!art.cards(downloads).some(c=>/Fusion mods for PvZ/.test(c.html)));
 const cards=art.cards(mods).filter(c=>c.html.includes('/games-downloads/plants-vs-zombies.html'));assert.equal(cards.length,1);assert.ok(cards[0].html.includes('data-mod="plants vs zombies'));assert.ok(cards[0].html.includes('PvZ2 Fusion'));
 assert.ok(detail.includes('href="/pages/mods.html" class="btn btn-outline"'));
 assert.deepEqual(move(downloads,mods,detail),{downloads,mods,detail});
});
