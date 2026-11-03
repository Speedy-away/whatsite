'use strict';
// Read APK containers as data. Never install or execute downloaded apps.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),scope='apk-tv-phone',catalogFile=path.join(root,'docs/apk-app-catalog.json');
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&#038;','&');
function curl(url,file){return new Promise((resolve,reject)=>{const child=spawn('curl.exe',['-L','--fail','--silent','--show-error','--max-time','75',url,'-o',file]);let error='';child.stderr.on('data',b=>error+=b);child.on('error',reject);child.on('close',code=>code?reject(Error(error.trim()||'curl exit '+code)):resolve());});}
async function main(){
 const catalog=JSON.parse(fs.readFileSync(catalogFile));
 const archive=process.argv.includes('--download')?require('./console-expansion-archive.cjs').createArchive():null;
 fs.mkdirSync(path.join(root,'tmp/apk-source'),{recursive:true});let cursor=0;
 async function worker(){while(cursor<catalog.apps.length){const app=catalog.apps[cursor++];try{
  let url=app.url;
  if(!/\.apk(?:$|\?)/i.test(url)){
   const page=path.join(root,'tmp/apk-source',app.id+'.html');await curl(url,page);
   const html=fs.readFileSync(page,'utf8');
   const candidates=[...html.matchAll(/\bhref=["']([^"']+\.apk(?:\?[^"']*)?)["']/gi)].map(m=>decode(m[1]));
   url=candidates.find(u=>/archive\.org\/download\//.test(u))||candidates[0];
   if(!url)throw Error('No direct APK exposed by source page');
  }
  if(!/^https?:\/\//.test(url)||/bstlar/i.test(url))throw Error('Unsupported source URL');
  app.downloadURL=url;
  if(archive){
   const staging=path.join(root,'tmp/apk-source',app.id+'.apk');await curl(url,staging);
   const bytes=fs.readFileSync(staging);
   if(bytes.length<1024||bytes.length>128*1024*1024||bytes.readUInt32LE(0)!==0x04034b50||!bytes.includes(Buffer.from('AndroidManifest.xml')))throw Error('Response is not a bounded Android APK container');
   const name=decodeURIComponent(new URL(url).pathname.split('/').pop());
   const version=name.replace(/\.apk$/i,'').match(/(?:^|[_-])v?(\d+\.\d+(?:\.\d+)*(?:[a-z0-9.-]*))/i)?.[1]||'Source snapshot 2026-11-03';
   const result=await archive.writeBytes({scope,item:{id:scope+'-'+app.id,title:app.name,project:app.name,url:app.url,platform:app.platform==='tv'?'Android TV':'Android',category:['Apps'],pages:['pages/apk.html']},file:{name,sourceUrl:url,version,archiveRole:['Builds'],compatibility:'Historical source listing; device and OS requirements must be checked before installation.'},bytes});
   app.file=result.publicFile;app.status='archived';
  }else app.status='source-resolved';
  delete app.error;console.log(app.id+': '+app.status);
 }catch(error){app.status='source-unavailable';app.error=error.message;console.log(app.id+': '+app.error);}
 fs.writeFileSync(catalogFile,JSON.stringify(catalog,null,2)+'\n');
 }}
 await Promise.all([worker(),worker(),worker()]);
 if(archive){await archive.mergeInventory({inventory:archive.inventoryPath(scope)});}
 console.log(JSON.stringify({apps:catalog.apps.length,archived:catalog.apps.filter(a=>a.status==='archived').length,unavailable:catalog.apps.filter(a=>a.status==='source-unavailable').length}));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
