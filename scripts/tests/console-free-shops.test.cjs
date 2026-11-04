const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const shops=require('../console-free-shops.cjs'),finish=require('../search-page-output.cjs').finish;
const root=path.resolve(__dirname,'../..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
test('all three shops retain exact sources and compatibility across the requested pages',()=>{
 for(const file of ['console/free-shops/index.html',...['ps4','ps5'].flatMap(p=>[`console/${p}/free-shops.html`,`console/${p}/game-downloads.html`])]){
  const html=read(file);
  for(const url of Object.values(shops.sources))assert.ok(html.includes(url),file+': '+url);
  for(const id of ['infinitykkj-store','nova-store','orbit-store'])assert.equal(html.split(`id="${id}"`).length-1,1,file+': '+id);
  assert.match(html,/PS5 only/);assert.match(html,/PS5 support is not confirmed/);assert.match(html,/v0\.0\.11 Beta/);
  assert.ok(html.includes('https://github.com/saawant12/orbit-store-ps5/releases/download/v1.8.1/orbit_store.elf'));
  if(file==='console/ps5/game-downloads.html')assert.match(require('../console-game-directories.cjs').apply(file,html),/PS5 only/);
  assert.ok(html.includes('Google Drive files currently report a download quota limit')||file.endsWith('game-downloads.html'));
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,file+': duplicate IDs');
  assert.equal(finish(file,html),html,file+': regeneration must be stable');
 }
});
test('console hubs expose separate categories with the new game-cover artwork',()=>{
 for(const p of ['ps4','ps5']){
  const file=`console/${p}/index.html`,html=read(file);
  assert.equal(html.split(`data-free-shops-card="${p}"`).length-1,1);
  assert.ok(html.includes(`/console/${p}/free-shops.html`));assert.ok(html.includes(shops.artwork));assert.ok(html.includes(shops.gameArtwork));
  const refreshed=finish(file,html);assert.equal(finish(file,refreshed),refreshed);
 }
 for(const file of ['console/game-downloads/index.html','games-downloads/index.html'])assert.ok(read(file).includes('href="/console/free-shops/"'),file);
});
test('Free Shops integration preserves pinned downloads and excludes packaged tools',()=>{
 const fixture='<main><nav class="guide-nav"><a href="/console/ps4/">Hub</a></nav><a href="/downloads/build-v1.pkg" download>Exact original</a></main>';
 const output=shops.apply('console/ps4/apps.html',fixture);
 assert.ok(output.includes('<a href="/downloads/build-v1.pkg" download>Exact original</a>'));
 assert.equal(shops.apply('console/ps4/apps.html',output),output);
 for(const file of ['downloads/example.html','console/ps4/whatsite-ps4.html','console/ps5/whatsite-ps5.html'])assert.equal(shops.apply(file,fixture),fixture);
});
