const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),api=require('../../assets/gta5-plugin-downloads.js');
test('Every rendered GTA V build prepares a verified ZIP for both displayed regions',async()=>{
 const html=fs.readFileSync(path.join(root,'console/mods/ps4/gta5/index.html'),'utf8');
 const widgets=[...html.matchAll(/<fieldset class="gta-plugin-download"[\s\S]*?<\/noscript><\/fieldset>/g)];assert.equal(widgets.length,22);
 const cache=new Map(),env={crypto:crypto.webcrypto,fetch:async url=>{if(!cache.has(url))cache.set(url,fs.readFileSync(path.join(root,'.'+url)));return new Response(cache.get(url));}};
 let count=0;for(const [widget] of widgets){
  assert.ok(!widget.includes('<select'));assert.ok(!widget.includes('data-plugin-region-note'));assert.ok(!widget.includes('data-plugin-module'));
  const rows=JSON.parse(widget.match(/data-plugin-choices="([^"]+)"/)[1].replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&#39;/g,"'"));
  for(const row of rows)for(const region of ['CUSA00411','CUSA00419']){const bytes=await api.bundle(row,region,env);assert.equal(new DataView(bytes.buffer).getUint32(0,true),0x04034b50);count++;}
 }assert.equal(count,122);
 const cards=[...html.matchAll(/<article class="guide-resource" id="resource-([^"]+)"[\s\S]*?<\/article>/g)];
 for(const [card,id] of cards.filter(([,id])=>!id.startsWith('gta5-reborn-'))){assert.ok(!card.includes('Guide &amp; requirements'),id);assert.ok(!card.includes('Source lists GTA V'),id);}
 const lts=cards.find(([,id])=>id==='gta5-lts-1-57')[0];assert.equal((lts.match(/class="btn btn-primary"/g)||[]).length,1);
 const files=require('../../downloads/ps4-ps5/manifest.json').files;for(const id of ['gta5-explosive-1-52-1-53-design-ini','gta5-explosive-1-52-1-53-selfoptions-ini','gta5-beach-legacy-install-icon']){const file=files.find(f=>f.downloadId===id);assert.ok(html.includes(file.local||file.source),id);}
});
