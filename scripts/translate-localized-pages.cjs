'use strict';
// Offline publication uses these saved translations, never a visitor-side service.
const fs=require('node:fs'),path=require('node:path'),{codes,restore,hash,dictionary}=require('./localized-html.cjs');
const root=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/i18n/page-translations.json'),'utf8'));
const args=process.argv.slice(2),only=args.includes('--languages')?args[args.indexOf('--languages')+1].split(','):codes,maxBatches=args.includes('--max-batches')?Number(args[args.indexOf('--max-batches')+1]):Infinity;
const folder=path.join(root,'languages/pages'),journalFolder=path.join(root,'tmp/page-translation-journal');fs.mkdirSync(folder,{recursive:true});fs.mkdirSync(journalFolder,{recursive:true});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let completed=0,failed=0,requests=0,nextStart=0,stopped=false;
const state=new Map();
for(const code of only){
 if(!codes.includes(code))throw Error('Unknown language '+code);
 const file=path.join(folder,code+'.json'),journal=path.join(journalFolder,code+'.jsonl'),data=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{language:code,sourceLanguage:'en',provider:'Google Translate automated translation',translations:{}};
 if(fs.existsSync(journal))for(const line of fs.readFileSync(journal,'utf8').split('\n').filter(Boolean)){const [id,value]=JSON.parse(line);if(manifest.segments[id])data.translations[id]=value;}
 state.set(code,{file,journal,data,dirty:0,dictionary:dictionary(root,code)});
}
function save(code){const item=state.get(code);fs.writeFileSync(item.file,JSON.stringify(item.data)+'\n');item.dirty=0;}
function record(code,values){const item=state.get(code);for(const[id,value]of values)item.data.translations[id]=value;fs.appendFileSync(item.journal,values.map(row=>JSON.stringify(row)).join('\n')+'\n');}
function validate(template,value){
 if(typeof value!=='string'||!value.trim())throw Error('Empty translation');
 const markers=(template.match(/ZXQ\d{4}QXZ/g)||[]).sort(),actual=(value.match(/ZXQ\d{4}QXZ/g)||[]).sort();
 if(markers.join('|')!==actual.join('|'))throw Error('Translation changed a protected literal');
 if(/⟦\d+⟧/.test(value))throw Error('Batch marker in translation');
 return value.trim();
}
async function rawFragment(code,source){
 const text=source.trim(),item=state.get(code),id=hash(text).slice(0,20);
 if(!/[A-Za-z]{2}/.test(text)||/^[A-Z]{2,8}$/.test(text))return text;
 if(item.data.translations[id])return item.data.translations[id];
 const known=item.dictionary[text]||item.dictionary[text.toLowerCase()];if(known)return known;
 for(let attempt=0;attempt<3;attempt++){
  const position=nextStart=Math.max(Date.now(),nextStart)+160;await pause(Math.max(0,position-Date.now()));requests++;
  const url=new URL('https://translate.googleapis.com/translate_a/single');for(const[k,v]of Object.entries({client:'gtx',sl:'en',tl:code,dt:'t',q:text}))url.searchParams.set(k,v);
  const response=await fetch(url,{signal:AbortSignal.timeout(45000)});
  if(response.status===429){await pause(60000);continue;}
  if(!response.ok)throw Error('Fragment translation HTTP '+response.status);
  const json=await response.json(),value=json[0].map(row=>row[0]||'').join('').trim();
  if(value){record(code,[[id,value]]);return value;}
 }
 throw Error('Empty raw translation fragment '+code+': '+text.slice(0,120));
}
async function separated(code,id,source){
 const parts=source.split(/(ZXQ\d{4}QXZ)/),output=[];
 for(const part of parts){
  if(!part||/^ZXQ\d{4}QXZ$/.test(part)||!/[A-Za-z]{2}/.test(part)){output.push(part);continue;}
  const leading=part.match(/^\s*/)?.[0]||'',trailing=part.match(/\s*$/)?.[0]||'';output.push(leading+await rawFragment(code,part)+trailing);
 }
 const value=validate(source,output.join(''));state.get(code).data.repairs||={};state.get(code).data.repairs[id]='Protected literals retained between separately translated prose fragments';record(code,[[id,value]]);return [[id,value]];
}
async function request(code,entries,attempt=0){
 if(entries.length===1&&(entries[0][1].match(/ZXQ\d{4}QXZ/g)||[]).length>8&&(entries[0][1].match(/,/g)||[]).length>6){
  const [id,source]=entries[0],parts=source.split(/(,\s*)/),values=[];
  for(let i=0;i<parts.length;i++){
   const part=parts[i];if(!part||/^,\s*$/.test(part)||!/[A-Za-z]/.test(part.replace(/ZXQ\d{4}QXZ/g,''))){values.push(part);continue;}
   const originals=[],normalized=part.replace(/ZXQ\d{4}QXZ/g,token=>{const index=originals.push(token)-1;return 'ZXQ'+String(index).padStart(4,'0')+'QXZ';}),fragmentId=hash(normalized).slice(0,20),item=state.get(code);
   let translated=item.data.translations[fragmentId]||item.dictionary[normalized]||item.dictionary[normalized.toLowerCase()];
   const simple=/^((?:ZXQ\d{4}QXZ[ /:-]*)+)\s+([a-z -]+)$/.exec(normalized);
   if(!translated&&simple&&item.dictionary['{name} '+simple[2]])translated=item.dictionary['{name} '+simple[2]].replaceAll('{name}',simple[1]);
   if(!translated){translated=(await request(code,[[fragmentId,normalized]]))[0][1];item.data.translations[fragmentId]=translated;fs.appendFileSync(item.journal,JSON.stringify([fragmentId,translated])+'\n');}
   validate(normalized,translated);values.push(restore(translated,originals));
  }
  return [[id,validate(source,values.join(''))]];
 }
 const position=nextStart=Math.max(Date.now(),nextStart)+160;await pause(Math.max(0,position-Date.now()));requests++;
 const source=entries.map(([id,text],i)=>'⟦'+String(i).padStart(5,'0')+'⟧ '+text.replace(/ZXQ(\d{4})QXZ/g,(_,n)=>attempt===1?' ZXQ'+n+'QXZ ':attempt===2?' ⟪'+n+'⟫ ':' '+(876540000+Number(n))+' ')).join('\n');
 const url=new URL('https://translate.googleapis.com/translate_a/single');for(const[k,v]of Object.entries({client:'gtx',sl:'en',tl:code,dt:'t',q:source}))url.searchParams.set(k,v);
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(45000)});
  if(response.status===429){await pause(60000);throw Error('Translation service rate limit');}
  if(!response.ok)throw Error('Translation HTTP '+response.status);
  const result=await response.json(),buckets=entries.map(()=>[]),lines=result[0].map(row=>row[0]||'').join('').split(/\r?\n/).filter(line=>line.trim());let current=-1;
  const lineAligned=lines.length===entries.length&&lines.every(line=>[...line.matchAll(/⟦\s*(\d{5})\s*⟧/g)].length===1);
  if(lineAligned){for(const line of lines){const index=Number(line.match(/⟦\s*(\d{5})\s*⟧/)[1]);if(index<0||index>=entries.length||buckets[index].length)throw Error('Invalid translated line index');buckets[index].push(line);}}
  else for(const row of result[0]){
   const original=row[1]||'',markers=[...original.matchAll(/⟦\s*(\d{5})\s*⟧/g)];
   if(markers.length>1||markers.length===1&&original.slice(0,markers[0].index).trim())throw Error('Translation merged source boundaries');
   if(markers.length)current=Number(markers[0][1]);
   if(current<0||current>=entries.length)throw Error('Translation source alignment failed');
   buckets[current].push(row[0]||'');
  }
  const translated=[],rejected=[];
  entries.forEach(([id,source],i)=>{
   const raw=buckets[i].join('').replace(/⟦\s*\d{5}\s*⟧/g,'').replace(/[٠-٩۰-۹０-９]/g,char=>String('٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹０１２３４５６７８９'.indexOf(char)%10));
   const expected=new Set(source.match(/ZXQ\d{4}QXZ/g)||[]);
   const value=raw.replace(/8[.,\s]*7[.,\s]*6[.,\s]*5[.,\s]*4[.,\s]*(\d)[.,\s]*(\d)[.,\s]*(\d)[.,\s]*(\d)/g,(_,a,b,c,d)=>'ZXQ'+a+b+c+d+'QXZ').replace(/⟪\s*(\d{4})\s*⟫/g,'ZXQ$1QXZ').replace(/[A-Za-z\u0400-\u04ff]{2,8}(\d{4})[A-Za-z\u0400-\u04ff]{2,8}/g,(all,n)=>expected.has('ZXQ'+n+'QXZ')?'ZXQ'+n+'QXZ':all);
   try{translated.push([id,validate(source,value)]);}catch(error){rejected.push({id,source,error});}
  });
  if(translated.length)record(code,translated);
  for(const entry of rejected){
   const repaired=attempt<2?await request(code,[[entry.id,entry.source]],attempt+1):await separated(code,entry.id,entry.source);
   translated.push(...repaired);
  }
  return translated;
 }catch(error){
  if(attempt<2){await pause(2000*(attempt+1));return request(code,entries,attempt+1);}
  if(entries.length>1){const middle=Math.ceil(entries.length/2);return [...await request(code,entries.slice(0,middle)),...await request(code,entries.slice(middle))];}
  try{return await separated(code,entries[0][0],entries[0][1]);}catch(repairError){throw Error(code+' '+entries[0][0]+': '+repairError.message);}
 }
}
const queue=[];
for(const code of only){
 const item=state.get(code);let batch=[],size=0;
 for(const entry of Object.entries(manifest.segments)){
  if(item.data.translations[entry[0]]){try{validate(entry[1],item.data.translations[entry[0]]);continue;}catch{delete item.data.translations[entry[0]];}}
  if(entry[1].length>4400)throw Error('Translation segment exceeds batch size: '+entry[0]);
  const complex=(entry[1].match(/ZXQ\d{4}QXZ/g)||[]).length>8&&(entry[1].match(/,/g)||[]).length>6;
  if((complex||size+entry[1].length+12>4400)&&batch.length){queue.push({code,entries:batch});batch=[];size=0;}
  if(complex){queue.push({code,entries:[entry]});continue;}
  batch.push(entry);size+=entry[1].length+12;
 }
 if(batch.length)queue.push({code,entries:batch});
 save(code);
}
// Interleave languages so one slow response cannot prevent all other progress.
queue.sort((a,b)=>a.entries[0][0].localeCompare(b.entries[0][0])||a.code.localeCompare(b.code));
console.log(JSON.stringify({languages:only,segments:Object.keys(manifest.segments).length,batches:queue.length,cached:[...state.values()].reduce((n,item)=>n+Object.keys(item.data.translations).length,0)}));
let at=0;
async function worker(){
 while(!stopped&&at<queue.length&&at<maxBatches){const task=queue[at++];try{
   const values=await request(task.code,task.entries),item=state.get(task.code);
   for(const [id,value]of values)item.data.translations[id]=value;
   fs.appendFileSync(item.journal,values.map(row=>JSON.stringify(row)).join('\n')+'\n');
   item.dirty++;completed++;if(item.dirty>=15)save(task.code);
   if(completed%20===0)console.log(JSON.stringify({completed,total:queue.length,requests,translated:[...state.values()].reduce((n,item)=>n+Object.keys(item.data.translations).length,0)}));
  }catch(error){failed++;fs.appendFileSync(path.join(journalFolder,'failures.jsonl'),JSON.stringify({code:task.code,ids:task.entries.map(row=>row[0]),error:error.message})+'\n');console.error(error.message);}
 }
}
Promise.all(Array.from({length:4},worker)).then(()=>{for(const code of only)save(code);console.log(JSON.stringify({completed,failed,requests,remaining:Math.max(0,queue.length-completed)}));if(failed)process.exitCode=1;});
