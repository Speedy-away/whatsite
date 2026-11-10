'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {build, rewriter, rawURL, eligible, plan, LIMIT} = require('../build-pages.cjs');
const {renderCompanion} = require('../console-download-companion.cjs');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
test('Pages references resolve to exact encoded repository files without modifying compatibility or hashes', () => {
  const name = 'downloads/ps4/Old Menu (1.0).zip', revision = 'a'.repeat(40), target = rawURL(name, revision);
  const rewrite = rewriter(new Map([[name, target]]));
  const html = '<a href="/downloads/ps4/Old%20Menu%20(1.0).zip">1.0</a><a href="../Old%20Menu%20(1.0).zip">old</a>';
  const result = rewrite(html, 'downloads/ps4/child/index.html');
  assert.equal((result.match(/raw\.githubusercontent\.com/g)||[]).length, 2);
  assert.ok(result.includes(target));
  assert.equal(rewrite('{"url":"https://whatwhatboy.com/downloads/ps4/Old%20Menu%20(1.0).zip","sha256":"original","firmwares":["9.00"]}', 'docs/catalog.json'), '{"url":"'+target+'","sha256":"original","firmwares":["9.00"]}');
  assert.equal(rewrite('/downloads/ps4/Old%20Menu%20(1.0).zip.extra', 'index.html'), '/downloads/ps4/Old%20Menu%20(1.0).zip.extra');
  const entity = rewriter(new Map([['downloads/ps3/A & B.zip', rawURL('downloads/ps3/A & B.zip')]]));
  assert.equal(entity('<a href="/downloads/ps3/A%20&amp;%20B.zip" download>Download</a>', 'downloads/index.html'), '<a href="'+rawURL('downloads/ps3/A & B.zip')+'" download>Download</a>');
  const image = rewriter(new Map([['assets/images/test.png',rawURL('assets/images/test.png')]]));
  assert.equal(image('<img src="../../assets/images/test.png">','games/example/index.html'),'<img src="'+rawURL('assets/images/test.png')+'">');
  assert.equal(image('https://example.com/assets/images/test.png','index.html'),'https://example.com/assets/images/test.png');
});
test('main Pages excludes migrated native hosts and internals but retains compatibility redirects and download helpers', () => {
  for (const name of ['.git/config','.agents/skills/a','scripts/test.cjs','docs/qa/a.txt','docs/screenshots/a.png','hosts/runtime/ps4/index.html']) assert.equal(eligible(name), false, name);
  for (const name of ['hosts/index.html','docs/host-actions-ps4.json','downloads/helpers/old/helper.html','CNAME']) assert.equal(eligible(name), true, name);
});
test('Pages stages one native ad rail and preserves excluded documents', () => {
  const root = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'pages-ads-'));
  try {
    const {applyAds, publishAds} = require('../site-ads.cjs');
    const html = '<html><head></head><body><main class="main-content" id="main-content"><section>Content</section></main></body></html>';
    const withBanner = applyAds('index.html', html)
      .replace('<head>', '<head><script>const head = "</head>";</script><script async data-cfasync="false" src="https://abscloud.org/1/366a2e3edafab888009b3076fcd47b82"></script>')
      .replace('<body>', '<body><script defer src="https://aloudalimonyexplosion.com/57/23/ae/5723aef0781af6b27fc0113e359a1d7c.js"></script>');
    const files = {'index.html': withBanner, '404.html': '<html><body>Missing</body></html>', 'pages/new.html': html, 'hosts/index.html': withBanner, 'downloads/helper/index.html': withBanner};
    for (const [name, content] of Object.entries(files)) {
      const file = path.join(root, name);
      fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, content);
    }
    const output = path.join(root, 'stage');
    build({root, output, names: Object.keys(files)});
    const staged = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
    assert.match(staged, /<script data-cfasync="false" src="https:\/\/abscloud\.org\/1\/366a2e3edafab888009b3076fcd47b82"><\/script>\s*<\/head>/);
    assert.match(staged, /<script data-cfasync="false" src="https:\/\/bauval\.org\/14\/5723aef0781af6b27fc0113e359a1d7c"><\/script>\s*<\/body>/);
    assert.equal(staged.match(/366a2e3edafab888009b3076fcd47b82/g).length, 1);
    assert.equal(staged.match(/5723aef0781af6b27fc0113e359a1d7c/g).length, 1);
    assert.match(staged, /<a [^>]*href="https:\/\/araplhn\.org\/4\/ac85b864baf2e2322b99cd2ad051fbc2"[^>]*rel="sponsored noopener noreferrer">Sponsored link<\/a>/);
    assert.match(staged, /<div id="container-fd0a4dcec74a63f4d2662af5273f9d5b"><\/div>\s*<script async="async" data-cfasync="false" src="https:\/\/bauval\.org\/21\/fd0a4dcec74a63f4d2662af5273f9d5b"><\/script>/);
    assert.match(staged, /class="site-ad-layout"/);
    assert.match(fs.readFileSync(path.join(output, 'pages/new.html'), 'utf8'), /id="page-advertisement"/);
    assert.doesNotMatch(fs.readFileSync(path.join(output, '404.html'), 'utf8'), /id="page-advertisement"/);
    assert.equal(staged.match(/id="container-fd0a4dcec74a63f4d2662af5273f9d5b"/g).length, 1);
    assert.doesNotMatch(staged, /aloudalimonyexplosion\.com/);
    assert.match(staged, /<script>const head = "<\/head>";<\/script>/);
    assert.equal(publishAds('index.html', staged), staged);
    assert.equal(fs.readFileSync(path.join(output, 'hosts/index.html'), 'utf8'), withBanner);
    assert.equal(fs.readFileSync(path.join(output, 'downloads/helper/index.html'), 'utf8'), withBanner);
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
});
test('new native receiver snapshots fetch repository bytes directly while preserving source pins and foreign URLs', () => {
  const items = [{id:'one',url:'https://whatwhatboy.com/downloads/ps4/menu.bin',filename:'menu.bin',sha256:'a'.repeat(64),bytes:123,firmwares:['9.00']},{id:'two',url:'https://example.com/build.pkg'}];
  const html = renderCompanion('ps4', items);
  const result = JSON.parse(html.match(/<script id="receiver-catalog" type="application\/json">([\s\S]*?)<\/script>/)[1]).items;
  assert.deepEqual(result[0], {...items[0],url:rawURL('downloads/ps4/menu.bin')});
  assert.deepEqual(result[1], items[1]);
  assert.equal(items[0].url, 'https://whatwhatboy.com/downloads/ps4/menu.bin');
});
test('runtime data transport maps only pinned GET/HEAD data files and strips cross-origin credentials', async () => {
  const calls = [], events = {}, local = '/hosts/runtime/karo-test/web/900/payload.bin';
  const remote = rawURL(local.slice(1), 'b'.repeat(40));
  function XHR() {}
  XHR.prototype.open = function (...args) { calls.push(args); };
  XHR.prototype.setRequestHeader = function (...args) { calls.push(args); };
  const win = {URL, Headers, location:{href:'https://whatwhatboy.com/hosts/runtime/karo-test/web/900/index.html',origin:'https://whatwhatboy.com'}, WHATSITE_RUNTIME_FILES:{[local]:remote}, XMLHttpRequest:XHR, fetch:(...args)=>{calls.push(args);return Promise.resolve('bytes');}, document:{addEventListener:(name,fn)=>events[name]=fn}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../assets/pages-runtime-files.js'),'utf8'),{window:win});
  const request = new XHR();request.open('GET','payload.bin',true);assert.equal(calls[0][1],remote);assert.equal(request.withCredentials,false);
  request.setRequestHeader('Authorization','private');assert.equal(calls.length,1);request.setRequestHeader('Range','bytes=0-99');assert.deepEqual(calls[1],['Range','bytes=0-99']);
  await win.fetch('payload.bin',{mode:'same-origin',credentials:'include',headers:{Authorization:'private',Range:'bytes=0-99'}});
  const [target, options] = calls[2];assert.equal(target,remote);assert.equal(options.mode,'cors');assert.equal(options.credentials,'omit');assert.equal(options.headers.has('Authorization'),false);assert.equal(options.headers.get('Range'),'bytes=0-99');
  for (const [url,method] of [['payload.bin','POST'],['https://example.com/payload.bin','GET'],['original.js','GET'],['/__local__/install','POST']]) {await win.fetch(url,{method});assert.equal(calls.at(-1)[0],url);}
  const link = {tagName:'A',href:'https://whatwhatboy.com'+local};events.click({target:link});assert.equal(link.href,remote);
});

test('migrated host archives and legacy desktop DLLs can use exact repository delivery within the Pages budget', () => {
  const root = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'pages-migrated-host-'));
  try {
    fs.mkdirSync(path.join(root,'docs'));
    fs.writeFileSync(path.join(root,'docs/host-actions-ps5.json'), JSON.stringify({actions:[{downloadURL:'/downloads/legacy-native.elf'}]}));
    const names=['downloads/legacy-native.elf','scooby/FSL/WINMM.dll'];
    const sizes=new Map([[names[0],170*1048576],[names[1],17*1048576]]);
    const result=require('../build-pages.cjs').plan(root,names,'a'.repeat(40),sizes,890*1048576);
    for(const name of names)assert.equal(result.offloaded.get(name),rawURL(name,'a'.repeat(40)));
    assert.equal(result.bytes,890*1048576);
    assert.ok(fs.existsSync(path.join(root,'docs/host-actions-ps5.json')));
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});

