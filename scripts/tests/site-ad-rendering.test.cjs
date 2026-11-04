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
