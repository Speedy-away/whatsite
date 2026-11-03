'use strict';
// Explicit copy of authored UI changes into the migrated host repository.
// Does not alter Git history, redirect pages, native runtimes or old downloads.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const source=path.resolve(__dirname,'..'),target=path.resolve('C:/Users/whatw/Documents/GitHub/WWB-HOST');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=['scripts/tests/host-file-list.test.cjs','scripts/tests/host-dashboard.test.cjs','scripts/tests/host-menu-actions.test.cjs','scripts/build-console-guides.cjs','scripts/templates/host-page.html','assets/host-dashboard.js','assets/host-folders.js','assets/host-catalog-grid.js','assets/host-catalog-grid.css','assets/host-firmware-buttons.css','scripts/build-host-selector.cjs','scripts/host-webhost-markup.cjs','scripts/host-folder-markup.cjs','scripts/build-host-support-pages.cjs','scripts/package-console-payload-sender.cjs','scripts/console-payload-bridge.cjs','scripts/tests/host-continuation-dom.cjs','scripts/tests/host-firmware-buttons.test.cjs','scripts/tests/host-catalog-grid.test.cjs','scripts/tests/host-gallery-navigation.test.cjs','assets/host-trainer.js','assets/host-trainer.css','scripts/templates/host-trainer.html','scripts/prepare-host-local-tools.cjs','scripts/build-host-trainer-art.cjs','scripts/tests/host-local-tools.test.cjs','hosts/tools/ps4-trainer/tile-art.json','hosts/tools/ps4-trainer/art/letter-cover.svg','i18n-tools/host-trainer-gallery-translations.cjs','i18n-tools/console-translations.cjs','docs/host-trainer-gallery-review.json','docs/host-trainer-tile-artwork.json',...['games','updates','payloads','loaders','tools','files'].map(n=>'assets/images/host-catalog/'+n+'.svg')];
function main(){
 assert.ok(fs.existsSync(path.join(target,'docs/migration/status.json')),'Read migration status before continuing');
 const covers=Object.values(JSON.parse(fs.readFileSync(path.join(source,'docs/ps4-ps5-game-patch-images.json'))).images).filter(r=>r.image&&r.sha256&&r.sourcePage);
 for(const art of covers){const name=art.image.replace(/^\//,'');assert.equal(sha(fs.readFileSync(path.join(source,name))),art.sha256);if(!files.includes(name))files.push(name);}
 const records=[];
 for(const name of files){
  assert.ok(!name.split('/').includes('..'));
  const from=path.join(source,name),dest=path.join(target,name),bytes=fs.readFileSync(from),digest=sha(bytes);
  const before=fs.existsSync(dest)?fs.readFileSync(dest):null;
  if(before&&sha(before)!==digest){const backup=path.join(target,'tmp/host-gallery-before',name+'.'+sha(before).slice(0,16));fs.mkdirSync(path.dirname(backup),{recursive:true});if(!fs.existsSync(backup))fs.writeFileSync(backup,before,{flag:'wx'});}
  fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);
  assert.equal(sha(fs.readFileSync(dest)),digest);records.push({name,bytes:bytes.length,sha256:digest,previousSha256:before&&sha(before)});
 }
 fs.writeFileSync(path.join(target,'docs/migration/gallery-copy.json'),JSON.stringify({copiedAt:new Date().toISOString(),source,target,files:records,scope:'Authored firmware-button/game-gallery/trainer UI only. Main redirects, native runtimes, original payloads and all archived versions preserved.'},null,2)+'\n');
 console.log(JSON.stringify({target,verifiedFiles:records.length,nativeFilesChanged:0}));
}
if(require.main===module)main();module.exports={main,files};
