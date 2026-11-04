const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const tags=require('../page-search-tags.cjs'),{codes}=require('../multilingual-search-terms.cjs'),{concepts}=require('../../i18n-tools/discovery-concepts.cjs');
function dictionary(code){const box={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../languages',code+'.js'),'utf8'),box);return box.window.__scoobyI18nQueue[0][1];}
test('every language finds a tagged emulator while version, download and platform filters retain their exact values',()=>{
 const before='<article data-search="RPCS3 PS3 emulator 0.0.35" data-category="pc" data-game-version="1.27"><h3>RPCS3</h3><a href="/downloads/pinned-0.0.35.zip">Download</a></article>';
 const after=tags.apply('pc/emulators.html',before),search=tags.decode(after.match(/data-search="([^"]+)"/)[1]);
 for(const code of codes)assert.ok(search.includes(dictionary(code).Emulators.toLowerCase()),code);
 assert.ok(after.includes('data-category="pc"'));assert.ok(after.includes('data-game-version="1.27"'));assert.ok(after.includes('href="/downloads/pinned-0.0.35.zip"'));
 assert.ok(!search.includes('playstation 5'));assert.equal(tags.apply('pc/emulators.html',after),after);
});
test('generated translations never become English source subjects on repeat generation',()=>{
 const before='<article data-search="cheats" data-category="ps4"><h3>Original Menu</h3></article>';
 const once=tags.apply('console/ps4/mods.html',before);assert.equal(tags.apply('console/ps4/mods.html',once),once);
 // A hand-edited source remains intact even if its old suffix marker is stale.
 const edited=once.replace(/data-search="[^"]*"/,'data-search="manually edited 5.05 CUSA00001"');
 assert.ok(tags.apply('console/ps4/mods.html',edited).includes('manually edited 5.05 cusa00001'));
});
test('all language dictionaries carry literal-preserving keyword templates and translate visible tags',()=>{
 const runtime=fs.readFileSync(path.join(__dirname,'../../languages/i18n.js'),'utf8'),source=fs.readFileSync(path.join(__dirname,'i18n-runtime.test.cjs'),'utf8'),from=source.indexOf('function fixture(options = {}) {'),to=source.indexOf('\ntest(',from),box={source:runtime,vm,Intl};vm.createContext(box);vm.runInContext(source.slice(from,to),box);
 const f=box.fixture(),meta=f.doc.head.appendChild(f.doc.createElement('meta'));meta.setAttribute('name','keywords');const keyword='PS4 Mods, emulators, PS3 Themes, GoldHEN, CUSA00419, 5.05';meta.setAttribute('content',keyword);
 const label=f.element('span','Game patches'),file=f.element('code','GoldHEN-2.4b18.3-PS4-5.05.bin');
 for(const code of codes){const d=dictionary(code);for(const {aliases}of concepts)for(const alias of aliases){assert.ok(d[alias],code+': '+alias);assert.ok(d['{name} '+alias].includes('{name}'));}
  f.api.register(code,d);f.api.set(code);const value=meta.getAttribute('content');assert.ok(value.includes(d.emulators));for(const pin of ['PS4','PS3','GoldHEN','CUSA00419','5.05'])assert.ok(value.includes(pin),code+': '+pin);
  assert.equal(label.textContent,d['Game patches']);assert.equal(file.textContent,'GoldHEN-2.4b18.3-PS4-5.05.bin');f.api.set('en');assert.equal(meta.getAttribute('content'),keyword);assert.equal(label.textContent,'Game patches');
 }
});
test('migration redirects, foreign canonical pages and archived HTML remain byte-for-byte intact',()=>{
 const card='<article data-search="emulator"><h3>Emulator</h3></article>';
 for(const [file,html]of [['hosts/index.html','<meta http-equiv="refresh" content="0;url=https://speedy-away.github.io/">'+card],['hosts/ps4/exploit/test/index.html','<link rel="canonical" href="https://speedy-away.github.io/hosts/ps4/">'+card],['downloads/old-v1/helper.html',card],['console/legacy-alias.html','<meta name="robots" content="noindex, follow">'+card]])assert.equal(tags.apply(file,html),html);
});
