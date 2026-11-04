'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),target=path.resolve(process.argv[2]||'../WWB-HOST');
function edit(rel,fn){const file=path.join(target,rel),old=fs.readFileSync(file),next=fn(old.toString());if(next===old.toString())return;const saved=path.join(target,'docs/migration/retained-presentation-sources',rel.replaceAll('/','_')+'-'+crypto.createHash('sha256').update(old).digest('hex'));fs.mkdirSync(path.dirname(saved),{recursive:true});if(!fs.existsSync(saved))fs.writeFileSync(saved,old,{flag:'wx'});fs.writeFileSync(file,next);}
edit('scripts/tests/afterglow.test.cjs',s=>{
 const begin=s.indexOf(" for(const page of ['firmware','afterglow'])"),end=s.indexOf('\n});',begin);
 if(begin>=0&&end>=0)s=s.slice(0,begin)+` for(const page of ['firmware','afterglow']){const raw=read('hosts/ps4/'+page+'/index.html'),html=require('../host-ads.cjs').apply('hosts/ps4/'+page+'/index.html',raw,{base:'/WWB-HOST'});assert.match(html,/BEGIN WWB HOST AD/);assert.match(html,/Advertisement/);assert.doesNotMatch(html,/<(?:video|iframe)\\b/);}
 const groups=require('../host-compact-pages.cjs').groups(root),route=groups.find(r=>r.id==='ps4-afterglow');assert.deepEqual(route.firmwares,['13.52','14.00']);assert.equal(groups.filter(r=>r.platform==='ps4'&&r.firmwares.includes('14.00')).length,1);assert.equal(route.firmwares.includes('13.51'),false);
 const action=require('../build-host-selector.cjs').hostActions('ps4').find(a=>a.id==='local-ps4-afterglow');assert.deepEqual(action.firmwares,['13.52','14.00']);assert.equal(action.run,undefined);assert.equal(require('../build-host-selector.cjs').hostActions('ps5').some(a=>a.id==='local-ps4-afterglow'),false);`+s.slice(end);
 const start=s.indexOf("test('firmware folders cover"),stop=s.indexOf("test('landing gains",start);
 if(start>=0&&stop>=0)s=s.slice(0,start)+`test('firmware families preserve exact supported sets behind local full-page buttons',()=>{
 const html=read('hosts/ps4/firmware/index.html'),groups=require('../host-compact-pages.cjs').groups(root).filter(r=>r.platform==='ps4');
 assert.equal((html.match(/class="host-firmware-family"/g)||[]).length,groups.length);
 assert.match(html,/class="host-taskbar"/);assert.doesNotMatch(html,/id="sidebar"|<header class="guide-hero">|<select\\b/);
 for(const r of groups){assert.ok(html.includes('href="'+r.entry+'"'),r.id);assert.ok(html.includes('data-firmwares="'+r.firmwares.join(',')+'"'));}
 assert.match(read('assets/host-firmware-families.js'),/navigator.userAgent/);
});

`+s.slice(stop);
 return s;
});
edit('scripts/tests/host-local-tools.test.cjs',s=>s.replace("if(name.includes('esp-flasher'))assert.doesNotMatch(html,/<img\\b/i);","if(name.includes('esp-flasher')){for(const image of html.matchAll(/<img\\b[^>]*src=\"([^\"]+)\"/gi))assert.ok(image[1].startsWith('/assets/images/'),'Only local authored heading artwork belongs on this page');}"));
edit('scripts/build-ps4-firmware.cjs',s=>s.includes("require('./host-compact-pages.cjs').build(root)")?s:s.replace(' return {versions:versions.length,routes:routes.length};'," require('./host-compact-pages.cjs').build(root);\n require('./build-afterglow-public-launcher.cjs').build(root);\n return {versions:versions.length,routes:routes.length};"));
console.log('Updated legacy presentation expectations and preserved native guard assertions.');
