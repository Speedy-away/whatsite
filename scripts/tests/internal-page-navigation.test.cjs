'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const nav=require('../internal-page-navigation.cjs');
test('internal page links stay in the current tab while guide triggers remain intact',()=>{
 const source='<a href="/console/mods/ps4/" target="_blank" rel="noopener noreferrer" aria-label="Browse (opens in a new tab)">Browse <i class="fas fa-external-link-alt"></i></a><a href="https://whatwhatboy.com/console/mods/ps4/rdr2/" target="_blank">RDR2</a><a href="/console/mods/ps4/gta5/install.html" data-guide-open>Guide</a>';
 const next=nav.apply('console/mods/index.html',source);assert.ok(!next.includes('target='));assert.ok(!next.includes('new tab'));assert.ok(next.includes('fa-arrow-right'));assert.ok(next.includes('data-guide-open'));assert.equal(nav.apply('console/mods/index.html',next),next);
});
test('external resources, download actions and independent host documents are preserved',()=>{
 const source='<a href="https://github.com/example/releases/v1" target="_blank" rel="noopener noreferrer">Source</a><a href="/downloads/tool.html" download target="_blank">Download</a><a href="/assets/file.zip" target="_blank">File</a>';
 assert.equal(nav.apply('console/mods/index.html',source),source);assert.equal(nav.apply('hosts/ps4/index.html',source),source);
});
test('mod catalogue selection has no forced new-tab links',()=>{
 const html=fs.readFileSync('console/mods/index.html','utf8');assert.ok(!html.includes('Console catalogues open in a new tab'));assert.ok(!html.includes('(opens in a new tab)'));for(const link of html.match(/<a\b[^>]*href="\/console\/(?:mods|ps3|xbox360)[^"]*"[^>]*>/g)||[])assert.ok(!link.includes('target='),link);
});
