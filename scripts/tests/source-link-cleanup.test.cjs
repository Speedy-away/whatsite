'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {category,pinnedSource,candidates,MIN_BYTES}=require('../source-link-cleanup.cjs');
test('source-first cleanup identifies games/apps and excludes mods, payloads and helper snapshots',()=>{
  assert.equal(category({title:'Dynamismal',category:'Homebrew games'}),'games');
  assert.equal(category({title:'Cemu',pages:['pc/emulators.html']}),'apps-homebrew');
  for(const item of [{title:'Demonic RDR',category:['Games']},{title:'Jimbo',pages:['console/ps3/mods/multicod/index.html']},{title:'GTA5 mod menu',category:'Games'},{title:'Console Payload Sender',category:'Tools'},{title:'GoldHEN payload',category:'Homebrew'}])assert.equal(category(item),null);
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
