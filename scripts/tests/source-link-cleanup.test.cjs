'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {category,pinnedSource,deliverySource,candidates,MIN_BYTES}=require('../source-link-cleanup.cjs');
test('source-first cleanup identifies games/apps and excludes mods, payloads and helper snapshots',()=>{
  assert.equal(category({title:'Dynamismal',category:'Homebrew games'}),'games');
  assert.equal(category({title:'Cemu',pages:['pc/emulators.html']}),'apps-homebrew');
  for(const item of [{title:'Demonic RDR',category:['Games']},{title:'Jimbo',pages:['console/ps3/mods/multicod/index.html']},{title:'GTA5 mod menu',category:'Games'},{title:'Console Payload Sender',category:'Tools'},{title:'GoldHEN payload',category:'Homebrew'}])assert.equal(category(item),null);
  assert.equal(category({title:'Super Lillie Galaxy',category:['Games','Mods']}),null);
  assert.equal(category({title:'Another Super Mario Bros.',pages:['console/retro/wii/game-mods.html']}),null);
  assert.equal(category({title:'webMAN MOD'}),'apps-homebrew');
});
test('mutable publisher packages and extracted files carry visible delivery requirements',()=>{
  const url='https://wiiu.cdn.fortheusers.org/zips/Example.zip';
  assert.deepEqual(deliverySource({sourceUrl:url}),{url,sourceVersionPinned:false});
  const archive={name:'Example.zip',sourceUrl:url,bytes:20,sha256:'a'.repeat(64),backupPath:'archive.zip'},ready={name:'example.wuhb',local:'/downloads/example.wuhb',sourceUrl:url,bytes:MIN_BYTES,sha256:'b'.repeat(64),backupPath:'ready.wuhb',version:'1.2',derivedFrom:{sha256:archive.sha256,member:'example.wuhb'}};
  const [entry]=candidates({items:[{title:'Example',category:'Homebrew games',files:[archive,ready]}]});
  assert.equal(entry.requiresExtraction,true);assert.equal(entry.sourceSha256,archive.sha256);assert.match(entry.linkNote,/Original ZIP; extract example.wuhb/);assert.match(entry.linkNote,/version may change/);
  const {annotate}=require('../source-download-notes.cjs');const html=annotate('<a href="/downloads/example.wuhb" download>Download WUHB</a>','index.html',[entry]);assert.match(html,/source-download-note/);assert.match(html,/Original ZIP/);assert.equal(annotate(html,'index.html',[entry]),html);
});
test('only version-pinned assets qualify and extracted builds retain their exact ready file',()=>{
  const url='https://github.com/vendor/app/releases/download/v1.0/app.zip';
  assert.equal(pinnedSource({sourceUrl:url}),url);
  assert.equal(pinnedSource({resolvedUrl:url}),url);
  for(const file of [{sourceUrl:'https://github.com/vendor/app/releases/latest/download/app.zip'},{sourceUrl:'https://github.com/vendor/app/releases/download/nightly/app.zip'},{sourceUrl:url+'?token=private'},{sourceUrl:url,derivedFrom:{member:'app.bin'}},{sourceUrl:url,role:'extracted-build'}])assert.equal(pinnedSource(file),null);
  const app={title:'App',category:'Homebrew',files:[{local:'/downloads/app.zip',bytes:MIN_BYTES,sha256:'a'.repeat(64),backupPath:'archive',resolvedUrl:url}]};
  assert.equal(candidates({items:[app,app]}).length,1);
  assert.equal(candidates({items:[app]},new Set(['/downloads/app.zip'])).length,0);
});
test('an upstream delivery mapping prevents restoring a verified large mirror in future catalogue builds',t=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'source-link-policy-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  fs.mkdirSync(path.join(root,'docs'));fs.mkdirSync(path.join(root,'downloads'));fs.writeFileSync(path.join(root,'downloads/app.zip'),'saved');fs.writeFileSync(path.join(root,'downloads/mod.zip'),'saved');
  fs.writeFileSync(path.join(root,'docs/download-source-links.json'),JSON.stringify({entries:[{local:'/downloads/app.zip'}]}));
  const {publicMirror}=require('../download-mirror-policy.cjs');assert.equal(publicMirror('/downloads/app.zip',root),null);assert.ok(publicMirror('/downloads/mod.zip',root));
});
