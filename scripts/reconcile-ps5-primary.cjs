'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(process.argv[2]||'../WWB-HOST');
function patch(rel,fn){const f=path.join(root,rel);fs.writeFileSync(f,fn(fs.readFileSync(f,'utf8')));}
patch('scripts/host-compact-pages.cjs',s=>s.replace("['ps4-afterglow','karo-g2allpro','karo-ps5-umtx']","['ps4-afterglow','karo-g2allpro']").replace("if(r.id==='ps4-psfree-700-960')rows.push", "if(r.id==='ps5-umtx')rows.push({id:r.id,label:'PS5 WebKit Exploit - '+r.firmwares[0]+'–'+r.firmwares[r.firmwares.length-1],platform:'ps5',firmwares:r.firmwares.slice(),entry:r.entry,runtimeEntry:r.entry,preferred:true,source:r.source});\n  if(r.id==='ps4-psfree-700-960')rows.push").replace(".map(g=>({id:'local-'+g.id,", ".map(g=>g.id==='ps5-umtx'?{...previous.find(a=>a.id==='built-in-ps5-umtx'),label:g.label,firmwareLabel:g.label.replace(/^PS5 WebKit Exploit - /,'')}:{id:'local-'+g.id,").replace("requirements:['Open this local launcher on the matching console. Firmware is checked again before Load.']}));", "requirements:['Open this local launcher on the matching console. Firmware is checked again before Load.']});"));
patch('scripts/verify-host-project-pages.cjs',s=>s.replace('let links=0,checkedScripts=0,runtimeDocumentsOptimized=0;','let links=0,checkedScripts=0,runtimeDocumentsOptimized=0,localRuntimeConfigs=0;'));
require(path.join(root,'scripts/host-compact-pages.cjs')).build(root);
require(path.join(root,'scripts/build-host-selector.cjs')).buildHostSelector({hostOnly:true});
require(path.join(root,'scripts/host-compact-pages.cjs')).build(root);
require(path.join(root,'scripts/build-afterglow-public-launcher.cjs')).build(root);
console.log('Retained the verified direct UMTX Load path alongside the new locally hosted Relapse route.');
