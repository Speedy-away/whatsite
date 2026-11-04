'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const html=require('./localized-html.cjs'),scope=require('./site-public-pages.cjs');
function prepare({root=scope.root,output=scope.root}={}){
 function files(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{const file=path.join(directory,entry.name),relative=path.relative(root,file).replaceAll('\\','/');if(entry.isDirectory()){if(relative==='downloads')return fs.existsSync(path.join(file,'index.html'))?[path.join(file,'index.html')]:[];return scope.eligible(relative+'/index.html')?files(file):[];}return entry.isFile()&&scope.eligible(relative)?[file]:[];});}
 const deliveryFile=path.join(root,'docs/download-source-links.json'),delivery=fs.existsSync(deliveryFile)?JSON.parse(fs.readFileSync(deliveryFile,'utf8')).entries:[];
 const pages=files(root).map(file=>({name:path.relative(root,file).replaceAll('\\','/'),source:fs.readFileSync(file,'utf8')})).filter(p=>html.publicSource(p.name,p.source)).map(page=>({...page,originalHash:html.hash(page.source),source:require('./source-download-notes.cjs').annotate(page.source,page.name,delivery)}));
 const names=new Set();
 for(const values of Object.values(require(path.join(root,'scripts/console-resource-tags.cjs')).gameAliases))for(const value of values)names.add(value);
 for(const file of fs.readdirSync(path.join(root,'docs')).filter(name=>/\.json$/.test(name)&&/(?:catalog|resources|games|homebrew|mods|ports|apps)/.test(name)&&!/(?:qa|verification|inventory|jobs|audit|images|acquisition)/.test(name))){
  const target=path.join(root,'docs',file);if(!fs.existsSync(target))continue;
  function walk(value,parent=''){if(Array.isArray(value)){value.forEach(item=>walk(item,parent));return;}if(!value||typeof value!=='object')return;for(const [key,item]of Object.entries(value)){if(/^(?:name|gameTitle|filename)$/.test(key)&&typeof item==='string'&&item.length<100&&!/[.!?]$/.test(item))names.add(item);else if(key==='title'&&typeof item==='string'&&item.length<100&&/^(?:games|projects|resources|items|apps|menus|entries|ports)$/.test(parent))names.add(item);else if(typeof item==='object'&&!/^(?:cheats|patches|features|tests|checks|requirements|guideBlocks|controls|verification)$/.test(key))walk(item,key);}}
  const data=JSON.parse(fs.readFileSync(target,'utf8'));walk(data);for(const game of data.games||[])if(typeof game.title==='string')names.add(game.title);
 }
 const mask=html.protection([...names]),segments=new Map(),sourceStrings=new Map(),inventory=[];
 const reference=html.dictionary(root,'es');let literal=0,existing=0;
 for(const page of pages){
  const records=[];
  for(const span of [...html.spans(page.source),...html.structuredStrings(page.source).map(source=>({source,context:'structured-data'}))]){
   if(sourceStrings.has(span.source)){records.push(sourceStrings.get(span.source));continue;}
   const protectedText=mask(span.source);let record;
   if(span.source.length>1000&&(span.source.match(/[\\/]/g)||[]).length>20){record={source:span.source,literal:true,reason:'technical-file-list'};literal++;}
   else if(typeof reference[span.source]==='string'){record={source:span.source,dictionary:true};existing++;}
   else if(!/[A-Za-z]{2}/.test(protectedText.template.replace(/ZXQ\d{4}QXZ/g,''))){record={source:span.source,literal:true};literal++;}
   else{
    record={source:span.source,id:protectedText.id,values:protectedText.values};
    const previous=segments.get(record.id);assert(!previous||previous===protectedText.template,'Translation hash collision');segments.set(record.id,protectedText.template);
   }
   sourceStrings.set(span.source,record);records.push(record);
  }
  inventory.push({page:page.name,canonical:html.canonical(page.source),sha256:page.originalHash,strings:[...new Set(records.map(r=>r.source))]});
 }
 const manifest={schemaVersion:1,sourceLanguage:'en',languages:html.codes,pages:inventory,protectedNames:[...names],strings:[...sourceStrings.values()],segments:Object.fromEntries([...segments].sort(([a],[b])=>a.localeCompare(b)))};
 const folder=path.join(output,'docs/i18n');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'page-translations.json'),JSON.stringify(manifest)+'\n');
 console.log(JSON.stringify({pages:pages.length,uniqueStrings:sourceStrings.size,existingDictionaryStrings:existing,literalStrings:literal,machineTranslationSegments:segments.size,characters:[...segments.values()].reduce((n,s)=>n+s.length,0),protectedNames:names.size},null,2));return manifest;
}
if(require.main===module)prepare({root:path.resolve(process.argv[2]||scope.root)});
module.exports={prepare};
