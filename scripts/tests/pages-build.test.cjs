'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {rewriter, rawURL, eligible} = require('../build-pages.cjs');
const {renderCompanion} = require('../console-download-companion.cjs');
test('Pages references resolve to exact encoded repository files without modifying compatibility or hashes', () => {
  const name = 'downloads/ps4/Old Menu (1.0).zip', revision = 'a'.repeat(40), target = rawURL(name, revision);
  const rewrite = rewriter(new Map([[name, target]]));
  const html = '<a href="/downloads/ps4/Old%20Menu%20(1.0).zip">1.0</a><a href="../Old%20Menu%20(1.0).zip">old</a>';
  const result = rewrite(html, 'downloads/ps4/child/index.html');
  assert.equal((result.match(/raw\.githubusercontent\.com/g)||[]).length, 2);
  assert.ok(result.includes(target));
  assert.equal(rewrite('{"url":"https://whatwhatboy.com/downloads/ps4/Old%20Menu%20(1.0).zip","sha256":"original","firmwares":["9.00"]}', 'docs/catalog.json'), '{"url":"'+target+'","sha256":"original","firmwares":["9.00"]}');
  assert.equal(rewrite('/downloads/ps4/Old%20Menu%20(1.0).zip.extra', 'index.html'), '/downloads/ps4/Old%20Menu%20(1.0).zip.extra');
});
test('Pages excludes repository internals and QA captures but retains runtime and immutable download helpers', () => {
  for (const name of ['.git/config','.agents/skills/a','scripts/test.cjs','docs/qa/a.txt','docs/screenshots/a.png']) assert.equal(eligible(name), false, name);
  for (const name of ['hosts/runtime/ps4/index.html','docs/host-actions-ps4.json','downloads/helpers/old/helper.html','CNAME']) assert.equal(eligible(name), true, name);
});
test('new native receiver snapshots fetch repository bytes directly while preserving source pins and foreign URLs', () => {
  const items = [{id:'one',url:'https://whatwhatboy.com/downloads/ps4/menu.bin',filename:'menu.bin',sha256:'a'.repeat(64),bytes:123,firmwares:['9.00']},{id:'two',url:'https://example.com/build.pkg'}];
  const html = renderCompanion('ps4', items);
  const result = JSON.parse(html.match(/<script id="receiver-catalog" type="application\/json">([\s\S]*?)<\/script>/)[1]).items;
  assert.deepEqual(result[0], {...items[0],url:rawURL('downloads/ps4/menu.bin')});
  assert.deepEqual(result[1], items[1]);
  assert.equal(items[0].url, 'https://whatwhatboy.com/downloads/ps4/menu.bin');
});
