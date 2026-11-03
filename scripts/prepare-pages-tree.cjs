'use strict';
// Read GitHub tree metadata, never archive/blob contents, to plan a sparse build.
const fs=require('node:fs');
async function loadTree({repo,revision,token,request=fetch,api='https://api.github.com'}){
  if(!/^[\w.-]+\/[\w.-]+$/.test(repo)||!/^[a-f0-9]{40}$/.test(revision)||api!=='https://api.github.com')throw Error('Invalid Pages repository metadata request');
  const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(token?{Authorization:'Bearer '+token}:{})};
  async function get(sha,recursive){const r=await request(api+'/repos/'+repo+'/git/trees/'+sha+(recursive?'?recursive=1':''),{headers,signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('GitHub tree metadata HTTP '+r.status);return r.json();}
  const files=[];
  function add(tree,prefix){for(const e of tree)if(e.type==='blob'){if(!Number.isSafeInteger(e.size)||e.size<0)throw Error('Missing file size in GitHub tree');files.push({name:prefix+e.path,bytes:e.size});}}
  async function walk(sha,prefix){const recursive=await get(sha,true);if(!recursive.truncated){add(recursive.tree,prefix);return;}
    const direct=await get(sha,false);if(direct.truncated)throw Error('Truncated non-recursive GitHub tree');add(direct.tree,prefix);
    for(const entry of direct.tree.filter(e=>e.type==='tree'))await walk(entry.sha,prefix+entry.path+'/');
  }
  await walk(revision,'');files.sort((a,b)=>a.name.localeCompare(b.name));return {revision,files};
}
async function main(){const report=await loadTree({repo:process.env.GITHUB_REPOSITORY,revision:process.env.GITHUB_SHA,token:process.env.GH_TOKEN});fs.writeFileSync(process.argv[2],JSON.stringify(report));console.log('Read sizes for '+report.files.length+' repository files without downloading their blobs.');}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={loadTree};
