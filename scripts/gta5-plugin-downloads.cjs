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
  const originalLinks=originals.map(r=>'<a href="'+esc(r.source.url)+'" download data-no-file-options>'+esc(originals.length===1?'Original menu file':r.label)+'</a>').join('');
  const standalone = item.mergedResourceIds?.length ? '' : originals.length===1 ? originalLinks : '<details><summary>Original menu files</summary><div class="gta-plugin-originals">'+originalLinks+'</div></details>';
  return '<fieldset class="gta-plugin-download" aria-label="Menu downloads" data-gta-plugin-download data-plugin-name="'+esc(item.id)+'" data-plugin-choices="'+esc(JSON.stringify(rows))+'">'+builds+'<button type="button" class="btn btn-primary" data-plugin-bundle disabled><i class="fas fa-download" aria-hidden="true"></i> Download menu + plugins.ini</button><div class="gta-plugin-separate"><button type="button" data-plugin-configs disabled>plugins.ini only</button>'+standalone+'</div><p data-plugin-status role="status" aria-live="polite"></p><noscript><p>Save the original menu and matching configuration:</p><ul>'+rows.map(r=>'<li>'+esc(r.label)+': <a href="'+esc(r.source.url)+'" download data-no-file-options>Original menu</a> · <a href="'+esc(r.configs.CUSA00411.url)+'" download="plugins.ini" data-no-file-options>EU plugins.ini</a> · <a href="'+esc(r.configs.CUSA00419.url)+'" download="plugins.ini" data-no-file-options>USA plugins.ini</a></li>').join('')+'</ul></noscript></fieldset>';

 }
 return {render,choices,has:id=>catalog.downloads.some(x=>x.downloadId===id)};
}
module.exports={createPluginDownloads};
