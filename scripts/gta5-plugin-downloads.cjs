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
  const grouped=new Map();for(const row of rows){if(!grouped.has(row.source.url))grouped.set(row.source.url,[]);grouped.get(row.source.url).push(row);}
  const originals=[...grouped.values()].map(group=>{const first=group[0],updates=[...new Set(group.map(row=>row.gameVersion).filter(Boolean))];return {...first,label:updates.length>1?first.label.replace(/ · GTA V 1\.\d{2}(?: \/ 1\.\d{2})*$/,'')+' · GTA V '+updates.join(' / '):first.label};});
  const first=originals[0],selectId='menu-version-'+item.id;
  const selector=originals.length>1?'<label class="gta-menu-version-label" for="'+esc(selectId)+'">Menu / game version</label><select id="'+esc(selectId)+'" class="gta-menu-version" data-menu-version disabled>'+originals.map(row=>'<option value="'+esc(row.source.url)+'" data-filename="'+esc(row.source.name)+'">'+esc(row.label)+'</option>').join('')+'</select>':'';
  const button='<a class="btn btn-primary" href="'+esc(first.source.url)+'" download="'+esc(first.source.name)+'" data-no-file-options data-menu-download aria-label="'+esc('Download '+item.name+' · '+first.label)+'"><i class="fas fa-download" aria-hidden="true"></i> Download</a>';
  return '<fieldset class="gta-plugin-download" aria-label="Menu downloads" data-menu-download-group data-menu-name="'+esc(item.name)+'">'+builds+'<div class="gta-plugin-originals">'+selector+button+'</div></fieldset>';

 }
 return {render,choices,has:id=>catalog.downloads.some(x=>x.downloadId===id)};
}
module.exports={createPluginDownloads};
