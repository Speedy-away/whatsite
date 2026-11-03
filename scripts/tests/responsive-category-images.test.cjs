const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const {apply}=require('../responsive-category-images.cjs');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
test('responsive delivery copies exist, are smaller, and preserve source images',()=>{
 for(const [source,item] of Object.entries(read('docs/optimized-category-covers.json').images)){
  assert.equal(fs.statSync(path.join(root,'.'+source)).size,item.originalBytes,source);
  for(const v of item.variants){assert.equal(fs.statSync(path.join(root,'.'+v.path)).size,v.bytes);assert.ok(v.bytes<item.originalBytes,v.path);}
 }
});
test('responsive markup retains alt text and links and is stable on repeated application',()=>{
 const source=Object.keys(read('docs/optimized-category-covers.json').images)[0];
 const html=`<a href="${source}"><img src="${source}" alt="Exact artwork" loading="lazy"></a>`;
 const out=apply('console/xbox360/index.html',html);
 assert.ok(out.includes(`href="${source}"`));assert.ok(out.includes('alt="Exact artwork"'));
 assert.ok(out.includes('srcset='));assert.ok(out.includes('sizes='));assert.ok(out.includes('width='));assert.ok(out.includes('height='));
 assert.equal(apply('console/xbox360/index.html',out),out);
 assert.equal(apply('downloads/ready/index.html',html),html);
});
test('category compositions are self-contained and retain every source asset',()=>{
 for(const c of Object.values(read('docs/category-composite-covers.json').routes)){
  const svg=fs.readFileSync(path.join(root,'.'+c.path),'utf8');assert.ok(svg.startsWith('<svg'));assert.ok(!/href="https?:/.test(svg));
  for(const image of c.sourceImages)assert.ok(fs.existsSync(path.join(root,'.'+image)),image);
 }
});
test('San Andreas Myten previews use that game artwork and keep original previews in source details',()=>{
 const html=fs.readFileSync(path.join(root,'console/xbox360/mods/gta-san-andreas/index.html'),'utf8');
 for(const id of ['discord-xbox360-mw2-campaign-myten-v12','discord-xbox360-gta5-myten-1-3']){
  const card=html.match(new RegExp('<article[^>]*id="'+id+'"[\\s\\S]*?</article>'))[0];
  assert.ok(card.includes('data-menu-preview="artwork"'));assert.ok(card.includes('gta-san-andreas-official-v1'));
  assert.ok(card.includes('Nine games supported'));assert.ok(card.includes('Original multi-game preview'));assert.ok(card.includes('menu-description--complete'));
 }
});
test('stealth server discovery sits on the Xbox hub rather than the mods collection',()=>{
 assert.ok(fs.readFileSync(path.join(root,'console/xbox360/index.html'),'utf8').includes('<h3>Stealth Servers</h3>'));
 for(const file of ['console/xbox360/mods.html','console/xbox360/mods/index.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  assert.ok(!/<h3>Stealth servers<\/h3>/i.test(html));assert.ok(!/id="discord-xbox360-stealth-/.test(html));
 }
});
