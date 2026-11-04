// Targeted refresh: shared page generators retain the same integration on rebuild.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),shops=require('./console-free-shops.cjs');
function write(file,data){fs.writeFileSync(path.join(root,file),JSON.stringify(data,null,2)+'\n');}
function main(){
 const composite=JSON.parse(fs.readFileSync(path.join(root,'docs/category-composite-covers.json')));
 const category=JSON.parse(fs.readFileSync(path.join(root,'docs/category-card-art.json')));
 const originals={};
 for(const [route,title,art] of [
  ...['ps4','ps5'].map(p=>[`/console/${p}/game-downloads.html`,'Game downloads',shops.gameArtwork]),
  ...['/console/free-shops/index.html','/console/ps4/free-shops.html','/console/ps5/free-shops.html'].map(r=>[r,'Free shops',shops.artwork])
 ]){
  const current=composite.routes[route];
  if(current&&current.path!==art)originals[route]=current;
  const bytes=fs.readFileSync(path.join(root,art.slice(1)));
  composite.routes[route]={id:title==='Game downloads'?'game-covers-20261104':'free-shops-20261104',path:art,width:960,height:540,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),title,alt:title==='Game downloads'?'PlayStation game front cover collage':'Free Shops with PlayStation game covers and Infinitykkj STORE logo',sourceImages:['/assets/images/free-shops/game-cover-sheet.webp','/assets/images/free-shops/game-cover-grid.jpg',...(title==='Free shops'?['/assets/images/free-shops/infinitykkj-logo.png']:[])]};
  category.destinations[route]={title,kind:'downloads',images:[{src:art,alt:composite.routes[route].alt}]};
 }
 write('docs/category-composite-covers.json',composite);write('docs/category-card-art.json',category);
 const priorFile=path.join(root,'docs/free-shops-artwork.json');
 const prior=fs.existsSync(priorFile)?JSON.parse(fs.readFileSync(priorFile)):{};
 write('docs/free-shops-artwork.json',{...prior,tool:'Built-in image_gen',date:'2026-11-04',previousCovers:{...prior.previousCovers,...originals},assets:[shops.gameArtwork,shops.artwork],prompts:[
  'Wide 16:9 game-download category thumbnail using supplied front covers: GTA V, Red Dead Redemption 2, Crash Bandicoot 4, Minecraft, God of War and The Witcher 3. Two overlapping rows, full bleed, dark spacing; no extra heading, back covers, consoles or controllers.',
  'Wide 16:9 Free Shops thumbnail. Supplied GTA V, Red Dead Redemption 2, Minecraft and God of War front covers across the lower half; FREE SHOPS heading, orange shopping bag and supplied Infinitykkj STORE logo above. Dark charcoal, orange and blue highlights. No invented Nova/Orbit logos or PS5 compatibility claims.'
 ]});
 const created=shops.build();
 const scope=require('./site-public-pages.cjs');
 const files=scope.pages().map(scope.relativePath).filter(f=>/^console\/ps[45]\/[^/]+\.html$/.test(f)||['console/game-downloads/index.html','games-downloads/index.html'].includes(f));
 const changed=[];
 for(const file of files){const target=path.join(root,file),before=fs.readFileSync(target,'utf8');if(/http-equiv="refresh"/i.test(before)||require('./console-game-directories.cjs').protectedFile(file,before))continue;const after=require('./search-page-output.cjs').finish(file,before);if(before!==after){fs.writeFileSync(target,after);changed.push(file);}}
 require('./build-console-topic-hubs.cjs').finalizeMetadata([...new Set([...created,...changed])]);
 console.log(JSON.stringify({created,changed},null,2));
}
module.exports={main};if(require.main===module)main();
