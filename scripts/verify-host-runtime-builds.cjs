#!/usr/bin/env node
'use strict';
// Read-only verification. Never import/evaluate downloaded browser scripts.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const builds=JSON.parse(fs.readFileSync(path.join(root,'docs/host-runtime-builds.json'),'utf8'));
let checked=0,dependencies=0;
function exists(base,from,target){
 if(!target||/^(?:[a-z]+:|\/\/|#)/i.test(target))return;
 target=target.replace(/[?#].*$/,'');if(!target)return;
 const resolved=path.resolve(path.dirname(path.join(base,from)),target);
 if(resolved!==base&&!resolved.startsWith(base+path.sep))throw Error('Dependency escapes runtime: '+target);
 if(!fs.existsSync(resolved))throw Error('Missing runtime dependency: '+from+' -> '+target);
 dependencies++;
}
for(const m of builds.runtimes){
 const base=path.join(root,'hosts/runtime',m.id);
 for(const file of m.files){const b=fs.readFileSync(path.join(base,file.path));if(b.length!==file.bytes||sha(b)!==file.sha256)throw Error('Build hash mismatch: '+m.id+'/'+file.path);checked++;
  if(!file.path.startsWith('web/'))continue;
  const text=b.toString('utf8').replace(/<!--[\s\S]*?-->/g,'').replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
  if(/\.m?js$/.test(file.path))for(const hit of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*)['"](\.\.?\/[^'"]+)['"]/g))exists(base,file.path,hit[1]);
  if(/\.html$/.test(file.path))for(const hit of text.matchAll(/(?:src|href|manifest)\s*=\s*['"]([^'"]+)['"]/g))exists(base,file.path,hit[1]);
  if(/\.(?:html|css)$/.test(file.path))for(const hit of text.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g))exists(base,file.path,hit[1]);
 }
 const guard=fs.readFileSync(path.join(base,'guard.js'),'utf8');
 for(const [ua,expected]of [['Mozilla/5.0 Windows NT 10.0',false],['Mozilla/5.0 (PlayStation 4/9.00)',m.console==='ps4'],['Mozilla/5.0 (PlayStation; PlayStation 5/4.03)',m.console==='ps5'],['Mozilla/5.0 (PlayStation; PlayStation 5/5.00)',false]]){const c={navigator:{userAgent:ua},window:{},document:{getElementById:()=>null}};vm.runInNewContext(guard,c);if(c.window.whatsiteRuntimeAllowed!==expected)throw Error('Console guard failed');}
 if(m.console==='ps4'){
  const lapse=fs.readFileSync(path.join(base,'web/lapse.js'),'utf8');if(lapse.includes('PayloadLoader("goldhen.bin")'))throw Error('Unexpected automatic GoldHEN');
  exists(base,'web/lapse.js','aio_patches.bin');exists(base,'web/lapse.js','kpatch/900.elf');
  const cache=fs.readFileSync(path.join(base,'web/psfree_lapse.appcache'),'utf8').split(/\r?\n/);let inCache=true;
  for(const line of cache){if(/^(?:NETWORK|SETTINGS|FALLBACK):/.test(line)){inCache=false;continue;}if(!line.trim()||/^#|^CACHE MANIFEST/.test(line)||!inCache)continue;exists(base,'web/psfree_lapse.appcache',line.trim());}
 }else{
  for(const fw of m.firmwares)exists(base,'web/exploit.js','offsets/'+fw+'.js');
  exists(base,'web/exploit.js','payloads/elfldr.elf');exists(base,'web/exploit.js','rop_slave.js');
  if(!fs.readFileSync(path.join(base,'web/payloads/elfldr.elf')).subarray(0,4).equals(Buffer.from([127,69,76,70])))throw Error('Native ELF header mismatch');
 }
}
const upstream=JSON.parse(fs.readFileSync(path.join(root,'docs/qa/host-runtime-upstream-files.json'),'utf8'));
for(const file of upstream){const b=fs.readFileSync(path.join(root,'hosts/runtime',file.id,'upstream',file.path));if(b.length!==file.bytes||sha(b)!==file.sha256)throw Error('Original upstream bytes changed: '+file.id+'/'+file.path);}
console.log(JSON.stringify({status:'verified',runtimeFiles:checked,localDependencyReferences:dependencies,upstreamFiles:upstream.length,consoleGuardCases:8,downloadedCodeExecuted:false,hardwareExecution:false}));
