'use strict';
// Import already-downloaded, inspected APKs. Preserve previous sources and versions.
const fs=require('node:fs'),path=require('node:path');
const {manifestInfo}=require('./apk-manifest-info.cjs');
const root=path.resolve(__dirname,'..'),scope='apk-tv-repairs';
const plans=[
 {id:'file-synced',file:'filesynced-docsq.apk',name:'FileSynced-4.3.apk',package:'com.filesynced.app',version:'4.3',url:'https://docsquiffy.com/api/downloads/33/file',source:'https://docsquiffy.com/apks',description:'Mirror build 4.3. The publisher’s 4.8 host was unreachable; versions are kept separate.'},
 {id:'unlinked',file:'unlinked-stable.apk',name:'Unlinked-2.0.4.apk',package:'link.unlinked',version:'2.0.4',bytes:3944369,url:'https://github.com/un-linked/unlinked/releases/download/stable/android.apk',source:'https://github.com/un-linked/unlinked/releases/tag/stable',description:'Publisher stable-channel APK. The locally archived snapshot is version 2.0.4.',mutable:true},
 {id:'applinked',file:'applinked-2.0.12.apk',name:'AppLinked-2.0.12.apk',package:'com.i4apps.applinkednew',version:'2.0.12',url:'https://www.mediafire.com/file/9c00ev9vuz52837/Applinked_2.0.12.apk/file',source:'https://applinked.org/download/',description:'AppLinked 2.0.12 from the replacement download page’s MediaFire link.'},
 {id:'launcher-manager',file:'lm-atv-docsq.apk',name:'Launcher-Manager-ATV-1.0.4.apk',package:'com.wolf.google.lm',version:'1.0.4',url:'https://docsquiffy.com/api/downloads/347/file',source:'https://docsquiffy.com/apks',description:'Google / Android TV build 1.0.4. This is separate from the older Fire TV 1.1.8 build.'}
];
const pages=[
 {id:'peacock-tv',kind:'store',url:'https://play.google.com/store/apps/details?id=com.peacocktv.peacockandroid',file:'repair-peacock-store.html',identity:'com.peacocktv.peacockandroid',label:'Open Google Play',description:'Official store release. Peacock requires a supported device and US availability; subscription terms apply.'},
 {id:'xumo',kind:'store',url:'https://play.google.com/store/apps/details?id=com.xumo.xumo.tv',file:'repair-xumo-store.html',identity:'com.xumo.xumo.tv',label:'Open Google Play',description:'Official Xumo Play TV listing. Check availability for your device and region.'},
 {id:'atv-launcher',kind:'store',url:'https://play.google.com/store/apps/details?id=ca.dstudio.atvlauncher.pro',file:'repair-atv-store.html',identity:'ca.dstudio.atvlauncher.pro',label:'Open Google Play',description:'Official paid Pro release on Google Play. The older 0.0.11-pro archive remains a separate historical source.'},
 {id:'tv-launcher',kind:'release-page',url:'https://www.apkmirror.com/apk/awesome-development/tvlauncher/tvlauncher-3-1-1-release/tvlauncher-3-1-1-android-apk-download/',label:'Open 3.1.1 release',version:'3.1.1 beta',description:'Alternate release page for the original 3.1.1 version. Complete its download in your browser; no APK copy is claimed here.',source:'https://www.apkmirror.com/apk/awesome-development/tvlauncher/tvlauncher-3-1-1-release/tvlauncher-3-1-1-android-apk-download/'}
];
function retain(app){
 if(!app.retainedSources)app.retainedSources=[{url:app.url,downloadURL:app.downloadURL||null,status:app.status,error:app.error||null,checkedAt:'2026-11-03'}];
}
async function main(){
 const file=path.join(root,'docs/apk-app-catalog.json'),catalog=JSON.parse(fs.readFileSync(file));
 const archive=require('./console-expansion-archive.cjs').createArchive();
 for(const plan of plans){
  const app=catalog.apps.find(a=>a.id===plan.id),bytes=fs.readFileSync(path.join(root,'tmp/apk-source',plan.file)),info=manifestInfo(bytes);
  if(info.package!==plan.package||info.versionName!==plan.version||plan.bytes&&bytes.length!==plan.bytes)throw Error('APK identity mismatch: '+plan.id);
  const result=await archive.writeBytes({scope,item:{id:scope+'-'+plan.id,title:app.name,project:app.name,url:plan.source,platform:'Android TV',category:['Apps'],pages:['pages/apk.html']},file:{name:plan.name,sourceUrl:plan.url,version:plan.version,archiveRole:['Builds'],compatibility:plan.description},bytes});
  retain(app);Object.assign(app,{status:'archived',downloadURL:plan.url,file:result.publicFile,repair:{kind:'apk',source:plan.source,description:plan.description,manifest:info,mutable:!!plan.mutable,checkedAt:new Date().toISOString()}});delete app.error;console.log(plan.id+': archived '+info.versionName);
 }
 for(const plan of pages){
  if(plan.file){const html=fs.readFileSync(path.join(root,'tmp',plan.file),'utf8');if(!html.includes(plan.identity)||!/<title\b[^>]*>[^<]*Google Play/i.test(html))throw Error('Store identity missing: '+plan.id);}
  const app=catalog.apps.find(a=>a.id===plan.id);retain(app);app.status=plan.kind==='store'?'store-linked':'release-linked';app.delivery={kind:plan.kind,url:plan.url,label:plan.label,version:plan.version||'Store-managed release',description:plan.description,checkedAt:new Date().toISOString()};delete app.error;
 }
 catalog.checkedAt=new Date().toISOString();fs.writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');
 await archive.mergeInventory({inventory:archive.inventoryPath(scope)});console.log('Recovered four APKs; three official store routes and one exact-version release page retained.');
}
module.exports={plans,pages};if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
