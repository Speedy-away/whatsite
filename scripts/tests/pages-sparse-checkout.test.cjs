'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const builder=require(process.env.PAGES_BUILDER||'../build-pages.cjs');
test('sparse deployment reads unfetched file sizes and materializes exact filenames without fetching excluded downloads',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'pages-sparse-'));
  const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['pipe','pipe','pipe']});
  try{
    git('init','-b','main');git('config','user.name','Pages Test');git('config','user.email','pages-test@localhost');
    const files={'index.html':'<html>Home</html>','console/ps4/index.html':'<html>PS4 source</html>','docs/i18n/page-translations.json':JSON.stringify({pages:[{page:'console/ps4/index.html'}]}),'docs/host-actions-ps4.json':'{"actions":[]}','scripts/keep.cjs':'// source','i18n-tools/transfer-guide-source.json':'{"ps4Title":"PS4 file transfer guide"}','downloads/archive.bin':'retained only in repository','downloads/Old [1] & test.bin':'exact bytes'};
    for(const [name,bytes]of Object.entries(files)){fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),bytes);}
    git('add','.');git('commit','-m','fixture');git('sparse-checkout','set','docs','scripts');
    assert.equal(fs.existsSync(path.join(root,'downloads/archive.bin')),false);
    builder.materializeLocaleSources(root);
    assert.equal(fs.existsSync(path.join(root,'i18n-tools/transfer-guide-source.json')),true);
    assert.equal(fs.readFileSync(path.join(root,'console/ps4/index.html'),'utf8'),'<html>PS4 source</html>');
    assert.equal(fs.existsSync(path.join(root,'downloads/archive.bin')),false);
    const tree=builder.treeFiles(root),result=builder.plan(root,tree.names,'a'.repeat(40),tree.sizes);
    assert.equal(tree.sizes.get('downloads/archive.bin'),Buffer.byteLength(files['downloads/archive.bin']));
    result.offloaded.set('downloads/archive.bin','https://example.com/preserved');
    builder.materialize(root,result);
    assert.equal(fs.existsSync(path.join(root,'i18n-tools/transfer-guide-source.json')),true);
    assert.equal(fs.existsSync(path.join(root,'downloads/archive.bin')),false);
    assert.equal(fs.readFileSync(path.join(root,'downloads/Old [1] & test.bin'),'utf8'),'exact bytes');
    assert.equal(fs.existsSync(path.join(root,'scripts/keep.cjs')),true);
    assert.ok(git('ls-files').includes('downloads/archive.bin'));
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});
