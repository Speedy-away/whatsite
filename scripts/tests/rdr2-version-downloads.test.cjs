const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const decode=s=>s.replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&#39;',"'");
const page=()=>fs.readFileSync(path.join(root,'console/mods/ps4/rdr2/index.html'),'utf8');
test('Havana and Oyster retain all version choices with one Download button each',()=>{
 const html=page(),cards=[...html.matchAll(/<article class="guide-resource"[^>]*>[\s\S]*?<\/article>/g)].map(m=>m[0]);
 for(const [name,count] of [['Havana',3],['Oyster',6]]){
  const card=cards.find(c=>c.includes('<h3>'+name+'</h3>'));assert.ok(card);
  assert.equal((card.match(/<option /g)||[]).length,count);
  assert.equal((card.match(/data-menu-download aria-label=/g)||[]).length,1);
  assert.equal((card.match(/class="btn btn-primary"/g)||[]).length,1);
  if(name==='Havana'){assert.match(card,/1\.00 \(experimental\)/);assert.match(card,/EU: CUSA08519<br>USA: CUSA03041/);}
  else for(const version of ['1.00','1.13','1.19','1.24','1.29'])assert.ok(card.includes('RDR2 '+version));
 }
 assert.ok(html.includes('/assets/gta5-menu-downloads.js?v=1'));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 assert.doesNotMatch(cards.find(c=>c.includes('<h3>ACE-HIGH</h3>')),/>Project </);
});
test('Oyster individual builds match both extracted originals and the verified local archive',()=>{
 const report=read('docs/qa/oyster-version-downloads.json'),inventory=read('docs/ps4-oyster-versions-private-inventory.json');
 assert.equal(report.files.length,5);
 for(const file of report.files){const saved=inventory.items.flatMap(i=>i.files).find(f=>f.downloadId===file.downloadId);assert.ok(saved);
  for(const name of [path.join(root,'.'+file.local),saved.backupPath]){const bytes=fs.readFileSync(name);assert.equal(bytes.length,file.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),file.sha256);assert.equal(bytes.readUInt32LE(0),0x1d3d154f);}
  assert.equal(saved.derivedFrom,report.archiveSha256);assert.equal(saved.sourceUrl,report.sourceUrl);
 }
 const item=read('docs/ps4-ps5-game-resources.json').resources.find(r=>r.id==='rdr2-oyster');assert.equal(item.downloads[0].url,report.sourceUrl);
});
test('All RDR2 version choices update the exact download URL after Pages rewriting',()=>{
 const {rewriter,rawURL}=require('../build-pages.cjs'),offloaded=new Map();
 for(const [,url] of page().matchAll(/(?:value|href)="(\/downloads\/[^\"]+)"/g)){const name=decode(url).slice(1);offloaded.set(name,rawURL(name,'b'.repeat(40)));}
 const html=rewriter(offloaded)(page(),'console/mods/ps4/rdr2/index.html');
 const groups=[...html.matchAll(/<fieldset class="gta-plugin-download"[\s\S]*?<\/fieldset>/g)].map(([widget])=>{
  const options=[...widget.matchAll(/<option value="([^"]+)" data-filename="([^"]+)">([^<]+)<\/option>/g)].map(([,value,filename,label])=>({value:decode(value),dataset:{filename:decode(filename)},textContent:decode(label)}));
  const select={options,selectedIndex:0,addEventListener(event,fn){this.change=fn;}},link={setAttribute(key,value){this[key]=value;}};
  return {dataset:{menuName:decode(widget.match(/data-menu-name="([^"]+)"/)[1])},select,link,querySelector(s){return s==='[data-menu-version]'?select:link;}};
 });
 assert.equal(groups.length,2);require('../../assets/gta5-menu-downloads.js').install({querySelectorAll(){return groups;}});
 for(const group of groups)for(let i=0;i<group.select.options.length;i++){group.select.selectedIndex=i;group.select.change();const option=group.select.options[i];assert.equal(group.link.href,option.value);assert.equal(group.link.download,option.dataset.filename);assert.equal(group.link['aria-label'],'Download '+group.dataset.menuName+' · '+option.textContent);}
});
