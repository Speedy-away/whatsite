'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const layout=require('../catalog-layout.cjs'),mods=require('../mod-catalog-layout.cjs');
const fixture='<html><head></head><body class="console-guide"><main class="main-content"><div class="hero-buttons"><a class="btn" href="#downloads">Downloads</a><a class="btn" href="/pc/">PC</a></div><div class="games-grid"><article class="guide-resource"><img src="/assets/preview.png"><a href="/downloads/build-1.56.zip" download>Download 1.56 HEN</a></article></div></main></body></html>';
test('mod layouts compact media and remove only the unrelated header shortcut',()=>{
 const html=layout.apply('console/mods/ps4/call-of-duty/black-ops-1/index.html',fixture);
 assert.ok(html.includes('data-mod-catalog'));assert.ok(html.includes('/assets/mod-catalog-layout.css?v=1'));
 assert.ok(!html.includes('href="/pc/"'));assert.ok(html.includes('href="#downloads"'));assert.ok(html.includes('href="/downloads/build-1.56.zip" download'));
 assert.equal(layout.apply('console/mods/ps4/call-of-duty/black-ops-1/index.html',html),html);
});
test('all platform mod families are covered without touching unrelated or packaged pages',()=>{
 for(const file of ['console/mods/ps4/rdr2/index.html','console/ps3/mods/gta-v/index.html','console/xbox360/mods.html','pc/discord-mods/index.html','mods/skyrim.html','console/retro/wii/game-mods.html'])assert.ok(mods.isModPage(file),file);
 for(const file of ['pc/ports.html','hosts/ps4/mods/index.html','downloads/mods/tool.html','source-codes/console/ps4/gta5/index.html'])assert.equal(mods.apply(file,fixture),fixture,file);
 const redirect=fixture.replace('</head>','<meta http-equiv="refresh" content="0;url=/mods/"></head>');assert.equal(mods.apply('mods.html',redirect),redirect);
});
test('catalogue media limits leave full-size guide panels and unrelated catalogues alone',()=>{
 const css=fs.readFileSync('assets/mod-catalog-layout.css','utf8');assert.ok(css.includes('--catalog-fill: auto-fill'));assert.ok(css.includes('max-height: 180px'));assert.ok(css.includes('.main-content'));assert.ok(!css.includes('.guide-dialog__body'));assert.ok(css.includes('align-items: start'));
});

test('breadcrumbs follow game and platform parents and the back link uses the immediate parent',()=>{
 const crumbs=require('../mod-breadcrumbs.cjs');
 const file='console/mods/ps4/call-of-duty/black-ops-1/index.html';
 assert.deepEqual(crumbs.trail(file).map(row=>row[1]),['Home','Console','Mods / Mod Menus','PS4/PS5','Call of Duty','Black Ops 1']);
 const html=mods.apply(file,fixture.replace('<div class="hero-buttons">','<div class="guide-breadcrumb"><a href="/">Home</a> / Console</div><h1>Black Ops 1</h1><div class="hero-buttons">'));
 assert.ok(html.includes('Back to Call of Duty'));assert.ok(html.includes('aria-current="page">Black Ops 1'));
 assert.equal(mods.apply(file,html),html);
});
test('every audited mod page has valid breadcrumbs, a back link and preserved downloads',()=>{
 const {pages,relativePath}=require('../site-public-pages.cjs'),crumbs=require('../mod-breadcrumbs.cjs');
 for(const file of pages()){
  const html=fs.readFileSync(file,'utf8');if(!html.includes('data-mod-catalog'))continue;
  assert.equal((html.match(/class="mod-back-link"/g)||[]).length,1,file);
  assert.equal((html.match(/class="guide-breadcrumb mod-breadcrumb"/g)||[]).length,1,file);
  for(const [href] of crumbs.trail(relativePath(file),html))assert.ok(fs.existsSync('.'+href+(href.endsWith('/')?'index.html':'')),file+' -> '+href);
  assert.equal(layout.apply(file,html),html,file);
 }
});
