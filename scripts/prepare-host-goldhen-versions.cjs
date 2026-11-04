'use strict';
// Evidence from preserved host files only. Never downloads or evaluates a payload.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function build(root=path.resolve(__dirname,'..')){
 const b=JSON.parse(fs.readFileSync(path.join(root,'docs/host-reviews/karo/build.json'))),inv=JSON.parse(fs.readFileSync('F:/whatsite-backup-downloads-etc/download-inventory.json'));
 const archive=inv.items.flatMap(i=>(i.files||[]).map(f=>({...f,source:i.url,release:i.release}))),actions=[],evidence=[],skipped=[],keys=new Set();
 for(const d of b.downloads.filter(d=>d.format==='BIN'&&!d.invalid&&/goldhen/i.test(d.name))){
  const m=d.name.match(/^goldhen_([0-9][a-z0-9.]*)_([0-9]{3,4})\.bin$/i);if(!m){skipped.push({file:d.path,reason:'No separate unambiguous numeric version and firmware label; retained in original host.'});continue;}
  const firmware=(Number(m[2].slice(0,-2))+'.'+m[2].slice(-2)),entry=b.entries.find(e=>e.path===d.folder+'/index.html'&&e.platform==='ps4'&&(e.firmwares||[]).includes(firmware));
  if(!entry){skipped.push({file:d.path,reason:'Filename firmware is not separately confirmed by this exact source entry.'});continue;}
  const key=firmware+'|'+d.sha256;if(keys.has(key))continue;
  const local=path.join(root,d.url),archived=archive.find(f=>f.sha256===d.sha256&&(f.bytes===d.bytes||f.size===d.bytes));
  const archivePath=archived?.path||archived?.backupPath;
  if(!fs.existsSync(local)||!archivePath||!fs.existsSync(archivePath)){skipped.push({file:d.path,reason:'A ready file or matching local archive bytes are unavailable.'});continue;}
  if(hash(fs.readFileSync(local))!==d.sha256||hash(fs.readFileSync(archivePath))!==d.sha256)throw Error('Preserved GoldHEN mismatch '+d.path);
  keys.add(key);const id='ps4-goldhen-retained-'+firmware.replace('.','-')+'-'+d.sha256.slice(0,12);
  actions.push({id,platform:'ps4',category:'goldhen',label:'GoldHEN '+m[1]+' · '+firmware,version:m[1],firmwares:[firmware],format:'BIN',downloadURL:d.url,downloadOnDevice:true,bytes:d.bytes,sha256:d.sha256,image:'/assets/images/console-software/goldhen.png',source:d.sourceURL,instructionsURL:'/hosts/ps4/exploit/'+entry.id+'/',requirements:['Preserved source-labelled GoldHEN '+m[1]+' BIN for PS4 '+firmware+'.','Use the original firmware-matching host or its documented loader. Downloading this file does not launch a jailbreak; no new generic sender ABI is asserted.','This is a retained older version. Source label and byte identity are recorded; no console execution was performed.']});
  evidence.push({id,version:m[1],firmware,entry:entry.path,source:d.sourceURL,sourceCommit:b.commit,local:d.url,bytes:d.bytes,sha256:d.sha256,archivePath,exactFileAndArchiveVerified:true});
 }
 const report={updatedAt:new Date().toISOString(),source:'https://github.com/KAR0218/KAR0218.github.io',commit:b.commit,actions,evidence,skipped,officialReferences:['https://github.com/GoldHEN/GoldHEN/releases/tag/2.3','https://github.com/GoldHEN/GoldHEN/releases'],compatibilityMethod:'Filename version/firmware labels intersected with exact original entry firmware metadata; every selected ready BIN rehashed in both current runtime and F archive. No compatibility inferred from a family label.',newFilesDownloaded:0,nativeExecution:false};
 fs.writeFileSync(path.join(root,'docs/host-goldhen-retained-versions.json'),JSON.stringify(report,null,2)+'\n');return {actions:actions.length,firmwares:[...new Set(actions.map(a=>a.firmwares[0]))],skipped:skipped.length};
}
if(require.main===module)console.log(JSON.stringify(build()));module.exports={build};
