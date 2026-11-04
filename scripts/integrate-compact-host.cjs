'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=path.resolve(__dirname,'..'),target=path.resolve(process.argv[2]||'../WWB-HOST'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);}
function preserve(file,bytes){if(fs.existsSync(file)){if(!fs.readFileSync(file).equals(bytes))throw Error('Refusing different immutable bytes '+file);return;}fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes,{flag:'wx'});}
function write(relative,text){const file=path.join(target,relative),bytes=Buffer.isBuffer(text)?text:Buffer.from(text);if(fs.existsSync(file)){const old=fs.readFileSync(file);if(old.equals(bytes))return;preserve(path.join(target,'docs/migration/retained-compact-sources',relative.replaceAll('/','_')+'-'+sha(old)),old);}fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
function patch(relative,change){const file=path.join(target,relative);write(relative,change(fs.readFileSync(file,'utf8')));}
for(const relative of ['assets/host-self-host.js','assets/host-self-host.css','assets/host-local-launcher.js','assets/afterglow-public-launcher.js','assets/host-firmware-families.js','assets/host-compact.css','scripts/host-self-host-popup.cjs','scripts/host-compact-pages.cjs','scripts/host-local-launchers.cjs','scripts/prepare-gamerhack-local.cjs','scripts/build-afterglow-public-launcher.cjs','scripts/tests/host-self-host-popup.test.cjs','scripts/tests/host-local-launchers.test.cjs','scripts/tests/gamerhack-local-build.test.cjs','scripts/tests/afterglow-public-launcher.test.cjs','docs/host-gamerhack-local-route-review.json','docs/host-gamerhack-local-build.json','docs/ps5-webkit-build.json'])write(relative,fs.readFileSync(path.join(source,relative)));
const gamer=JSON.parse(fs.readFileSync(path.join(source,'docs/host-gamerhack-local-build.json')));
for(const f of walk(path.join(source,gamer.base)))preserve(path.join(target,path.relative(source,f)),fs.readFileSync(f));
for(const relative of gamer.groups.map(g=>g.entry.replace(/^\//,'')))for(const f of walk(path.join(source,relative))){const dest=path.join(target,path.relative(source,f));if(!fs.existsSync(dest))preserve(dest,fs.readFileSync(f));}
preserve(path.join(target,gamer.bundle.local.slice(1)),fs.readFileSync(path.join(source,gamer.bundle.local.slice(1))));
const ps5=JSON.parse(fs.readFileSync(path.join(source,'docs/ps5-webkit-build.json'))),stage=path.join(source,'tmp/host-ps5-relapse-review/staged');
for(const f of walk(path.join(stage,ps5.base)))preserve(path.join(target,path.relative(stage,f)),fs.readFileSync(f));
preserve(path.join(target,ps5.bundle.local.slice(1)),fs.readFileSync(path.join(stage,ps5.bundle.local.slice(1))));
require(path.join(target,'scripts/host-local-launchers.cjs')).build({root:target});
patch('scripts/build-host-selector.cjs',s=>{if(s.includes("host-compact-pages.cjs').actions"))return s;return s.replace("  return require('./ps4-browser-hosts.cjs').prepare(","  return require('./host-compact-pages.cjs').actions(root,platform,require('./ps4-browser-hosts.cjs').prepare(").replace(".map(require('./host-first-party-navigation.cjs').bind).filter(Boolean);",".map(require('./host-first-party-navigation.cjs').bind).filter(Boolean));");});
patch('assets/host-dashboard.js',s=>{
 s=s.replace('&& firmwareMatches(action, firmware) && words.every','&& (action.localLauncher || firmwareMatches(action, firmware)) && words.every');
 s=s.replace('[data-catalog-game],[data-catalog-update],[data-choose-group],[data-launch]','[data-catalog-game],[data-catalog-update],[data-choose-group],[data-launch],.host-firmware-family');
 if(!s.includes('first.localLauncher)return'))s=s.replace("var first=group.actions[0];if(category==='loaders'", "var first=group.actions[0];if(first.localLauncher)return '<a class=\"host-firmware-family\" href=\"'+escape(navigationURL(first.launchURL))+'\"><strong>'+escape(first.firmwareLabel||group.label)+'</strong><span>Choose HEN / Load</span></a>';if(category==='loaders'");
 return s.replaceAll('Game mods','Mods / Mod Menus');
});
patch('assets/host-folders.js',s=>{
 s=s.replace("firmwareControl.hidden=selected==='sender';","firmwareControl.hidden=selected!=='connection';").replaceAll('Game mods','Mods / Mod Menus');
 if(!s.includes('host-trainer-shortcut'))s=s.replace(" library.hidden=", " if(selected==='mods'&&platform==='ps4'){var trainer=document.createElement('a');trainer.className='host-trainer-shortcut';trainer.href='/hosts/tools/ps4-trainer/';trainer.innerHTML='<img src=\"/assets/images/home/ps4-offline-trainer-cover-v1.jpg\" width=\"144\" height=\"90\" alt=\"\"><span><strong>PS4 Offline Trainer</strong><span>Browse games and exact updates →</span></span>';library.parentNode.insertBefore(trainer,library);}\n library.hidden=");
 return s;
});
patch('scripts/host-folder-markup.cjs',s=>s.replaceAll('Game mods','Mods / Mod Menus').replace("['?view=tools','Tools'],","['?view=tools','Tools'],['patches/','Game patches'],").replace("const primaryCount=platform==='ps4'?5:4;","const primaryCount=platform==='ps4'?6:5;"));
// Public bridge now opens the existing genuine local picker, never the old prose guide.
patch('scripts/build-afterglow-public-launcher.cjs',s=>s.replaceAll('Afterglow · PS4 13.52 / 14.00','PS4 WebKit Exploit - 13.52–14.00').replace('<h1>Afterglow</h1>','<h1>PS4 WebKit Exploit - 13.52–14.00</h1>').replace('Continue to Afterglow','Choose HEN').replace('local Afterglow launcher','local PS4 WebKit launcher'));
// Hook compact presentation into the current publisher without replacing shared routing fixes.
patch('scripts/host-project-pages.cjs',s=>{
 if(!s.includes('host-compact-pages.cjs\').apply'))s=s.replace("  // Prefix authored root-relative strings", "  if(name.endsWith('.html'))text=require('./host-compact-pages.cjs').apply(text,name,{root});\n  if((name==='index.html'||/^hosts\\/(?!runtime\\/).+\\.html$/.test(name))&&fs.existsSync(path.join(root,'assets/host-blue-theme.css')))text=text.replace('</head>','<link rel=\"stylesheet\" href=\"/assets/host-blue-theme.css?v=1\"></head>');\n  // Prefix authored root-relative strings");
 if(!s.includes("'runtime landing presentation'"))s=s.replace("if(runtime&&f.name.endsWith('.html')){text=", "if(runtime&&f.name.endsWith('.html')){\n    // 'runtime landing presentation': execution files and original native modules stay unchanged.\n    text=require('./host-compact-pages.cjs').apply(text,f.name,{base:BASE,root});\n    if(/^hosts\\/runtime\\/ps4-(?:900|psfree-700-960)\\/index\\.html$/.test(f.name))text=text.replace(/<script>document\\.getElementById\\(\"runtime-start\"\\)\\.onclick=[\\s\\S]*?<\\/script>/,'').replace('<p>GamerHack · GoldHEN</p>','<p>Local PSFree browser bootstrap · BIN listener</p>').replace('>Advanced BIN listener<','>Local browser runtime<');\n    text=");
 return s;
});
// Rebuilding the selector is scoped to the independent host only.
require(path.join(target,'scripts/build-host-selector.cjs')).buildHostSelector({hostOnly:true});
require(path.join(target,'scripts/host-compact-pages.cjs')).build(target);
require(path.join(target,'scripts/build-afterglow-public-launcher.cjs')).build(target);
console.log(JSON.stringify({target,localGroups:require(path.join(target,'scripts/host-compact-pages.cjs')).groups(target).length,ps5Firmwares:ps5.firmwares.length,nativeSourcesChanged:0}));
