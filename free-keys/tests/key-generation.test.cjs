const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../key.js'), 'utf8');
const config = fs.readFileSync(path.join(__dirname, '../access-key-config.js'), 'utf8');

async function run({brand = 'scooby', product = '', grant = true, verify = false, rejected = false, blocked = false} = {}) {
  const elements = new Map(), calls = [], storage = new Map();
  const node = id => {
    if (!elements.has(id)) elements.set(id, {textContent:'', disabled:true, style:{}, offsetHeight:10, offsetWidth:10,
      classList:{add(){},remove(){},toggle(){return true;}}, addEventListener(){}, replaceChildren(){},
      setAttribute(){}, closest(){return null;}, insertAdjacentElement(){}});
    return elements.get(id);
  };
  if (grant) storage.set(`scooby_one_time_grant_${brand}`, JSON.stringify({product:brand,token:'fixture-grant',issuedAt:Date.now()-1000,expiresAt:Date.now()+60000}));
  const sessionStorage = {getItem:k=>storage.get(k),removeItem:k=>storage.delete(k),setItem:(k,v)=>storage.set(k,v)};
  const url = new URL(`https://website.test/free-keys/${brand}/?grant=fixture-grant&product=${encodeURIComponent(product)}`);
  const context = {URL,URLSearchParams,Date,AbortController,clearTimeout,console,sessionStorage,localStorage:sessionStorage,
    navigator:{clipboard:{writeText:async()=>{}}},document:{body:{dataset:{brand}},getElementById:node,addEventListener(){},activeElement:null},
    location:{href:url.href,search:url.search,replace(){}},history:{replaceState(){}},addEventListener(){},
    freeKeyAccess:{requireClear:()=> blocked ? new Promise(()=>{}) : Promise.resolve()},
    setInterval(){},setTimeout(fn,ms){if(ms===850)fn();return 1;},getComputedStyle:()=>({display:'block',visibility:'visible'}),
    turnstile:{render(host,options){options.callback('fixture-verification');}},
    fetch:async(url,options={})=>{
      calls.push({url,options,body:options.body ? JSON.parse(options.body):null});
      let payload;
      if(url.includes('loader-download.json')) payload={url:'https://filego.at/bucket/fixture'};
      else if(url.includes('/access-key-policies/')) payload={success:true,policy:{integration_id:'fixture-integration'}};
      else if(url.endsWith('/access-keys/challenge')) payload={success:true,challenge:{id:'fixture-challenge',turnstile_required:verify,site_key:'fixture-site'}};
      else if(url.endsWith('/access-keys/issue')) payload=rejected ? {success:false,message:'Fixture rejected'} : {success:true,key:'fixture-issued-key',expires_at:new Date(Date.now()+14400000).toISOString()};
      else throw new Error(`Unexpected request: ${url}`);
      return {ok:true,json:async()=>payload};
    }};
  context.window=context;
  vm.createContext(context);
  vm.runInContext(config,context);
  vm.runInContext(source,context);
  await new Promise(setImmediate);
  return {calls,node,storage};
}

test('Scooby generation always uses allfree, including old game links',async()=>{
  for(const product of ['', 'gta5','rdr2','cs2','gmod','fivem','spoofer','l4d','sbox','tlou','tf2','megabonk']){
    const {calls,node,storage}=await run({product});
    const metadata=calls.find(c=>c.url.includes('/access-key-policies/'));
    assert.ok(metadata.url.endsWith('/allfree'));
    const challenge=calls.find(c=>c.url.endsWith('/access-keys/challenge'));
    assert.deepEqual(challenge.body,{policy_slug:'allfree',integration_id:'fixture-integration'});
    const issued=calls.find(c=>c.url.endsWith('/access-keys/issue'));
    assert.deepEqual(issued.body,{challenge_id:'fixture-challenge',turnstile_token:''});
    assert.equal(node('keyOutput').textContent,'fixture-issued-key');
    assert.equal(node('copyButton').disabled,false);
    assert.equal(storage.has('scooby_one_time_grant_scooby'),false);
  }
});
test('required verification token is passed to issuance',async()=>{
  const {calls}=await run({verify:true});
  assert.equal(calls.find(c=>c.url.endsWith('/access-keys/issue')).body.turnstile_token,'fixture-verification');
});
test('bare key page cannot request a key',async()=>{
  const {calls}=await run({grant:false});
  assert.equal(calls.length,0);
});
test('server rejection keeps copying disabled',async()=>{
  const {node}=await run({rejected:true});
  assert.equal(node('keyOutput').textContent,'KEY UNAVAILABLE');
  assert.equal(node('copyButton').disabled,true);
});
test('Nenyoo keeps its separate policy and portal',async()=>{
  const scooby=await run();
  const nenyoo=await run({brand:'nenyoo',product:'nenyoo-fivem'});
  const metadata=nenyoo.calls.find(c=>c.url.includes('/access-key-policies/'));
  assert.ok(metadata.url.endsWith('/nenyfree'));
  assert.notEqual(metadata.url.split('/')[6],scooby.calls.find(c=>c.url.includes('/access-key-policies/')).url.split('/')[6]);
});

test('blocked ads pause key issuance without discarding the running flow',async()=>{
  const {calls}=await run({blocked:true});
  assert.equal(calls.length,0);
});
