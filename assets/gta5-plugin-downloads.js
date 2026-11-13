(function(global,factory){
 'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 if(global?.document){const start=()=>api.install(global.document,global);if(global.document.readyState==='loading')global.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof window==='object'?window:null,function(){
 'use strict';
 const encode=s=>new TextEncoder().encode(s);
 function safeName(value){const name=String(value).replace(/[\x00-\x1f<>:"/\\|?*]/g,'_').replace(/[. ]+$/,'');if(!name||name==='.'||name==='..')throw Error('Invalid filename');return name;}
 function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
 function zip(entries){
  if(!entries.length||entries.length>65535)throw Error('Invalid ZIP entry count');
  const parts=[],central=[];let offset=0;
  for(const entry of entries){
   if(!entry.name||entry.name.startsWith('/')||entry.name.includes('\\')||entry.name.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Unsafe ZIP path');
   const name=encode(entry.name),bytes=entry.bytes instanceof Uint8Array?entry.bytes:new Uint8Array(entry.bytes);
   if(bytes.length>0xffffffff||offset>0xffffffff||name.length>65535)throw Error('ZIP limit exceeded');
   const local=new Uint8Array(30),l=new DataView(local.buffer),record=new Uint8Array(46),c=new DataView(record.buffer),crc=crc32(bytes);
   l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,33,true);l.setUint32(14,crc,true);l.setUint32(18,bytes.length,true);l.setUint32(22,bytes.length,true);l.setUint16(26,name.length,true);
   c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,bytes.length,true);c.setUint32(24,bytes.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);
   parts.push(local,name,bytes);central.push(record,name);offset+=local.length+name.length+bytes.length;
  }
  const directoryLength=central.reduce((n,b)=>n+b.length,0),end=new Uint8Array(22),e=new DataView(end.buffer);
  e.setUint32(0,0x06054b50,true);e.setUint16(8,entries.length,true);e.setUint16(10,entries.length,true);e.setUint32(12,directoryLength,true);e.setUint32(16,offset,true);
  const all=[...parts,...central,end],out=new Uint8Array(all.reduce((n,b)=>n+b.length,0));let cursor=0;for(const b of all){out.set(b,cursor);cursor+=b.length;}return out;
 }
 function localAsset(url){
  const pinned=/^https:\/\/raw\.githubusercontent\.com\/Speedy-away\/whatsite\/[a-f0-9]{40}\/downloads\//i;
  if(typeof url!=='string'||(!url.startsWith('/downloads/')&&!pinned.test(url))||/[?#\\]/.test(url))throw Error('Invalid local download');
  let parts;try{parts=url.split('/').map(decodeURIComponent);}catch{throw Error('Invalid local download');}
  if(parts.some(p=>p==='.'||p==='..'||/[\\/?#]/.test(p)))throw Error('Invalid local download');
  return url;
 }
 async function fetchVerified(file,env){
  const response=await env.fetch(localAsset(file.url),{credentials:'same-origin'});if(!response.ok)throw Error('File unavailable ('+response.status+').');
  const bytes=new Uint8Array(await response.arrayBuffer());if(file.bytes!=null&&bytes.length!==file.bytes)throw Error('Download size differs.');
  if(!env.crypto?.subtle)throw Error('Use HTTPS or localhost for combined downloads, or use a menu-only download.');
  const digest=Array.from(new Uint8Array(await env.crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  if(digest!==file.sha256)throw Error('Download verification failed.');return bytes;
 }
 async function bundleEntries(choice,region,env,configsOnly=false){
  if(!['CUSA00411','CUSA00419'].includes(region)||!choice.configs[region])throw Error('Select a game region.');
  const config=choice.configs[region],source=choice.source;
  const dependencies=choice.dependencies||[];
  if(dependencies.some(d=>d.gameVersion!==choice.gameVersion||d.installPath!=='data/GoldHEN/plugins/'+safeName(d.name)))throw Error('Dependency does not match the chosen game update.');
  const [menu,ini,...extraFiles]=await Promise.all([configsOnly?null:fetchVerified(source,env),fetchVerified(config,env),...dependencies.map(d=>configsOnly?null:fetchVerified(d,env))]);
  const member=source.kind==='plugin'?'data/GoldHEN/plugins/'+safeName(config.module):'menu/'+safeName(source.name);
  const note='PS4 GTA V menu + plugins.ini\r\n\r\nSelected title ID: '+region+'\r\nSelected module: '+config.module+'\r\nGame update: '+(choice.gameVersion||'not specified by source')+'\r\n'+(config.sourceExample?'A source title-ID example exists; physical console behavior is untested.':'This is a configuration template. The source does not confirm this regional menu build.')+'\r\n\r\n'+(source.kind==='package'?'The original menu archive is inside menu/. Extract it and follow its included setup guide; retain its required data folders. Use the selected module named above. The original archive and any original INI inside it are unchanged.\r\n':'Copy the included data/GoldHEN/plugins/ module to the corresponding PS4 directory. Standalone modules omit support data; follow the menu guide.\r\n')+'Merge the root plugins.ini section into /data/GoldHEN/plugins.ini. Back up your configuration and preserve unrelated entries. Do not replace a populated plugins.ini without merging it. Enable one menu at a time.\r\n\r\nThe title-ID switch changes configuration; it does not convert the binary or game update.\r\n';
  const requiredNote=(dependencies.length||/^GTARBN\.sprx$/i.test(config.module))?'\r\nREQUIRED GTA REBORN CLIENT\r\nUse the GTARBN.sprx for GTA V '+choice.gameVersion+'. If using the original ZIP, select its matching game-update folder. Keep the required client path in the generated plugins.ini alongside Ozark when applicable. Register yourself in the GTA Reborn Discord bot with /link username:YOUR_GAMERTAG and copy the private Reborn.txt to /data/Reborn.txt. That personal file is not included. The supplied live-server announcement is for 1.57 only; 1.56 server access is not established.\r\n':'';
  return [...(configsOnly?[]:[{name:member,bytes:menu},...dependencies.map((d,i)=>({name:d.installPath,bytes:extraFiles[i]}))]),{name:'plugins.ini',bytes:ini},{name:'INSTALL.txt',bytes:encode(note+requiredNote)}];
 }
 async function bundle(choice,region,env){return zip(await bundleEntries(choice,region,env));}
 async function bundleAll(rows,env,configsOnly=false){
  if(!Array.isArray(rows)||!rows.length)throw Error('No menu builds available.');
  const entries=new Map(),cache=new Map();
  const cachedEnv={crypto:env.crypto,fetch:env.fetch.bind(env)};
  const verifiedEnv={crypto:env.crypto,fetch:async(url,options)=>{
   if(!cache.has(url))cache.set(url,cachedEnv.fetch(url,options).then(async response=>{if(!response.ok)throw Error('File unavailable ('+response.status+').');return new Uint8Array(await response.arrayBuffer());}));
   const bytes=await cache.get(url);return {ok:true,arrayBuffer:async()=>bytes};
  }};
  const folders=[];
  for(let i=0;i<rows.length;i++){
   const row=rows[i],prefix=rows.length>1?'builds/'+String(i+1).padStart(2,'0')+'-GTA-V-'+safeName(row.gameVersion||'unspecified')+'/':'';
   folders.push(prefix+' — '+row.label);
   for(const region of ['CUSA00411','CUSA00419']){
    for(const entry of await bundleEntries(row,region,verifiedEnv,configsOnly)){
     const regional=['plugins.ini','INSTALL.txt'].includes(entry.name);
     const name=prefix+(regional?'regions/'+region+'/':'')+entry.name;
     const bytes=entry.name==='INSTALL.txt'?encode(new TextDecoder().decode(entry.bytes).replace('Merge the root plugins.ini section','Merge the plugins.ini section from this region folder').replace('The title-ID switch changes configuration','The regional configuration changes title-ID sections')):entry.bytes;
     const old=entries.get(name);if(old&&(old.length!==bytes.length||old.some((byte,index)=>byte!==bytes[index])))throw Error('Conflicting files in menu bundle.');
     if(!old)entries.set(name,bytes);
    }
   }
  }
  const readme='PS4 GTA V menu files and regional configurations\r\n\r\n'+(rows.length>1?'Build folders keep each game update and package separate. Use only the build matching your installed game update.\r\n':'')+'Use regions/CUSA00411/plugins.ini for Europe or regions/CUSA00419/plugins.ini for USA inside the matching build folder. Read that folder’s INSTALL.txt before installing. Regional templates do not establish binary compatibility. Back up and merge your existing plugins.ini; enable one menu at a time.\r\n'+(configsOnly?'This ZIP contains configurations and instructions only. Download the original menu files separately.\r\n':'Original menu archives remain unchanged inside menu/. Extract their required support files using the original instructions.\r\n')+'\r\n'+folders.join('\r\n')+'\r\n';
  entries.set('READ-ME.txt',encode(readme));
  return zip([...entries].map(([name,bytes])=>({name,bytes})));
 }
 function install(doc,env){
  const widgets=[];
  for(const node of doc.querySelectorAll('[data-gta-plugin-download]')){
   if(node.dataset.pluginReady)continue;
   let rows;try{rows=JSON.parse(node.dataset.pluginChoices);if(!rows.length)continue;}catch{continue;}
   const button=node.querySelector('[data-plugin-bundle]'),status=node.querySelector('[data-plugin-status]');
   if(!button||!status)continue;
   button.addEventListener('click',async()=>{
    button.disabled=true;status.textContent='Preparing download…';
    try{
     const bytes=await bundleAll(rows,env),url=env.URL.createObjectURL(new env.Blob([bytes],{type:'application/zip'})),anchor=doc.createElement('a');
     anchor.href=url;anchor.download=safeName(node.dataset.pluginName+'-menu-and-plugins.zip');anchor.setAttribute('data-no-file-options','');anchor.hidden=true;doc.body.appendChild(anchor);anchor.click();anchor.remove();env.setTimeout(()=>env.URL.revokeObjectURL(url),60000);
     status.textContent='ZIP ready: all listed builds with EU and USA configurations included.';
    }catch(error){status.textContent='Could not prepare ZIP: '+error.message+' Menu-only downloads remain available below.';}finally{button.disabled=false;}
   });
   widgets.push(node);node.dataset.pluginReady='true';button.disabled=false;
  }
  return widgets;
 }
 return {zip,crc32,safeName,bundle,bundleAll,fetchVerified,install};
});
