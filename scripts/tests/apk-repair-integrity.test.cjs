'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),{manifestInfo}=require('../apk-manifest-info.cjs');
test('recovered APKs retain verified package/version identities and size/SHA-256 in the private archive',()=>{
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'docs/apk-app-catalog.json'))),inventory=JSON.parse(fs.readFileSync(path.join(root,'docs/apk-tv-repairs-private-inventory.json')));
 for(const app of catalog.apps.filter(a=>a.repair)){
  const record=inventory.items.flatMap(i=>i.files).find(f=>f.sha256===app.file.sha256);assert.ok(record,app.id);
  const bytes=fs.readFileSync(record.backupPath);assert.equal(bytes.length,app.file.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),app.file.sha256);
  assert.deepEqual(manifestInfo(bytes),app.repair.manifest);assert.equal(record.sourceUrl,app.downloadURL);
 }
 assert.throws(()=>manifestInfo(Buffer.alloc(30)),/ZIP directory missing/);
});
