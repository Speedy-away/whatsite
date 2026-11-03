'use strict';
// Keep ready files in the local archive; publish version-pinned upstream links.
// This script never deletes, executes or changes a downloaded file.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),MIN_BYTES=10*1024*1024;
function category(item){
  const text=JSON.stringify([item.id,item.title,item.category,item.kind,item.pages]);
  if(/\bMods\b|game-mods|rom.hacks/i.test(JSON.stringify([item.category,item.pages])))return null;
  if(/^(?:IRISMAN|webMAN MOD|Apollo Save Tool|PS4 Cheats Manager|File Manager by Zarh|ARK-4)/i.test(item.title||''))return 'apps-homebrew';
  if(/\/mods(?:\/|\.html)|gta[ -]?[45]|rdr[12]?|red.dead|demonic|sprx|mod[ -]?menu|multicod|call.of.duty|black.ops|modern.warfare|eboot|patch_mp|modloader|trainer|cheat|karo|runtime|payload|sender|screenshot/i.test(text))return null;
  if(/game-download|games-download|homebrew.games|\/games\.html|\bGames\b/i.test(text))return 'games';
  if(/apps|homebrew|emulator|console-store|media|\bTools\b|\bEngines\b|Saves & system/i.test(text))return 'apps-homebrew';
  return null;
}
function pinnedSource(file){
  if(file.derivedFrom||file.role==='extracted-build')return null;
  for(const value of [file.sourceUrl,file.resolvedUrl,file.source]){
    try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||/\/(?:latest|nightly)(?:\/|$)/i.test(u.pathname))continue;
      if((u.hostname==='github.com'||u.hostname==='codeberg.org')&&/\/releases\/download\/[^/]+\/.+/.test(u.pathname))return u.href;
      if(u.hostname==='downloads.scummvm.org'&&/\/release\/\d/.test(u.pathname))return u.href;
      if(u.hostname==='downloads.scummvm.org'&&/\/frs\/scummvm\/\d[^/]*\//.test(u.pathname))return u.href;
      if(u.hostname==='www.ppsspp.org'&&/^\/files\/\d[\d_]+\//.test(u.pathname))return u.href;
      if(u.hostname==='pkg-zone.com'&&/^\/download\/ps4\/[A-Z0-9]+\/[\d.]+$/.test(u.pathname))return u.href;
    }catch{}
  }
  return null;
}
function deliverySource(file){
  const pinned=pinnedSource(file);if(pinned)return {url:pinned,sourceVersionPinned:true};
  for(const value of [file.sourceUrl,file.resolvedUrl])try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)continue;
    if(['switch.cdn.fortheusers.org','wiiu.cdn.fortheusers.org'].includes(u.hostname)&&/^\/zips\/[^/]+\.zip$/i.test(u.pathname)||u.hostname==='hbb1.oscwii.org'&&/^\/api\/contents\/[^/]+\/[^/]+\.zip$/i.test(u.pathname)||u.hostname==='github.com'&&/\/releases\/download\/nightly\//i.test(u.pathname))return {url:u.href,sourceVersionPinned:false};
  }catch{}
  return null;
}
function candidates(inventory,protectedFiles=new Set()){
  const result=new Map();
  const allFiles=(inventory.items||[]).flatMap(item=>item.files||[]);
  for(const item of inventory.items||[]){const kind=category(item);if(!kind)continue;
    for(const file of item.files||[]){if(!file.local?.startsWith('/downloads/')||file.bytes<MIN_BYTES||!/^[a-f0-9]{64}$/i.test(file.sha256||''))continue;
      if(!file.backupPath)continue;
      let local;try{local=decodeURIComponent(file.local);}catch{continue;}
      if(local.includes('..')||local.includes('\\'))continue;
      if(protectedFiles.has(local))continue;
      const rich=allFiles.find(f=>f.local===file.local&&(f.derivedFrom||/^extracted/.test(f.role||'')))||file;
      const parent=rich.derivedFrom?allFiles.find(f=>f.sha256===rich.derivedFrom.sha256&&f.backupPath):/\.(?:nro|wuhb|msix)$/i.test(file.name||'')&&/\.zip(?:$|[?#])/.test(file.sourceUrl||'')?allFiles.find(f=>f.backupPath&&f.sourceUrl===file.sourceUrl&&/\.zip$/i.test(f.name||'')&&!(f.derivedFrom||/^extracted/.test(f.role||''))):null;
      if((rich.derivedFrom||/^extracted/.test(rich.role||''))&&!parent)continue;
      const delivery=deliverySource(parent||file);if(!delivery)continue;
      const releaseTag=new URL(delivery.url).pathname.match(/\/releases\/download\/([^/]+)\//)?.[1];
      const version=file.version||file.releaseTag||item.release||(releaseTag?decodeURIComponent(releaseTag):undefined);
      const notes=[];if(parent)notes.push('Original ZIP; extract '+(file.name||file.filename));if(!delivery.sourceVersionPinned)notes.push('Upstream version may change; archived '+(version||'original build')+' kept locally');
      result.set(local,{local,...delivery,category:kind,title:item.title,name:file.name||file.filename,version,bytes:file.bytes,sha256:file.sha256,backupPath:file.backupPath,...(notes.length?{linkNote:notes.join('. ')}:{}),...(parent?{sourceBytes:parent.bytes,sourceSha256:parent.sha256,sourceBackupPath:parent.backupPath,requiresExtraction:true}:{})});
    }
  }
  return [...result.values()];
}
async function hash(file){const h=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))h.update(chunk);return h.digest('hex');}
async function main(){
  const protectedFiles=new Set();
  for(const name of fs.readdirSync(path.join(root,'docs')).filter(n=>/actions.*\.json$/.test(n))){const data=JSON.parse(fs.readFileSync(path.join(root,'docs',name),'utf8'));for(const action of data.actions||[])if(action.downloadURL?.startsWith('/downloads/'))protectedFiles.add(decodeURIComponent(action.downloadURL));}
  let rows=candidates(JSON.parse(fs.readFileSync(path.join(root,'docs/download-audit.json'),'utf8')),protectedFiles);
  const priorPolicy=path.join(root,'docs/download-source-links.json'),priorReport=path.join(root,'docs/qa/source-link-cleanup.json');
  const pending=process.argv.includes('--pending');
  if(pending&&fs.existsSync(priorPolicy)){const done=new Set(JSON.parse(fs.readFileSync(priorPolicy,'utf8')).entries.map(entry=>entry.local));rows=rows.filter(row=>!done.has(row.local));}
  const replacing=new Set(rows.map(row=>row.local));
  const results=pending&&fs.existsSync(priorReport)?JSON.parse(fs.readFileSync(priorReport,'utf8')).results.filter(row=>!replacing.has(row.local)):[];let next=0;
  async function worker(){while(next<rows.length){const row=rows[next++];try{
    const backupRoot=path.resolve('F:/whatsite-backup-downloads-etc'),relative=path.relative(backupRoot,path.resolve(row.backupPath));
    if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Archive path is outside its expected root');
    if(fs.statSync(row.backupPath).size!==row.bytes||await hash(row.backupPath)!==row.sha256)throw Error('Archive checksum mismatch');
    if(row.sourceBackupPath&&(fs.statSync(row.sourceBackupPath).size!==row.sourceBytes||await hash(row.sourceBackupPath)!==row.sourceSha256))throw Error('Original source archive checksum mismatch');
    const publicPath=path.join(root,row.local);if(fs.existsSync(publicPath)&&(fs.statSync(publicPath).size!==row.bytes||await hash(publicPath)!==row.sha256))throw Error('Working download checksum mismatch');
    const response=await fetch(row.url,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw Error('Upstream HTTP '+response.status);
    const length=Number(response.headers.get('content-length'));if(length&&length!==(row.sourceBytes||row.bytes)){if(row.sourceVersionPinned)throw Error('Upstream byte count changed: '+length);row.upstreamBytes=length;row.archivedBuildDiffersFromUpstream=true;row.linkNote+='; publisher download differs from the archived build';}
    results.push({...row,status:'verified',httpStatus:response.status});
  }catch(error){results.push({...row,status:'retained-mirror',reason:error.message});}}}
  await Promise.all(Array.from({length:4},worker));results.sort((a,b)=>a.local.localeCompare(b.local));
  const receiverFile=path.join(root,'docs/console-download-catalog.json'),receiverHashes=new Set(fs.existsSync(receiverFile)?JSON.parse(fs.readFileSync(receiverFile,'utf8')).items.map(item=>item.sha256):[]);
  for(const row of results)if(receiverHashes.has(row.sha256))row.retainRepositoryForLegacyReceiver=true;
  const existingFile=path.join(root,'docs/download-source-links.json'),previous=fs.existsSync(existingFile)?JSON.parse(fs.readFileSync(existingFile,'utf8')).entries:[];
  const merged=new Map(previous.map(entry=>[entry.local,entry]));
  for(const {backupPath,sourceBackupPath,status,httpStatus,...publicFields}of results.filter(r=>r.status==='verified'))merged.set(publicFields.local,publicFields);
  const entries=[...merged.values()].sort((a,b)=>a.local.localeCompare(b.local));
  const policy={schemaVersion:1,updated:new Date().toISOString(),minimumBytes:MIN_BYTES,delivery:'upstream-first; ready files and all older versions stay in the local archive',preserved:'Game mods, native host payloads, source archives, immutable helpers and extracted files without their own version-pinned asset URLs.',entries};
  fs.writeFileSync(path.join(root,'docs/download-source-links.json'),JSON.stringify(policy,null,2)+'\n');
  fs.writeFileSync(path.join(root,'docs/qa/source-link-cleanup.json'),JSON.stringify({checkedAt:policy.updated,candidates:results.length,converted:entries.length,bytes:entries.reduce((n,r)=>n+r.bytes,0),results},null,2)+'\n');
  console.log(JSON.stringify({candidates:results.length,converted:entries.length,GiB:entries.reduce((n,r)=>n+r.bytes,0)/1024**3,retained:results.filter(r=>r.status!=='verified').map(r=>({title:r.title,reason:r.reason}))}));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={MIN_BYTES,category,pinnedSource,deliverySource,candidates};
