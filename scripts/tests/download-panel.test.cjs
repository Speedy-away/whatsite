'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {createPanel,publicUrl,validate}=require('../download-panel.cjs');
const data=require('../download-panel-data.cjs');
const {eligible}=require('../build-pages.cjs');
const PAGE='console/mods/ps4/example/index.html';
const HTML='<!doctype html><html><head><title>Example menus | whatwhatboy</title></head><body><main><h1>Existing</h1><a href="/old.zip">Old download</a><footer>Footer</footer></main></body></html>';
async function fixture(t) {
  const root=await fsp.mkdtemp(path.join(os.tmpdir(),'whatsite-panel-'));
  t.after(()=>fsp.rm(root,{recursive:true,force:true}));
  const backupRoot=path.join(root,'archive');
  await fsp.mkdir(path.join(root,path.dirname(PAGE)),{recursive:true});await fsp.mkdir(path.join(root,'docs'));await fsp.mkdir(backupRoot);
  await fsp.writeFile(path.join(root,PAGE),HTML);await fsp.writeFile(path.join(root,data.MANIFEST),JSON.stringify({schemaVersion:1,entries:[]}));
  const source=path.join(root,'menu.zip');await fsp.writeFile(source,Buffer.from('a ready-to-use fixture; never executed'));
  const image=path.join(root,'image.png');await fsp.writeFile(image,Buffer.from('89504e470d0a1a0a00000000','hex'));
  const panel=createPanel({root,backupRoot});
  const input={page:PAGE,type:'menu',title:'Example <menu>',description:'Details & <script>alert(1)</script>',version:'v1.4',gameVersion:'1.57',firmware:'9.00',region:'CUSA00001',sourceUrl:'https://example.com/v1.4/menu.zip',downloadPath:source,imagePath:image,mirror:true};
  return {root,backupRoot,source,image,panel,input};
}
test('discovery groups destinations and excludes redirects / host pages',async t=>{
  const {root}=await fixture(t);
  await fsp.mkdir(path.join(root,'games/example'),{recursive:true});await fsp.writeFile(path.join(root,'games/example/index.html'),HTML);
  await fsp.writeFile(path.join(root,'console/host.html'),HTML);
  await fsp.writeFile(path.join(root,'console/old.html'),'<meta http-equiv="refresh" content="0;url=elsewhere"><main></main>');
  const pages=data.listPages(root);assert.equal(pages.length,2);assert.equal(pages.find(row=>row.file===PAGE).group,'PS4');assert.equal(pages.find(row=>row.file.startsWith('games/')).group,'Free cheats');
});
test('validation preserves version pins, restricts PS3 variants and upstream delivery',()=>{
  assert.throws(()=>publicUrl('https://github.com/example/menu/releases/latest/download/menu.zip'),/version-specific/);
  assert.throws(()=>publicUrl('javascript:alert(1)'),/HTTPS/);
  const base={page:PAGE,type:'menu',title:'Title',description:'Description',version:'v1.0',sourceUrl:'https://example.com/v1.0/menu.zip'};
  assert.throws(()=>validate({...base,variant:'DEX'},[{file:PAGE,group:'PS4'}]),/PS3/);
  assert.equal(validate({...base,variant:'HEN'},[{file:PAGE,group:'PS3'}]).variant,'HEN');
  assert.throws(()=>validate({...base,type:'app',mirror:true},[{file:PAGE,group:'PS4'}]),/upstream/);
});
test('save copies files, archives metadata, preserves older builds and survives regeneration',async t=>{
  const {root,backupRoot,source,image,panel,input}=await fixture(t);
  const first=await panel.save(input);assert.deepEqual(first.warnings,[]);
  assert.equal(fs.existsSync(source),true);assert.equal(fs.existsSync(image),true);
  const card=first.entry;assert.equal(card.file.version,'v1.4');assert.equal(card.file.sha256.length,64);assert.equal(card.file.sourceUrl,input.sourceUrl);
  assert.equal(fs.readFileSync(path.join(root,decodeURIComponent(card.downloadUrl)),'utf8'),fs.readFileSync(source,'utf8'));
  assert.ok(fs.existsSync(path.join(root,card.image)));assert.ok(fs.existsSync(path.join(backupRoot,'index.html')));
  let html=fs.readFileSync(path.join(root,PAGE),'utf8');assert.ok(html.includes('/old.zip'));assert.ok(html.includes('Example &lt;menu&gt;'));assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(html.indexOf('download-panel:start')<html.indexOf('<footer>'));
  const reapplied=data.apply(PAGE,html,data.readEntries(root));assert.equal(reapplied,html);
  assert.equal(data.apply(PAGE,HTML,data.readEntries(root)),html);
  await fsp.writeFile(source,'a different newer build');const second=await panel.save({...input,version:'v1.5',imagePath:'',mirror:false});
  assert.equal(second.entry.downloadUrl,input.sourceUrl);assert.equal(data.readEntries(root).length,2);
  const inventory=JSON.parse(fs.readFileSync(path.join(backupRoot,'download-inventory.json'),'utf8'));
  const files=inventory.items.flatMap(item=>item.files);assert.equal(files.length,2);assert.ok(files.every(file=>fs.existsSync(file.backupPath)));assert.notEqual(files[0].sha256,files[1].sha256);
  assert.equal(files[0].version,'v1.4');assert.equal(files[1].version,'v1.5');
  await assert.rejects(()=>panel.save({...input,version:'v1.5'}),/already on that page/);
  assert.equal(data.readEntries(root).length,2);
  await fsp.writeFile(path.join(root,PAGE),HTML);data.sync(root);html=fs.readFileSync(path.join(root,PAGE),'utf8');assert.ok(html.includes(first.entry.id));assert.ok(html.includes(second.entry.id));
});
test('unavailable archive or invalid image leaves site entries unchanged',async t=>{
  const {root,backupRoot,panel,input}=await fixture(t);
  const invalid=path.join(root,'bad.png');await fsp.writeFile(invalid,'<script>not an image</script>');
  await assert.rejects(()=>panel.save({...input,imagePath:invalid}),/PNG/);
  const disconnected=createPanel({root,backupRoot:backupRoot+'-missing'});await assert.rejects(()=>disconnected.save(input),/archive is unavailable/);
  assert.equal(data.readEntries(root).length,0);assert.equal(fs.readFileSync(path.join(root,PAGE),'utf8'),HTML);
});
test('HTTP API protects local paths and saves browser uploads with original filenames',async t=>{
  const {panel,root,input}=await fixture(t);const base=await panel.listen();t.after(()=>new Promise(resolve=>panel.server.close(resolve)));
  const headers={'X-Panel-Token':panel.token};
  assert.equal((await fetch(base+'/')).status,200);
  assert.equal((await fetch(base+'/api/catalog')).status,403);
  assert.equal((await fetch(base+'/api/catalog',{headers:{...headers,Origin:'https://evil.example'}})).status,403);
  assert.equal(await new Promise((resolve,reject)=>{require('node:http').get(base+'/api/catalog',{headers:{...headers,Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);}).on('error',reject);}),403);
  assert.equal((await fetch(base+'/api/catalog',{headers})).status,200);
  const upload=await fetch(base+'/api/upload?kind=download',{method:'POST',headers:{...headers,'X-File-Name':'Original%20Menu.prx'},body:'a fixture plugin'});
  assert.equal(upload.status,200);const uploaded=await upload.json();
  const saved=await fetch(base+'/api/entries',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({...input,downloadPath:'',downloadUpload:uploaded.id})});
  assert.equal(saved.status,200);const result=await saved.json();assert.equal(result.entry.file.name,'Original Menu.prx');
  assert.ok((await (await fetch(base+result.pageUrl)).text()).includes(result.entry.id));
  assert.equal((await fetch(base+'/site/docs/download-panel-entries.json')).status,404);
  assert.ok(fs.existsSync(path.join(root,result.entry.image)));
});
test('panel launcher and tool sources stay out of the public build',()=>{
  assert.equal(eligible('Add-Downloads.bat'),false);assert.equal(eligible('scripts/download-panel.cjs'),false);assert.equal(eligible('scripts/download-panel/index.html'),false);assert.equal(eligible('assets/download-panel-cards.css'),true);
});