test('Pages may use rewrite headroom but still enforces the planned size limit', () => {
  const mib = 1024 * 1024;
  const root = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'pages-headroom-'));
  const names = ['index.html', 'downloads/archive.zip'];
  const sizes = new Map([[names[0], 25 * mib], [names[1], 50 * mib]]);
  const revision = 'a'.repeat(40);
  try {
    const result = plan(root, names, revision, sizes, 860 * mib, 64 * mib);
    assert.equal(result.bytes, 885 * mib);
    assert.equal(result.offloaded.get(names[1]), rawURL(names[1], revision));
    assert.throws(() => plan(root, names, revision, sizes, LIMIT, 64 * mib), /exceed the 900 MiB/);
  } finally { fs.rmdirSync(root); }
});

test('the shared site shell replaces legacy navigation without changing the page content', () => {
  const shell = require('../site-shell.cjs').create(path.resolve(__dirname, '../..'));
  const main = '<main class="main-content" id="main-content"><a href="/downloads/v1.zip" download>Version 1</a><dialog id="guide">Guide</dialog></main>';
  const original = '<html><head><link rel="stylesheet" href="/assets/site-background.css?v=2"></head><body class="site-atmosphere"><div class="sidebar" id="sidebar"><div>Legacy navigation</div></div><header class="mobile-site-header"><button id="mobile-sidebar-btn">Menu</button></header>' + main + '</body></html>';
  const published = shell('console/ps4/index.html', original);
  assert.match(published, /class="home-taskbar"/);
  assert.match(published, /href="\/console\/ps4\/" aria-current="page"/);
  assert.match(published, /href="\/cheats\/">Cheats/);
  assert.match(published, /\/assets\/site-shell\.css/);
  assert.doesNotMatch(published, /mobile-sidebar-btn|site-background\.css|Legacy navigation/);
  assert.ok(published.includes(main));
  assert.equal(shell('console/ps4/index.html', published), published);
  const cheats = fs.readFileSync(path.resolve(__dirname, "../../cheats/index.html"), "utf8");
  const directory = shell("cheats/index.html", cheats);
  assert.match(directory, /href="\/cheats\/" aria-current="page">Cheats/);
  const menu = directory.match(/<details data-current class="home-menu home-cheats-menu"[^>]*>([\s\S]*?)<\/details>/)[1];
  const gameLinks = html => [...html.matchAll(/href="(\/games\/[^"]+)"/g)].map(match => match[1]).sort();
  assert.deepEqual(gameLinks(menu), gameLinks(cheats));
  for (const route of ['hosts/index.html', 'console/ps4/whatsite-ps4.html', 'free-keys/scooby/index.html', 'downloads/tools/index.html']) {
    assert.equal(shell(route, original), original);
  }
});
test('the console sidebar links to the console picker immediately after mod menus', () => {
  const {apply} = require('../console-download-navigation.cjs');
  const html = '<nav><ul class="nav-sublist nav-console-list"><li><a href="../mods/index.html">Mods / Mod Menus</a></li></ul></nav>';
  const file = 'console/ps4/index.html';
  const result = apply(file, html);
  assert.match(result, /Mods \/ Mod Menus<\/a><\/li><li><a [^>]*href="\/console\/game-downloads\/">/);
  assert.equal(apply(file, result), result);
  assert.equal(apply('hosts/ps4/index.html', html), html);
});
test('Pages publishes exact-revision routes for offloaded legacy library details', () => {
  const root = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'pages-library-'));
  try {
    const index = 'assets/playstation-library/index.json';
    const modern = 'assets/playstation-library/00.json';
    const legacy = 'assets/playstation-library/legacy/00.json';
    const files = {'404.html': '<html></html>', [index]: '{"titles":[]}', [modern]: '{}', [legacy]: '{"test":{}}'};
    const names = Object.keys(files);
    for (const [name, body] of Object.entries(files)) {
      const file = path.join(root, name);
      fs.mkdirSync(path.dirname(file), {recursive: true});
      fs.writeFileSync(file, body);
    }
    const sizes = new Map(names.map(name => [name, Buffer.byteLength(files[name])]));
    sizes.set(modern, LIMIT - 100);
    sizes.set(legacy, 200);
    const output = path.join(root, 'stage');
    const revision = 'a'.repeat(40);
    build({root, output, names, sizes, revision});
    assert.equal(JSON.parse(fs.readFileSync(path.join(output, index), 'utf8')).legacyDetails['00'], rawURL(legacy, revision));
    assert.ok(fs.existsSync(path.join(output, modern)));
    assert.ok(!fs.existsSync(path.join(output, legacy)));
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
});
test('Pages retains the library waves and share image when artwork is offloaded', () => {
  const mib = 1024 * 1024;
  const base = 'assets/images/playstation-library/';
  const essentials = ['xmb-wave-dark.svg', 'share-black-wave-v1.png'].map(name => base + name);
  const thumbnail = base + 'dlpsgame/example.jpg';
  const sizes = new Map([[thumbnail, 3 * mib], ...essentials.map(name => [name, mib / 2])]);
  const result = plan(path.resolve(__dirname, '../..'), [...sizes.keys()], 'b'.repeat(40), sizes, 899 * mib);
  assert.ok(result.offloaded.has(thumbnail));
  for (const file of essentials) assert.ok(!result.offloaded.has(file));
  assert.equal(result.bytes, LIMIT);
});

