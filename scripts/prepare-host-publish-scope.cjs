'use strict';
const fs=require('node:fs'),path=require('node:path'),target=path.resolve(process.argv[2]||'../WWB-HOST');
const ignoreFile=path.join(target,'.gitignore');let ignore=fs.readFileSync(ignoreFile,'utf8');for(const pattern of ['/docs/.console-expansion-private-inventory/','/docs/host-goldhen-current-private-inventory.json','/docs/host-compact-download-inventory.json','/docs/host-game-patch-file-import.json'])if(!ignore.split(/\r?\n/).includes(pattern))ignore+='\n'+pattern+'\n';fs.writeFileSync(ignoreFile,ignore);
const file=path.join(target,'scripts/host-project-pages.cjs');let text=fs.readFileSync(file,'utf8');
text=text.replace('const selected=all.filter(p=>!/^docs\\/','const selected=all.filter(p=>!/^docs\\/(?:host-goldhen-current-private-inventory|host-compact-download-inventory|host-game-patch-file-import)\\.json$/i.test(p)&&!/^docs\\/');
const line="  if(/^hosts\\/(?!runtime\\/).+\\.html$/.test(name))text=text.replace('</head>','<link rel=\"stylesheet\" href=\"/assets/host-compact.css?v=1\"></head>');";
text=text.replace(line+'\n'+line,line);fs.writeFileSync(file,text);
console.log('Private inventories retained locally and excluded from staging/deployment; duplicate compact stylesheet removed.');
