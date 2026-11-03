'use strict';
// Keep ready files in the local archive; publish version-pinned upstream links.
// This script never deletes, executes or changes a downloaded file.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),MIN_BYTES=10*1024*1024;
function category(item){
  const text=JSON.stringify([item.id,item.title,item.category,item.kind,item.pages]);
  if(/\/mods(?:\/|\.html)|gta[ -]?[45]|rdr[12]?|red.dead|demonic|sprx|mod[ -]?menu|multicod|call.of.duty|black.ops|modern.warfare|eboot|patch_mp|modloader|trainer|cheat|karo|runtime|payload|sender|screenshot/i.test(text))return null;
  if(/game-download|games-download|homebrew.games|\/games\.html|\bGames\b/i.test(text))return 'games';
  if(/apps|homebrew|emulator|console-store|media/i.test(text))return 'apps-homebrew';
  return null;
}
function pinnedSource(file){
  if(file.derivedFrom||file.role==='extracted-build')return null;
  for(const value of [file.sourceUrl,file.resolvedUrl,file.source]){
    try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||/\/(?:latest|nightly)(?:\/|$)/i.test(u.pathname))continue;
      if((u.hostname==='github.com'||u.hostname==='codeberg.org')&&/\/releases\/download\/[^/]+\/.+/.test(u.pathname))return u.href;
      if(u.hostname==='downloads.scummvm.org'&&/\/release\/\d/.test(u.pathname))return u.href;
    }catch{}
  }
  return null;
}
function candidates(inventory,protectedFiles=new Set()){
  const result=new Map();
  for(const item of inventory.items||[]){const kind=category(item);if(!kind)continue;
    for(const file of item.files||[]){if(!file.local?.startsWith('/downloads/')||file.bytes<MIN_BYTES||!/^[a-f0-9]{64}$/i.test(file.sha256||''))continue;
      const url=pinnedSource(file);if(!url||!file.backupPath)continue;
      let local;try{local=decodeURIComponent(file.local);}catch{continue;}
      if(local.includes('..')||local.includes('\\'))continue;
      if(protectedFiles.has(local))continue;
      result.set(local,{local,url,category:kind,title:item.title,name:file.name||file.filename,version:file.version||file.releaseTag||item.release,bytes:file.bytes,sha256:file.sha256,backupPath:file.backupPath});
    }
  }
  return [...result.values()];
}
async function hash(file){const h=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))h.update(chunk);return h.digest('hex');}
async function main(){
  const protectedFiles=new Set();
  for(const name of fs.readdirSync(path.join(root,'docs')).filter(n=>/actions.*\.json$/.test(n))){const data=JSON.parse(fs.readFileSync(path.join(root,'docs',name),'utf8'));for(const action of data.actions||[])if(action.downloadURL?.startsWith('/downloads/'))protectedFiles.add(decodeURIComponent(action.downloadURL));}
  const rows=candidates(JSON.parse(fs.readFileSync(path.join(root,'docs/download-audit.json'),'utf8')),protectedFiles);
  const results=[];let next=0;
  async function worker(){while(next<rows.length){const row=rows[next++];try{
    const backupRoot=path.resolve('F:/whatsite-backup-downloads-etc'),relative=path.relative(backupRoot,path.resolve(row.backupPath));
    if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Archive path is outside its expected root');
    if(fs.statSync(row.backupPath).size!==row.bytes||await hash(row.backupPath)!==row.sha256)throw Error('Archive checksum mismatch');
    const publicPath=path.join(root,row.local);if(fs.existsSync(publicPath)&&(fs.statSync(publicPath).size!==row.bytes||await hash(publicPath)!==row.sha256))throw Error('Working download checksum mismatch');
    const response=await fetch(row.url,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw Error('Upstream HTTP '+response.status);
    const length=Number(response.headers.get('content-length'));if(length&&length!==row.bytes)throw Error('Upstream byte count changed: '+length);
    results.push({...row,status:'verified',httpStatus:response.status});
  }catch(error){results.push({...row,status:'retained-mirror',reason:error.message});}}}
  await Promise.all(Array.from({length:4},worker));results.sort((a,b)=>a.local.localeCompare(b.local));
  const receiverFile=path.join(root,'docs/console-download-catalog.json'),receiverHashes=new Set(fs.existsSync(receiverFile)?JSON.parse(fs.readFileSync(receiverFile,'utf8')).items.map(item=>item.sha256):[]);
  for(const row of results)if(receiverHashes.has(row.sha256))row.retainRepositoryForLegacyReceiver=true;
  const entries=results.filter(r=>r.status==='verified').map(({backupPath,status,httpStatus,...publicFields})=>publicFields);
  const policy={schemaVersion:1,updated:new Date().toISOString(),minimumBytes:MIN_BYTES,delivery:'upstream-first; ready files and all older versions stay in the local archive',preserved:'Game mods, native host payloads, source archives, immutable helpers and extracted files without their own version-pinned asset URLs.',entries};
  fs.writeFileSync(path.join(root,'docs/download-source-links.json'),JSON.stringify(policy,null,2)+'\n');
  fs.writeFileSync(path.join(root,'docs/qa/source-link-cleanup.json'),JSON.stringify({checkedAt:policy.updated,candidates:results.length,converted:entries.length,bytes:entries.reduce((n,r)=>n+r.bytes,0),results},null,2)+'\n');
  console.log(JSON.stringify({candidates:results.length,converted:entries.length,GiB:entries.reduce((n,r)=>n+r.bytes,0)/1024**3,retained:results.filter(r=>r.status!=='verified').map(r=>({title:r.title,reason:r.reason}))}));
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={MIN_BYTES,category,pinnedSource,candidates};
