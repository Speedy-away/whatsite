// Record source failures truthfully; preserve every existing archive version.
const fs=require('node:fs'),path=require('node:path');
const {createArchive,hashFile}=require('./console-expansion-archive.cjs');
async function main(){
 const root=path.resolve(__dirname,'..'),archive=createArchive(),scope='free-shops';
 const acquisition=JSON.parse(fs.readFileSync(path.join(root,'docs/free-shops-acquisition.json')));
 const items=[];
 for(const source of acquisition.items){
  const item={...source,platform:source.id==='free-shops-nova'?'PS4 / PS5 (unconfirmed)':'PS4',files:source.files||[]};
  for(const file of item.files){await archive.archiveFile({scope,item:{...item,files:[]},file:{...file,expectedBytes:file.bytes,expectedSha256:file.sha256},sourceFile:file.stagingPath});}
  if(!item.files.length)items.push({...item,attempts:[{at:acquisition.checkedAt,status:'unavailable',error:source.error}],reason:'Original Google Drive URL retained. File bytes, size and SHA-256 unavailable because Google reports a download quota limit.'});
 }
 await archive.appendInventory({scope,items});
 const merge=await archive.mergeInventory({inventory:archive.inventoryPath(scope)});
 const audit=JSON.parse(fs.readFileSync(path.join(root,'docs/download-audit.json')));
 const orbit=audit.items.find(i=>i.title==='Orbit Store 1.8.1'&&(i.files||[]).some(f=>f.name==='orbit_store.elf'));
 const file=orbit.files.find(f=>f.name==='orbit_store.elf'),actual=await hashFile(file.backupPath);
 if(actual.bytes!==file.bytes||actual.sha256!==file.sha256)throw Error('Orbit archive verification failed');
 fs.writeFileSync(path.join(root,'docs/qa/free-shops-archive.json'),JSON.stringify({checkedAt:new Date().toISOString(),merge,unavailable:items.map(i=>({id:i.id,url:i.url,error:i.error})),orbit:{version:'1.8.1',...actual,backupPath:file.backupPath,verified:true},payloadsExecuted:false},null,2)+'\n');
 console.log(JSON.stringify({recordedUnavailable:items.length,orbitVerified:true,merge}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
