// Refresh only the authored transfer routes; preserve other translation inventories.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),file=path.join(root,'docs/i18n/page-translations.json');
const pages=['console/ps4/file-transfer-guide.html','console/ps5/file-transfer-guide.html','console/download-center/index.html'];
function prepare(){
 const beforeText=fs.readFileSync(file,'utf8'),before=JSON.parse(beforeText);
 fs.mkdirSync(path.join(root,'tmp'),{recursive:true});
 const staging=fs.mkdtempSync(path.join(root,'tmp/transfer-guide-i18n-'));
 fs.mkdirSync(path.join(staging,'docs/i18n'),{recursive:true});
 fs.writeFileSync(path.join(staging,'docs/i18n/page-translations.json'),beforeText);
 const manifest=require('./prepare-localized-translations.cjs').prepare({root,output:staging,selectedPages:pages});
 const pack=require('../i18n-tools/transfer-guide-translations.cjs'),rows=new Map(manifest.strings.map(row=>[row.source,row]));
 for(const source of Object.keys(pack))rows.set(source,{source,dictionary:true});
 const keywordStrings=new Set(pages.flatMap(page=>{
   const source=fs.readFileSync(path.join(root,page),'utf8');
   return [...source.matchAll(/<meta[^>]*name="keywords"[^>]*content="([^"]*)"/g)].map(m=>require('./localized-html.cjs').decode(m[1]));
 }));
 const removed=new Set();
 for(const source of keywordStrings){
  const prior=rows.get(source);if(prior?.id&&!Object.hasOwn(before.segments,prior.id))removed.add(prior.id);
  rows.set(source,{source,literal:true,reason:'technical-search-aliases'});
 }
 // New prose is dictionary-backed, so source refresh never adds a machine-translation dependency.
 for(const [source,row]of rows)if(row.dictionary){
  const prior=manifest.strings.find(item=>item.source===source);
  if(prior?.id&&!Object.hasOwn(before.segments,prior.id))removed.add(prior.id);
 }
 for(const id of removed)delete manifest.segments[id];
 manifest.strings=[...rows.values()];
 const outstanding=Object.keys(manifest.segments).filter(id=>!Object.hasOwn(before.segments,id));
 if(outstanding.length)throw Error('Untranslated new source: '+outstanding.map(id=>manifest.segments[id]).join(' | '));
 if(fs.readFileSync(file,'utf8')!==beforeText)throw Error('Concurrent localization inventory edit');
 fs.writeFileSync(file,JSON.stringify(manifest)+'\n');
 console.log('Transfer routes and all guide strings registered for 20 static language builds.');
 return manifest;
}
if(require.main===module)prepare();
module.exports={prepare};
