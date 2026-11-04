'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const ads=require('../site-ads.cjs');
test('the real publisher container exists before its asynchronous script can execute',()=>{
 const html=ads.placement();
 assert.ok(html.indexOf('id="container-fd0a4dcec74a63f4d2662af5273f9d5b"')<html.indexOf('<script'));
 assert.equal((html.match(/invoke\.js/g)||[]).length,1);
 assert.match(html,/<script async="async" data-cfasync="false"/);
 assert.doesNotMatch(html,/<iframe/);
});
test('rendered ad rows remain visible when native mobile creatives exceed the old height cap',()=>{
 const css=fs.readFileSync('assets/site-ads.css','utf8');
 assert.match(css,/\.site-ad-stage\s*\{[^}]*max-height:\s*none;[^}]*overflow:\s*visible/);
 for(const file of ['pc/ports.html','pc/emulators.html']){
  const html=fs.readFileSync(file,'utf8');
  assert.ok(html.includes('/assets/site-ads.css?v=3'));
  assert.ok(html.indexOf('id="container-fd0a4dcec74a63f4d2662af5273f9d5b"')<html.indexOf('src="https://aloudalimonyexplosion.com/'));
 }
});
test('ad coverage includes every public page family while excluding native and packaged documents',()=>{
 const html='<html><head></head><body><main class="main-content" id="main-content"><section><h1>Public page</h1></section></main></body></html>';
 for(const file of ['index.html','games/cod/index.html','games-downloads/index.html','source-codes/index.html','tools/index.html','guides/phone-downloads/index.html','pages/profile.html','downloads/index.html']){
  assert.equal(ads.eligible(file,html),true,file);
  const out=ads.applyAds(file,html);assert.equal((out.match(/id="page-advertisement"/g)||[]).length,1,file);assert.equal(ads.applyAds(file,out),out,file);
 }
 for(const file of ['hosts/ps4/index.html','hosts/runtime/original/index.html','downloads/ready-build/index.html','console/ps4/whatsite-ps4.html'])assert.equal(ads.eligible(file,html),false,file);
});
test('legacy footer banners migrate once without duplicating the native unit or removing other publisher units',()=>{
 const other='<script defer src="https://aloudalimonyexplosion.com/57/other-unit.js"></script>';
 const html='<html><head></head><body><main class="main-content" id="main-content"><section>Cards</section></main><script async src="https://aloudalimonyexplosion.com/fd0a4dcec74a63f4d2662af5273f9d5b/invoke.js"></script>\n<div id="container-fd0a4dcec74a63f4d2662af5273f9d5b"></div>'+other+'</body></html>';
 const out=ads.applyAds('games/cod/index.html',html);
 assert.equal((out.match(/fd0a4dcec74a63f4d2662af5273f9d5b\/invoke\.js/g)||[]).length,1);
 assert.ok(out.indexOf('id="page-advertisement"')<out.indexOf('</main>'));
 assert.ok(out.includes(other));assert.equal(ads.applyAds('games/cod/index.html',out),out);
});
test('older DIV-based directories receive their banner inside main content',()=>{
 const html='<html><head></head><body><div class="main-content" id="main-content"><div class="container"><div>Cards</div></div></div><script src="/script.js"></script></body></html>';
 const out=ads.applyAds('games/other/index.html',html);
 assert.ok(out.includes('<!-- END SITE AD -->\n</div>'));
 assert.equal(ads.applyAds('games/other/index.html',out),out);
});
