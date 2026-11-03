'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {loadTree}=require('../prepare-pages-tree.cjs');
test('a truncated recursive tree is completed from subtrees without requesting file blobs',async()=>{
  const sha='a'.repeat(40),sub='b'.repeat(40),calls=[];
  const request=async url=>{calls.push(url);let data;
    if(url.endsWith(sha+'?recursive=1'))data={truncated:true,tree:[]};
    else if(url.endsWith(sha))data={truncated:false,tree:[{path:'index.html',type:'blob',size:20},{path:'downloads',type:'tree',sha:sub}]};
    else if(url.endsWith(sub+'?recursive=1'))data={truncated:false,tree:[{path:'big.zip',type:'blob',size:100000000}]};
    else throw Error('Unexpected blob or tree request');return {ok:true,json:async()=>data};
  };
  const result=await loadTree({repo:'owner/repo',revision:sha,request});assert.deepEqual(result.files,[{name:'downloads/big.zip',bytes:100000000},{name:'index.html',bytes:20}]);assert.equal(calls.length,3);assert.ok(calls.every(url=>!url.includes('/blobs/')));
});
test('the sparse planner accepts file sizes without any local Git repository or missing binary',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'pages-tree-')),file=path.join(root,'sizes.json'),before=process.env.PAGES_TREE_MANIFEST,sha=process.env.GITHUB_SHA;
  try{fs.writeFileSync(file,JSON.stringify({revision:'c'.repeat(40),files:[{name:'downloads/missing.zip',bytes:100000000}]}));process.env.PAGES_TREE_MANIFEST=file;delete process.env.GITHUB_SHA;const result=require('../build-pages.cjs').treeFiles(root);assert.equal(result.sizes.get('downloads/missing.zip'),100000000);assert.equal(fs.existsSync(path.join(root,'downloads/missing.zip')),false);}
  finally{if(before===undefined)delete process.env.PAGES_TREE_MANIFEST;else process.env.PAGES_TREE_MANIFEST=before;if(sha!==undefined)process.env.GITHUB_SHA=sha;fs.rmSync(root,{recursive:true,force:true});}
});
