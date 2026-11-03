const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {Transform}=require('node:stream');
const https=require('node:https');
const {pipeline}=require('node:stream/promises');
const {destinationForFile}=require('./download-archive-layout.cjs');
const {createArchive,contained}=require('./console-expansion-archive.cjs');
const root=path.resolve(__dirname,'..'),scope='ps4-trophy-unlockers';
const source='https://www.mediafire.com/folder/5m9vrii984nbi/trophy_unlockers';
const manifestPath=path.join(root,'docs/trophy-unlockers-private-inventory.json');
const listingPath=path.join(root,'docs/qa/trophy-unlockers-listing.json');
const statePath=path.join(root,'docs/qa/trophy-unlockers-progress.json');
const item={id:scope+'-collection',title:'trophy_unlockers',project:'trophy_unlockers',platform:'PS4',category:['Apps'],url:source,pages:['console/ps4/apps.html'],files:[]};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function get(url,redirects=0){return new Promise((resolve,reject)=>{const req=https.get(url,{headers:{'User-Agent':'Mozilla/5.0'}},res=>{if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.resume();if(redirects>8)return reject(Error('Too many redirects'));resolve(get(new URL(res.headers.location,url).href,redirects+1));return;}if(res.statusCode!==200){res.resume();return reject(Error('HTTP '+res.statusCode));}const text=async()=>{const parts=[];for await(const part of res)parts.push(part);return Buffer.concat(parts).toString('utf8');};resolve({body:res,text,json:async()=>JSON.parse(await text())});});req.setTimeout(90000,()=>req.destroy(Error('Request timeout')));req.on('error',reject);});}
async function request(url){for(let attempt=0;attempt<3;attempt++){try{return await get(url);}catch(e){if(attempt===2)throw e;await sleep(1500*(attempt+1));}}}
async function listing(){
 const files=[],folders=['5m9vrii984nbi'],seen=new Set();
 for(let index=0;index<folders.length;index++)for(const type of ['files','folders'])for(let chunk=1;;chunk++){
  const key=folders[index],url=`https://www.mediafire.com/api/1.5/folder/get_content.php?folder_key=${key}&content_type=${type}&chunk=${chunk}&response_format=json`;
  const response=(await(await request(url)).json()).response;if(response.result!=='Success')throw Error(JSON.stringify(response));
  const content=response.folder_content;
  for(const file of content.files||[])if(!seen.has(file.quickkey)){seen.add(file.quickkey);files.push({...file,parentFolder:key});}
  for(const folder of content.folders||[])if(!folders.includes(folder.folderkey))folders.push(folder.folderkey);
  if(content.more_chunks!=='yes')break;
 }
 fs.writeFileSync(listingPath,JSON.stringify({source,checkedAt:new Date().toISOString(),folders,files},null,2)+'\n');return files;
}
async function main(){
 const files=fs.existsSync(listingPath)?JSON.parse(fs.readFileSync(listingPath)).files:await listing(),intake=createArchive(),records=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath)).items[0].files:[],errors=[];
 console.log(JSON.stringify({files:files.length,bytes:files.reduce((n,f)=>n+Number(f.size),0),backupRoot:intake.backupRoot}));
 function checkpoint(){fs.writeFileSync(manifestPath,JSON.stringify({scope,items:[{...item,files:records,status:errors.length?'partial':'downloaded'}]},null,2)+'\n');fs.writeFileSync(statePath,JSON.stringify({source,total:files.length,downloaded:records.length,failed:errors.length,errors,updatedAt:new Date().toISOString()},null,2)+'\n');}
 let cursor=0,complete=0;
 async function worker(){while(cursor<files.length){const sourceFile=files[cursor++];try{
  const prior=records.find(f=>f.quickkey===sourceFile.quickkey&&f.sha256===sourceFile.hash);
  if(prior&&fs.existsSync(prior.backupPath)&&fs.statSync(prior.backupPath).size===Number(sourceFile.size)){complete++;continue;}
  const helper=/windows|PS4PKGViewer/i.test(sourceFile.filename),metadata={name:sourceFile.filename,sourceUrl:sourceFile.links.normal_download,version:'MediaFire revision '+sourceFile.revision,releaseTag:'MediaFire revision '+sourceFile.revision,archiveRole:helper?['Helpers','Windows']:/\.txt$/i.test(sourceFile.filename)?['Metadata']:['Builds'],quickkey:sourceFile.quickkey,bytes:Number(sourceFile.size),sha256:sourceFile.hash,status:'downloaded',archivedAt:new Date().toISOString()};
  let target=contained(intake.backupRoot,destinationForFile(intake.backupRoot,item,metadata));fs.mkdirSync(path.dirname(target),{recursive:true});
  if(fs.existsSync(target)){
   const existing=await require('./console-expansion-archive.cjs').hashFile(target);
   if(existing.sha256===metadata.sha256){records.push({...metadata,backupPath:target});complete++;checkpoint();continue;}
   target=contained(intake.backupRoot,path.join(path.dirname(target),path.basename(target,path.extname(target))+'-'+metadata.sha256.slice(0,12)+path.extname(target)));
  }
  const html=await(await request(metadata.sourceUrl)).text();
  const href=html.match(/id="downloadButton"[^>]*href="([^"]+)"/)?.[1]||html.match(/href="([^"]+)"[^>]*id="downloadButton"/)?.[1];
  if(!href)throw Error('MediaFire direct download unavailable');
  const direct=href.replaceAll('&amp;','&');if(!new URL(direct).hostname.endsWith('.mediafire.com'))throw Error('Unexpected download host');
  const response=await request(direct),partial=target+'.part-'+crypto.randomBytes(5).toString('hex'),hash=crypto.createHash('sha256');let count=0;
  await pipeline(response.body,new Transform({transform(chunk,encoding,callback){count+=chunk.length;hash.update(chunk);callback(null,chunk);}}),fs.createWriteStream(partial,{flags:'wx'}));
  if(count!==metadata.bytes||hash.digest('hex')!==metadata.sha256)throw Error('Downloaded bytes/hash differ; partial retained: '+partial);
  fs.copyFileSync(partial,target,fs.constants.COPYFILE_EXCL);fs.unlinkSync(partial);
  records.push({...metadata,backupPath:target});complete++;checkpoint();
  if(complete%25===0)console.log(JSON.stringify({complete,total:files.length,failed:errors.length}));
 }catch(error){errors.push({name:sourceFile.filename,sourceUrl:sourceFile.links.normal_download,error:error.message});checkpoint();console.log('Unavailable: '+sourceFile.filename+' - '+error.message);}}}
 await Promise.all(Array.from({length:8},worker));checkpoint();
 await intake.appendInventory({scope,items:[{...item,files:records,status:errors.length?'partial':'downloaded'}]});
 await intake.mergeInventory({inventory:intake.inventoryPath(scope)});
 require('node:child_process').execFileSync(process.execPath,[path.join(__dirname,'refresh-local-download-index.cjs'),'--write'],{stdio:'inherit'});
 const handoffPath=path.join(root,'docs/console-expansion-handoff.json'),handoff=JSON.parse(fs.readFileSync(handoffPath));
 handoff.ps4TrophyUnlockers={...handoff.ps4TrophyUnlockers,completedAt:new Date().toISOString(),downloaded:records.length,failed:errors.length,status:errors.length?'Partial: inaccessible files recorded in progress report; rerun downloader to retry.':'Complete: all folder files downloaded and verified; shared inventories merged and organized archive index refreshed.',published:false};
 fs.writeFileSync(handoffPath,JSON.stringify(handoff,null,2)+'\n');
 console.log(JSON.stringify({total:files.length,downloaded:records.length,errors}));if(errors.length)process.exitCode=2;
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
