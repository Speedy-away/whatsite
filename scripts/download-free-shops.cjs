// Fetch only the two user-supplied store archives; never execute their contents.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const inputs = [
  {id:'infinitykkj', drive:'1UnS-7mR9QSObVWgHRXkjfGrWixJQ4-NW', name:'InfinitykkjSTORE-Beta-v0.0.11.zip', title:'Infinitykkj STORE', platform:'PS4', version:'v0.0.11 Beta'},
  {id:'nova', drive:'1gZoNjmH6uOvQ4uvbfzeah27EWWTGVIaf', name:'Nova Store.zip', title:'Nova Store', platform:'PS4', version:'User-supplied snapshot 2026-11-04 (version unconfirmed)'}
];
async function main(){
 const items=[];
 fs.mkdirSync(path.join(root,'tmp/free-shops'),{recursive:true});
 for(const input of inputs){
  const item={...input,id:'free-shops-'+input.id,project:input.title,category:['Apps','Free Shops'],url:`https://drive.google.com/file/d/${input.drive}/view`,pages:['console/ps4/free-shops.html','console/ps5/free-shops.html','console/free-shops/index.html'],files:[]};
  try{
   const response=await fetch(`https://drive.usercontent.google.com/download?id=${input.drive}&export=download&confirm=t`,{signal:AbortSignal.timeout(180000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   const bytes=Buffer.from(await response.arrayBuffer());
   if(bytes.length<4||bytes.readUInt32LE(0)!==0x04034b50){
    const html=bytes.toString('utf8');
    throw Error(html.match(/<title>(.*?)<\/title>/)?.[1]||'Source did not return a ZIP archive: '+response.headers.get('content-type'));
   }
   const local=path.join(root,'tmp/free-shops',input.name);
   const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
   if(fs.existsSync(local)&&crypto.createHash('sha256').update(fs.readFileSync(local)).digest('hex')!==sha256)throw Error('Different existing local file retained');
   if(!fs.existsSync(local))fs.writeFileSync(local,bytes,{flag:'wx'});
   item.status='downloaded';item.files=[{name:input.name,version:input.version,sourceUrl:item.url,resolvedUrl:response.url,bytes:bytes.length,sha256,stagingPath:local,archiveRole:['Builds']}];
  }catch(error){item.status='unavailable';item.error=error.message;}
  items.push(item);console.log(JSON.stringify({id:item.id,status:item.status,files:item.files.map(f=>({name:f.name,bytes:f.bytes,sha256:f.sha256})),error:item.error}));
 }
 fs.writeFileSync(path.join(root,'docs/free-shops-acquisition.json'),JSON.stringify({checkedAt:new Date().toISOString(),items},null,2)+'\n');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
