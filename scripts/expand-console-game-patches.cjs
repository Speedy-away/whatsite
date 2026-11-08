'use strict';
// Catalogue every pinned upstream definition. Read/extract only; never execute patches.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {unzip,metadata}=require('./prepare-console-game-patches.cjs');
const root=path.resolve(__dirname,'..');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const write=(file,value)=>fs.writeFileSync(path.join(root,file),JSON.stringify(value,null,2)+'\n');
const slug=value=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
function preserve(file,bytes){const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});if(fs.existsSync(target)){if(digest(fs.readFileSync(target))!==digest(bytes))throw Error('Preserving different bytes: '+file);}else fs.writeFileSync(target,bytes,{flag:'wx'});}
function expand({sourceRoot,treeFile}){
 const data=read('docs/ps4-ps5-game-patches.json'),jobs=read('docs/ps4-ps5-game-patch-jobs.json'),tree=read(treeFile);
 if(tree.sha!==data.revision||tree.truncated)throw Error('Complete tree must match pinned revision');
 const archive=fs.readFileSync(path.join(root,data.archive.local));if(digest(archive)!==data.archive.sha256)throw Error('Archive changed');
 const entries=unzip(archive),sources=tree.tree.filter(file=>/^patches\/xml(?:_prospero)?\/.*\.xml$/.test(file.path)),coverage=[],newJobs=[];
 const baseline='docs/qa/game-patches-complete-baseline.json';if(!fs.existsSync(path.join(root,baseline)))write(baseline,{games:data.games,resources:data.resources,jobs:jobs.jobs});
 for(const source of sources){
  const raw=fs.readFileSync(path.resolve(root,sourceRoot,source.path));const blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+raw.length+'\0'),raw])).digest('hex');if(blob!==source.sha)throw Error('Source differs from Git tree: '+source.path);
  const ids=[...new Set([...raw.toString().matchAll(/<ID>([^<]+)<\/ID>/g)].map(match=>match[1]))];if(!ids.length||!metadata(raw.toString()).length)throw Error('Missing source metadata: '+source.path);
  const arch=ids.every(id=>/^PPSA\d+$/.test(id))?'prospero':ids.every(id=>/^CUSA\d+$/.test(id))?'orbis':null;if(!arch)throw Error('Mixed/unknown title-ID architecture: '+source.path);
  let game=data.games.find(game=>game.sourcePath===source.path);const isNew=!game;
  const allOptions=[],files=[];
  for(const titleId of ids){
   const candidates=entries.filter(entry=>entry.name.endsWith('/'+titleId+'.xml'));if(!candidates.length)throw Error('No generated release file: '+titleId);
   if(new Set(candidates.map(entry=>digest(entry.bytes))).size!==1)throw Error('Conflicting generated copies: '+titleId);
   const entry=candidates.find(entry=>entry.name.startsWith('patches/xml/'))||candidates[0];
   for(const option of metadata(entry.bytes.toString()))if(!allOptions.some(old=>JSON.stringify(old)===JSON.stringify(option)))allOptions.push(option);
   const existing=game?.files.find(file=>file.titleId===titleId),id='fps-'+titleId.toLowerCase()+'-'+data.release;
   const local=existing?.local||'/downloads/ps4-ps5/fps-patches-'+data.release+'/'+(arch==='prospero'?'xml_prospero':'xml')+'/'+titleId+'.xml';
   preserve(local,entry.bytes);
   const file=existing||{titleId,filename:titleId+'.xml',archiveEntry:entry.name,local,bytes:entry.bytes.length,sha256:digest(entry.bytes),downloadId:id,downloadLocal:'/downloads/ps4-ps5/'+id+'/'+titleId+'.xml'};
   if(file.sha256!==digest(entry.bytes))throw Error('Existing pinned file differs: '+titleId);files.push(file);
  }
  if(!game){
   const title=allOptions[0].Title;let id=slug(title);if(data.games.some(game=>game.id===id))id+='-'+slug(path.basename(source.path,'.xml'));
   game={id,title,sourcePath:source.path,sourceFile:path.basename(source.path),arch,titleIds:ids,options:allOptions,files,image:null,platforms:arch==='prospero'?['ps5']:['ps4','ps5']};data.games.push(game);
  }
  game.catalogueOptions=allOptions;game.sourceBlob=source.sha;
  for(const file of files){
   if(!game.files.some(old=>old.titleId===file.titleId))game.files.push(file);
   if(!game.titleIds.includes(file.titleId))game.titleIds.push(file.titleId);
   if(data.resources.some(resource=>resource.id===file.downloadId))continue;
   const sourceUrl=data.repository+'/blob/'+data.revision+'/'+source.path;
   const updates=[...new Set(allOptions.map(option=>option.AppVer))];
   data.resources.push({id:file.downloadId,title:game.title+' · '+file.titleId+' patch XML',platforms:game.platforms,category:'patches',version:data.release,compatibility:(arch==='prospero'?'Native PS5 title':'PS4 title; PS5 use is backward compatibility only')+'. '+file.titleId+'. Exact source update labels: '+updates.join(', ')+'. Follow each option’s hardware and runtime notes.',image:game.image,page:'/console/ps4/game-patches.html#'+game.id,pages:Object.fromEntries(game.platforms.map(platform=>[platform,'/console/ps4/game-patches.html#'+game.id])),source:sourceUrl,filename:file.filename,format:'XML patch data',game:game.id,keywords:[game.title,file.titleId,...updates,...allOptions.map(option=>option.Name)],local:file.downloadLocal,bytes:file.bytes,sha256:file.sha256,preparation:arch==='prospero'?'Use the firmware-compatible PS5 patch engine and /data/user/patches/xml_prospero/. Match the exact PPSA title, game update and option notes.':'PS4 GoldHEN uses /user/data/GoldHEN/patches/xml/. PS Patch System uses /data/user/patches/xml_orbis/. Match the exact CUSA title, update, hardware and option notes.'});
   const job={id:file.downloadId,title:game.title+' · '+file.titleId+' patch XML',platform:arch==='prospero'?'PS5':'PS4 and PS5',category:['Games',game.title,'Game Patches'],project:'PS Game Patch',version:data.release,filename:file.filename,url:data.archive.url,sourceUrls:[sourceUrl],importPath:file.local.slice(1),archiveEntry:file.archiveEntry,expectedBytes:file.bytes,expectedSha256:file.sha256,archiveRole:['Builds'],pages:['console/ps4/game-patches.html']};
   if(!jobs.jobs.some(old=>old.id===job.id)){jobs.jobs.push(job);newJobs.push(job);}
  }
  coverage.push({sourcePath:source.path,sourceBlob:source.sha,sourceSHA256:digest(raw),gameId:game.id,arch,titleIds:ids,optionCount:allOptions.length,added:isNew,files:files.map(file=>({titleId:file.titleId,sha256:file.sha256,archiveEntry:file.archiveEntry}))});
 }
 data.completeCatalogue={revision:data.revision,release:data.release,sourceDefinitions:sources.length,xmlDefinitions:sources.filter(source=>source.path.startsWith('patches/xml/')).length,allOptionsIncluded:true};
 write('docs/ps4-ps5-game-patches.json',data);write('docs/ps4-ps5-game-patch-jobs.json',jobs);const completeJobsFile='docs/ps4-ps5-game-patch-complete-jobs.json';const retainedJobs=fs.existsSync(path.join(root,completeJobsFile))?read(completeJobsFile).jobs:[];write(completeJobsFile,{jobs:[...retainedJobs,...newJobs.filter(job=>!retainedJobs.some(old=>old.id===job.id))]});write('docs/ps4-ps5-game-patch-coverage.json',{revision:data.revision,release:data.release,sources:coverage});
 return {definitions:sources.length,games:data.games.length,newGames:coverage.filter(row=>row.added).length,newFiles:newJobs.length};
}
module.exports={expand};
if(require.main===module)console.log(expand({sourceRoot:'tmp/all-game-patches/source',treeFile:'tmp/all-game-patches/tree.json'}));
