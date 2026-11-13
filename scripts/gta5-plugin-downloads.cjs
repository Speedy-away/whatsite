const fs=require('node:fs'),path=require('node:path');
const {esc}=require('./build-console-guides.cjs');
const root=path.resolve(__dirname,'..');
function createPluginDownloads(){
 const file=path.join(root,'downloads/ps4/GTA5/plugin-configs/manifest.json');
 const catalog=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{downloads:[]};
 function choices(item,downloads,legacy){
  if(!item?.gameIds?.includes('gta5'))return [];
  const selected=downloads||item.downloads||[];
  const ids=new Set(selected.map(f=>f.id));
  const resourceIds=new Set([item.id,...(item.mergedResourceIds||[])]);
  return catalog.downloads.filter(f=>resourceIds.has(f.resourceId)&&(legacy?(f.sha256===legacy.sha256||f.url===legacy.local||f.aliases.includes(legacy.local)):ids.has(f.downloadId))).flatMap(f=>f.variants.map(v=>({
   ...v,key:f.downloadId+'-'+v.key,label:item.mergedResourceIds?.length&&selected.find(d=>d.id===f.downloadId)?.label||((f.variants.length>1?f.label.replace(/ · GTA V 1\.\d{2}(?: \/ 1\.\d{2})*/g,''):f.label)+(v.gameVersion&&(f.variants.length>1||!f.label.includes(v.gameVersion))?' · GTA V '+v.gameVersion:'')),source:{url:f.url,name:f.name,bytes:f.bytes,sha256:f.sha256,kind:f.kind}
  })));
 }
 function render(item,downloads,legacy){
  const rows=choices(item,downloads,legacy);if(!rows.length)return '';
  // Keep the default aligned with a compatibility-specific legacy section.
  if(/^\d{3}$/.test(legacy?.group||'')){const update='1.'+legacy.group.slice(1);rows.sort((a,b)=>Number(b.gameVersion===update)-Number(a.gameVersion===update));}
  const versions=[...new Set(rows.map(r=>r.gameVersion).filter(Boolean))];
  const builds='<dl class="gta-plugin-facts"><dt>Game update / package</dt><dd>'+esc(versions.length?'GTA V '+versions.join(' / '):'Game update unspecified')+'</dd><dt>Game region</dt><dd>Europe / EU · CUSA00411<br>USA · CUSA00419</dd></dl>';
  const originals=[...new Map(rows.map(r=>[r.source.url,r])).values()];
  const originalLinks=originals.map(r=>'<a class="btn btn-primary" href="'+esc(r.source.url)+'" download data-no-file-options><i class="fas fa-download" aria-hidden="true"></i> '+esc('Download'+(originals.length>1?' · '+r.label:''))+'</a>').join('');
  return '<fieldset class="gta-plugin-download" aria-label="Menu downloads">'+builds+'<div class="gta-plugin-originals">'+originalLinks+'</div></fieldset>';

 }
 return {render,choices,has:id=>catalog.downloads.some(x=>x.downloadId===id)};
}
module.exports={createPluginDownloads};
