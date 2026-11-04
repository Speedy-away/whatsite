'use strict';
// Preserve independently added metadata while reconciling a shared-host merge.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(process.argv[2]||'../WWB-HOST');
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function merge(base,ours,theirs){
 if(equal(ours,theirs)||equal(theirs,base))return ours;
 if(equal(ours,base))return theirs;
 if(Array.isArray(ours)&&Array.isArray(theirs)){
  if([...ours,...theirs].every(x=>x&&typeof x==='object'&&typeof x.id==='string')){
   const b=new Map((base||[]).map(x=>[x.id,x])),o=new Map(ours.map(x=>[x.id,x])),t=new Map(theirs.map(x=>[x.id,x]));
   return [...new Set([...o.keys(),...t.keys()])].map(k=>merge(b.get(k),o.get(k),t.get(k))).filter(x=>x!==undefined);
  }
  return [...ours,...theirs].filter((x,i,a)=>a.findIndex(y=>equal(x,y))===i);
 }
 if(ours&&theirs&&typeof ours==='object'&&typeof theirs==='object'){
  const result={};for(const k of new Set([...Object.keys(ours),...Object.keys(theirs)])){const value=merge(base?.[k],ours[k],theirs[k]);if(value!==undefined)result[k]=value;}return result;
 }
 return theirs;
}
for(const file of ['docs/host-goldhen-retained-versions.json','docs/migration/status.json']){
 const stages=[1,2,3].map(n=>{const read=ref=>cp.execFileSync('git',['show',ref+':'+file],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});let text=read(':'+n);if(n===1&&/^<<<<<<</m.test(text))text=read('c07522f295dc9e0110d4cea5133ba26d41dc7ae1');return JSON.parse(text);});
 const result=merge(...stages);fs.writeFileSync(path.join(root,file),JSON.stringify(result,null,2)+'\n');
 console.log(file+' reconciled');
}
