'use strict';
// Validate captured bytes and finish authored navigation only. Never import native modules.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),stage=path.join(root,'tmp/host-ps5-relapse-review/staged'),base='hosts/runtime/ps5-webkit-dd8e4e0914c5',dir=path.join(stage,base);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);}
const b=JSON.parse(fs.readFileSync(path.join(dir,'build.json')));
for(const f of b.sourceFiles){const bytes=fs.readFileSync(path.join(dir,f.path));if(bytes.length!==f.bytes||hash(bytes)!==f.sha256)throw Error('Captured source changed '+f.path);}
const guardFile=path.join(dir,'guard.js');let guard=fs.readFileSync(guardFile,'utf8');
if(!guard.includes('function exactRunPath')){
 guard=guard.replace('  function install(doc, win, explicitConfig) {',`  function exactRunPath(win, value) {
    var match = String(win.location.pathname).match(/^(\\/(?:WWB-HOST\\/)?hosts\\/runtime\\/ps5-webkit-dd8e4e0914c5\\/)(?:index\\.html|web\\/index\\.html)?$/);
    if (!match) throw Error('Invalid local entry path');
    var expected = match[1] + 'web/index.html', declared = new URL(value, win.location.href);
    var unprefixed = expected.replace(/^\\/WWB-HOST/, '');
    if (declared.origin !== win.location.origin || declared.search || declared.hash || (declared.pathname !== expected && declared.pathname !== unprefixed)) throw Error('Invalid local run path');
    return expected;
  }
  function install(doc, win, explicitConfig) {`);
 guard=guard.replace("    if (config.mode === 'entry') {","    try { config = {mode:config.mode,runPath:exactRunPath(win,config.runPath)}; } catch (_) { clearTicket(); tell('The local entry path is invalid. Nothing was started.'); return false; }\n    if (config.mode === 'entry') {");
 guard=guard.replace('return {firmwares:firmwareList,','return {exactRunPath:exactRunPath,firmwares:firmwareList,');
 fs.writeFileSync(guardFile,guard);
}
let landing=fs.readFileSync(path.join(dir,'index.html'),'utf8').replace('Start PS5 WebKit exploit','Load exploit').replace('Press Start','Press Load');fs.writeFileSync(path.join(dir,'index.html'),landing);
b.verified={staticDependencies:true,hardwareExecution:false,downloadedCodeExecuted:false,prefixGuard:true};
b.files=walk(dir).filter(f=>path.basename(f)!=='build.json').map(f=>({path:path.relative(dir,f).replaceAll('\\','/'),bytes:fs.statSync(f).size,sha256:hash(fs.readFileSync(f))}));
fs.writeFileSync(path.join(dir,'build.json'),JSON.stringify(b,null,2)+'\n');
const files=new Map(walk(dir).map(f=>[path.relative(dir,f).replaceAll('\\','/'),fs.readFileSync(f)])),bytes=require('./package-console-payload-sender.cjs').zip(files,{prefix:'ps5-webkit/'}),sha256=hash(bytes),local='downloads/hosts/ps5-webkit/ps5-webkit-dd8e4e0914c5-'+sha256.slice(0,12)+'.zip';
const dest=path.join(stage,local);if(fs.existsSync(dest)&&hash(fs.readFileSync(dest))!==sha256)throw Error('Different ready ZIP exists');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);
const report={...b,base,bundle:{local:'/'+local,bytes:bytes.length,sha256},jobs:[{id:'ps5-webkit-'+sha256.slice(0,12),title:'PS5 WebKit Exploit 7.00–13.60 ready web host',project:'Relapse Exploit',platform:'PS5',category:['Hosts'],archiveRole:['Builds'],version:b.source.commit+'-'+sha256.slice(0,12),url:b.source.repository+'/tree/'+b.source.commit,importPath:local,local:'/'+local,filename:path.basename(local),bytes:bytes.length,sha256}],nativeFilesChanged:0};
fs.writeFileSync(path.join(root,'docs/ps5-webkit-build.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({files:b.sourceFiles.length,firmwares:b.firmwares.length,bundle:report.bundle}));
