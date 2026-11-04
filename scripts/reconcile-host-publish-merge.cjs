'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),root=path.resolve(process.argv[2]||'../WWB-HOST');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8'),write=(rel,data)=>fs.writeFileSync(path.join(root,rel),data),stage=(n,rel)=>cp.execFileSync('git',['show',':'+n+':'+rel],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
function conflicts(rel,choose){const s=read(rel);write(rel,s.replace(/^<<<<<<< .*\r?\n([\s\S]*?)^=======\r?\n([\s\S]*?)^>>>>>>> .*\r?\n/gm,(_,ours,theirs)=>choose(ours,theirs)));}
const saved=path.join(root,'tmp/merge-review-20261103');fs.mkdirSync(saved,{recursive:true});
const htmls=['hosts/ps5/index.html','hosts/ps5/gta5/index.html','hosts/ps5/other-games/index.html','hosts/ps5/payload-manager/index.html','hosts/ps5/rdr2/index.html'];
for(const rel of htmls){for(const n of [2,3])fs.writeFileSync(path.join(saved,rel.replaceAll('/','_')+'-stage'+n),stage(n,rel));write(rel,stage(2,rel));}
function merge(base,ours,theirs){if(JSON.stringify(ours)===JSON.stringify(base))return theirs;if(JSON.stringify(theirs)===JSON.stringify(base))return ours;if(ours&&theirs&&!Array.isArray(ours)&&!Array.isArray(theirs)&&typeof ours==='object'&&typeof theirs==='object'){const result={...theirs};for(const key of Object.keys(ours))result[key]=key in theirs?merge(base?.[key],ours[key],theirs[key]):ours[key];return result;}return ours;}
write('docs/migration/status.json',JSON.stringify(merge(JSON.parse(stage(1,'docs/migration/status.json')),JSON.parse(stage(2,'docs/migration/status.json')),JSON.parse(stage(3,'docs/migration/status.json'))),null,2)+'\n');
conflicts('assets/host-dashboard.js',(ours,theirs)=>{
 const local=ours.match(/if\(first\.localLauncher\)return[\s\S]*?;if\(category==='loaders'/)?.[0].replace(/;if\(category==='loaders'$/,';');if(!local)throw Error('Local family control missing');return theirs.replace("var first=group.actions[0];","var first=group.actions[0];"+local);
});
let dashboard=read('assets/host-dashboard.js');dashboard=dashboard.replace('a.category===\'loaders\'&&a.browserHost','a.category===\'loaders\'&&(a.browserHost||a.localLauncher)');
write('assets/host-dashboard.js',dashboard);
conflicts('scripts/host-project-pages.cjs',(ours,theirs)=>ours.includes('runtime landing presentation')?ours.replace("'/host-project-map.js\"></script><script src=\"'+BASE+'/assets/host-project-routing.js\"></script>'","'/host-runtime-map.js?v='+revision+'\"></script><script src=\"'+BASE+'/assets/host-project-routing.js?v=2\"></script>'"):theirs);
let publisher=read('scripts/host-project-pages.cjs');publisher=publisher.replace('host-karo-builds\\.js|i18n\\.js','host-karo-builds\\.js|host-local-launcher\\.js|afterglow-public-launcher\\.js|i18n\\.js').replaceAll('20261103p3','20261103final1');write('scripts/host-project-pages.cjs',publisher);
conflicts('scripts/verify-host-project-pages.cjs',(_ours,theirs)=>theirs.replace('/<h1>Choose your console\\.<\\/h1>/','/<h1>Choose your console\\.?<\\/h1>/'));
conflicts('scripts/tests/host-local-tools.test.cjs',(_ours,theirs)=>theirs);
console.log('Resolved publisher/dashboard/metadata/source-page conflicts; i18n remains assigned to its owner.');