test('Pages can offload build records while retaining linked docs and delivery data', () => {
  const mib = 1024 * 1024;
  const root = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'pages-records-'));
  const record = 'docs/host-repository-migration-plan.json';
  const publicDocs = ['docs/host-gamerhack-local-build.json', 'docs/download-source-links.json',
    'docs/guides/console-files-and-archives.md', 'docs/switch-game-mods-downloads.json'];
  const sizes = new Map([[record, 20 * mib], ...publicDocs.map(name => [name, mib])]);
  const revision = 'a'.repeat(40);
  try {
    const result = plan(root, [...sizes.keys()], revision, sizes, 890 * mib);
    assert.deepEqual([...result.offloaded], [[record, rawURL(record, revision)]]);
    assert.equal(result.bytes, 894 * mib);
  } finally { fs.rmdirSync(root); }
});

test('deployment link verification follows HTML base paths and decodes quoted filenames', () => {
 const root=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'pages-link-base-'));
 try {
  const files={'pages-build.json':JSON.stringify({bytes:100}),'pages-download-map.json':'{}','games/test/index.html':'<base href="/games/test/"><script src="../../script.js"></script><a href="/downloads/What&#39;s%20new.txt">Readme</a>','script.js':'// kept',"downloads/What's new.txt":'Original notes'};
  for(const[name,value]of Object.entries(files)){const target=path.join(root,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,value);}
  const result=require('node:child_process').execFileSync(process.execPath,[path.resolve(__dirname,'../verify-pages-build.cjs'),root],{encoding:'utf8'});
  assert.equal(JSON.parse(result).issues,0);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});

test('translation source hashes tolerate Git line-ending normalization without hiding content changes',()=>{const {sourceHash}=require('../localized-html.cjs');assert.equal(sourceHash('<p>Menu</p>\r\n'),sourceHash('<p>Menu</p>\n'));assert.notEqual(sourceHash('<p>Old</p>\n'),sourceHash('<p>New</p>\n'));});
