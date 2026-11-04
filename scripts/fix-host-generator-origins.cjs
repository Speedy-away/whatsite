'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(process.argv[2]||'../WWB-HOST');
for(const [file,from,to] of [
 ['scripts/prepare-host-goldhen-versions.cjs',"instructionsURL:'/hosts/ps4/exploit/'+entry.id+'/'","instructionsURL:'/hosts/karo/?entry='+entry.id+'#loader'"],
 ['scripts/prepare-host-menu-companions.cjs',"url:'https://speedy-away.github.io/WWB-HOST/'+immutable","url:'https://speedy-away.github.io/wwb-host/'+immutable"]
]){const p=path.join(root,file),old=fs.readFileSync(p,'utf8');if(!old.includes(from))throw Error('Expected generator field missing: '+file);fs.writeFileSync(p,old.replace(from,to));}
const file=path.join(root,'scripts/tests/host-goldhen-native-catalog.test.cjs');let s=fs.readFileSync(file,'utf8');s=s.replace("assert.ok(j.url.startsWith('https://speedy-away.github.io/WWB-HOST/downloads/helpers/console-download-receivers/'))","assert.ok(/^https:\\/\\/speedy-away\\.github\\.io\\/(?:WWB-HOST|wwb-host)\\/downloads\\/helpers\\/console-download-receivers\\//.test(j.url))");s+="\ntest('new receiver job URLs use the working canonical Pages address',()=>{assert.match(fs.readFileSync(path.join(root,'scripts/prepare-host-menu-companions.cjs'),'utf8'),/url:'https:\\/\\/speedy-away\\.github\\.io\\/wwb-host\\/'/);});\n";fs.writeFileSync(file,s);
console.log('Future generators use the merged local routes and canonical Pages address; immutable source records stay preserved.');
