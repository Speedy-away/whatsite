const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {EventEmitter} = require('node:events');
const bridge = require('../console-payload-bridge.cjs');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'whatsite-sender-test-'));
  fs.mkdirSync(path.join(root,'downloads/fixture'),{recursive:true});
  fs.mkdirSync(path.join(root,'hosts/ps5'),{recursive:true});
  fs.mkdirSync(path.join(root,'docs'),{recursive:true});
  fs.writeFileSync(path.join(root,'hosts/ps5/index.html'),'<h1>Fixture only</h1><a href="/docs/host-payload-sender.md">Instructions</a><a href="/hosts/ps4/">PS4</a>');
  fs.writeFileSync(path.join(root,'AGENTS.md'),'private workspace instructions');
  const elf = Buffer.alloc(80); Buffer.from([0x7f,0x45,0x4c,0x46]).copy(elf);
  const bin = Buffer.from([1,2,3,4]);
  fs.writeFileSync(path.join(root,'downloads/fixture/payload.elf'),elf);
  fs.writeFileSync(path.join(root,'downloads/fixture/menu.bin'),bin);
  const sha = data => crypto.createHash('sha256').update(data).digest('hex');
  const actions = [
    {id:'fixture-ps5',platform:'ps5',firmwares:['9.00'],format:'ELF',downloadURL:'/downloads/fixture/payload.elf',sha256:sha(elf),run:{type:'elf-http',port:9021}},
    {id:'fixture-mod',platform:'ps4',firmwares:['9.00'],gameVersion:'1.38',format:'BIN',downloadURL:'/downloads/fixture/menu.bin',sha256:sha(bin),run:{type:'goldhen-http',port:9090}}
  ];
  t.after(()=>fs.rmSync(root,{recursive:true,force:true})); // Only the exact mkdtemp test directory.
  return {root,elf,bin,actions};
}
async function startFixture(t, options) {
  const token = 'b'.repeat(64), setup = bridge.createBridge({...options,token});
  await new Promise(resolve=>setup.server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>setup.server.close(resolve)));
  const base = 'http://127.0.0.1:'+setup.server.address().port;
  async function request(route,body,headers = {}) {
    return fetch(base+route,{method:body ? 'POST':'GET',headers:{Origin:base,'X-Whatsite-Token':token,...(body ? {'Content-Type':'application/json'}:{}),...headers},...(body ? {body:JSON.stringify(body)}:{})});
  }
  return {...setup,base,request};
}
test('DNS targets are resolved once and every result must be a private IPv4',async()=>{
  let lookups = 0;
  assert.equal(await bridge.resolveConsoleAddress('ps5.local',async(name,options)=>{lookups++;assert.equal(name,'ps5.local');assert.equal(options.all,true);return [{family:4,address:'192.168.1.50'}];}),'192.168.1.50');
  assert.equal(lookups,1);
  for (const value of ['127.0.0.1','8.8.8.8','192.168.1.255','http://ps5.local','ps5.local:9021']) await assert.rejects(()=>bridge.resolveConsoleAddress(value));
  await assert.rejects(()=>bridge.resolveConsoleAddress('ps5.local',async()=>[{family:4,address:'192.168.1.50'},{family:4,address:'8.8.8.8'}]));
  await assert.rejects(()=>bridge.resolveConsoleAddress('ps5.local',async()=>[{family:6,address:'::1'}]));
});
test('curated files must be ready builds with an exact hash, extension, magic and approved transport',async t=>{
  const {root,actions,elf} = fixture(t), action = actions[0];
  assert.deepEqual((await bridge.readVerifiedFile(action,root)).data,elf);
  for (const change of [
    {downloadURL:'https://example.com/a.elf'}, {downloadURL:'/downloads/../AGENTS.md'}, {downloadURL:'/downloads/%2e%2e/AGENTS.md'},
    {downloadURL:'/downloads/fixture/payload.elf?x'}, {format:'RAR'}, {sha256:''}, {run:{type:'elf-tcp',port:9020}}, {run:{type:'ps5-manager',port:8084}}
  ]) assert.throws(()=>bridge.localFileFor({...action,...change},root));
  await assert.rejects(()=>bridge.readVerifiedFile({...action,sha256:'0'.repeat(64)},root),{code:'checksum-mismatch'});
  const invalid = Buffer.alloc(80); fs.writeFileSync(path.join(root,'downloads/fixture/payload.elf'),invalid);
  await assert.rejects(()=>bridge.readVerifiedFile({...action,sha256:crypto.createHash('sha256').update(invalid).digest('hex')},root),{code:'invalid-elf'});
});
test('static dashboard whitelist excludes arbitrary files, backups and traversal',()=>{
  for (const value of ['/hosts/ps5/','/hosts/ps4/index.html','/hosts/ps4/payload-manager/','/hosts/ps5/payload-manager/index.html','/assets/host-console-client.js','/assets/images/logo.png','/languages/fr.js','/languages/i18n.js','/style.css','/docs/host-actions-ps5.json']) assert.ok(bridge.staticPath(value),value);
  for (const value of ['/AGENTS.md','/.git/config','/scripts/console-payload-bridge.cjs','/assets/../AGENTS.md','/assets/%2e%2e/AGENTS.md','/assets//x.js','/assets/nested/secret.js','/docs/private.json','/console/ps3/index.html']) assert.equal(bridge.staticPath(value),null,value);
});

test('plugins and cheat data can be downloaded but never become raw payload actions', async t=>{
  const {root} = fixture(t);
  for (const format of ['PRX','SPRX','JSON','SHN','XML','MC4']) {
    const data = Buffer.from('download-only fixture');
    const local = '/downloads/fixture/file.' + format.toLowerCase();
    fs.writeFileSync(path.join(root,local),data);
    const action = {format,downloadURL:local,sha256:crypto.createHash('sha256').update(data).digest('hex'),platform:'ps5',run:{type:'elf-http',port:9021}};
    assert.equal(bridge.localFileFor(action,root,{forRun:false}).bytes,data.length);
    assert.throws(()=>bridge.localFileFor(action,root),{code:'unsupported-format'});
  }
});
test('bridge requires pairing and its own origin before any action or readable status',async t=>{
  const setup = fixture(t); let sent = 0;
  const {request} = await startFixture(t,{...setup,resolveAddress:async()=>{throw Error('Must not resolve');},sendELF:async()=>{sent++;}});
  let r = await request('/api/status',null,{'X-Whatsite-Token':''}); assert.equal(r.status,401);
  r = await request('/api/status',null,{Origin:'https://evil.example'}); assert.equal(r.status,403);
  r = await request('/api/status'); assert.equal(r.status,200);
  const status = await r.json(); assert.equal(status.status,'connected'); assert.equal(status.actions[0].available,true);
  assert.equal(status.protocolVersion,2);assert.deepEqual(status.capabilities,{serviceOverview:true,uncertainOutcomes:true});
  r = await request('/api/run',{actionId:'fixture-ps5',platform:'ps5',address:'192.168.1.50',firmware:'9.00'},{Origin:'null'}); assert.equal(r.status,403);
  assert.equal(sent,0);
});

test('read-only service inspection uses only fixed GET metadata routes without Origin spoofing',async()=>{
  const seen=[];
  const fetcher=async(url,init)=>{seen.push({url,init});return new Response(url.endsWith('/version')?'0.6.3':url.endsWith('/getip')?'192.168.1.50':url.endsWith('/status')?'{"status":"ready"}':url.endsWith('/get_download_state')?'[]':'<html><title>File manager</title></html>');};
  const ps5=await bridge.inspectConsoleServices('192.168.1.50','ps5',{fetcher});
  assert.equal(ps5.status,'connected');assert.equal(ps5.version,'0.6.3');assert.equal(ps5.reportedAddress,'192.168.1.50');
  assert.equal(ps5.firmware,undefined);assert.equal(ps5.activeGame,undefined);assert.equal(ps5.service,'payload-manager');
  assert.deepEqual(seen.map(s=>s.url),['http://192.168.1.50:8084/version','http://192.168.1.50:8084/getip','http://192.168.1.50:6701/get_download_state','http://192.168.1.50:8080/fs/','http://192.168.1.50:9090/']);
  assert.deepEqual(ps5.checks.map(check=>check.service),['payload-manager','downloader','files','ezremote']);
  assert.equal(ps5.checks[1].queueCount,0);assert.equal(ps5.checks[1].companionVerified,false);
  const ps4=await bridge.inspectConsoleServices('192.168.1.50','ps4',{fetcher});
  assert.equal(ps4.status,'connected');assert.equal(ps4.connection,'ready');assert.equal(ps4.version,null);assert.equal(ps4.reportedAddress,null);
  assert.deepEqual(seen.slice(5).map(s=>s.url),['http://192.168.1.50:9090/status','http://192.168.1.50:6701/get_download_state','http://192.168.1.50:8080/']);
  assert(seen.every(({init})=>init.method==='GET'&&init.redirect==='error'&&init.headers===undefined&&init.body===undefined&&init.signal));
});

test('service metadata failures and unknown values never become firmware or game detection',async()=>{
  const text=value=>new Response(value);
  const unknown=await bridge.inspectConsoleServices('192.168.1.50','ps5',{fetcher:async url=>text(url.endsWith('/version')?'0.6.3':'0.0.0.0')});
  assert.equal(unknown.status,'connected');assert.equal(unknown.reportedAddress,null);
  for(const fetcher of [async()=>({ok:false,status:403}),async()=>{throw Error('blocked');},async()=>text('<html>'),async()=>text('x'.repeat(2049))]){
    const out=await bridge.inspectConsoleServices('192.168.1.50','ps5',{fetcher});
    assert.equal(out.status,'unavailable');assert.equal(out.version,null);assert.equal(out.reportedAddress,null);assert.equal(out.firmware,undefined);
  }
  const streamed=await bridge.inspectConsoleServices('192.168.1.50','ps4',{fetcher:async()=>new Response('x'.repeat(2049))});
  assert.equal(streamed.status,'unavailable');assert.equal(streamed.code,'unexpected-response');
  const busy=await bridge.inspectConsoleServices('192.168.1.50','ps4',{fetcher:async()=>text('{"status":"busy"}')});
  assert.equal(busy.status,'connected');assert.equal(busy.connection,'busy');
  let calls=0;
  await assert.rejects(()=>bridge.inspectConsoleServices('127.0.0.1','ps4',{fetcher:async()=>{calls++;}}));
  await assert.rejects(()=>bridge.inspectConsoleServices('192.168.1.50','other',{fetcher:async()=>{calls++;}}));
  assert.equal(calls,0);
});

test('paired inspect route pins the LAN address and accepts no URL, port, path or payload request',async t=>{
  const setup=fixture(t), checks=[];let sends=0,resolves=0;
  const {request}=await startFixture(t,{...setup,resolveAddress:async input=>{resolves++;assert.equal(input,'ps5.local');return '192.168.1.50';},inspectServices:async(address,platform)=>{checks.push({address,platform});return {status:'connected',code:'manager-connected',message:'Read-only metadata.',service:'payload-manager',version:'0.6.3',reportedAddress:'192.168.1.50'};},sendELF:async()=>{sends++;},sendBIN:async()=>{sends++;}});
  const body={address:'ps5.local',platform:'ps5'};
  let r=await request('/api/inspect',body,{'X-Whatsite-Token':''});assert.equal(r.status,401);
  r=await request('/api/inspect',body,{Origin:'https://evil.example'});assert.equal(r.status,403);
  for(const changed of [{url:'http://192.168.1.50:80/'},{path:'/shutdown'},{port:80},{actionId:'fixture-ps5'},{platform:'other'}]){r=await request('/api/inspect',{...body,...changed});assert.equal(r.status,400);}
  assert.equal(checks.length,0);assert.equal(resolves,0);
  r=await request('/api/inspect',body);assert.equal(r.status,200);assert.equal((await r.json()).version,'0.6.3');
  assert.deepEqual(checks,[{address:'192.168.1.50',platform:'ps5'}]);assert.equal(resolves,1);assert.equal(sends,0);
});
test('sender uses only a curated action with matching platform, firmware and game update',async t=>{
  const setup = fixture(t); const sent = [];
  const {request} = await startFixture(t,{...setup,resolveAddress:async(address)=>{assert.equal(address,'192.168.1.50');return address;},sendELF:async(address,data)=>{sent.push({address,data});return {status:'sent',code:'elf-bytes-sent',message:'Bytes sent, execution not verified.'};},sendBIN:async(address,data)=>{sent.push({address,data});return {status:'accepted',code:'goldhen-accepted',message:'Accepted, check the game.'};}});
  const valid = {actionId:'fixture-ps5',platform:'ps5',address:'192.168.1.50',firmware:'9.00'};
  for (const changed of [{actionId:'unknown'},{platform:'ps4'},{firmware:'13.60'},{url:'https://evil.example/payload.elf'},{port:9020}]) {
    const r = await request('/api/run',{...valid,...changed}); assert.equal(r.status,400); assert.equal((await r.json()).status,'error');
  }
  assert.equal(sent.length,0);
  let r = await request('/api/run',valid); assert.equal(r.status,200); assert.equal((await r.json()).status,'sent'); assert.deepEqual(sent[0].data,setup.elf);
  r = await request('/api/run',{...valid,actionId:'fixture-mod',platform:'ps4'}); assert.equal((await r.json()).code,'game-version-mismatch');
  r = await request('/api/run',{...valid,actionId:'fixture-mod',platform:'ps4',gameVersion:'1.38'}); assert.equal((await r.json()).status,'accepted'); assert.deepEqual(sent[1].data,setup.bin);
});
test('file checksum failure prevents any network payload transfer',async t=>{
  const setup = fixture(t); let sends = 0;
  setup.actions[0].sha256 = '0'.repeat(64);
  const {request} = await startFixture(t,{...setup,resolveAddress:async()=> '192.168.1.50',sendELF:async()=>{sends++;}});
  const r = await request('/api/run',{actionId:'fixture-ps5',platform:'ps5',address:'192.168.1.50',firmware:'9.00'});
  assert.equal((await r.json()).code,'checksum-mismatch'); assert.equal(sends,0);
});
test('paired run reports uncertain transport outcomes without claiming failure or retrying',async t=>{
  const setup=fixture(t);let sends=0;
  const {request}=await startFixture(t,{...setup,resolveAddress:async()=> '192.168.1.50',sendELF:async()=>{sends++;const error=new Error('The transfer result is unknown. Check the console before trying again.');error.code='loader-timeout';error.mayHaveExecuted=true;throw error;}});
  const response=await request('/api/run',{actionId:'fixture-ps5',platform:'ps5',address:'192.168.1.50',firmware:'9.00'});
  assert.equal(response.status,200);const result=await response.json();
  assert.equal(result.status,'uncertain');assert.equal(result.code,'loader-timeout');assert.equal(result.mayHaveExecuted,true);assert.equal(result.outcome,'unknown');assert.equal(sends,1);
});
test('simultaneous transfers do not remove another transfer console lock',async t=>{
  const setup = fixture(t); let release, entered;
  const started = new Promise(resolve=>{entered=resolve;});
  const pending = new Promise(resolve=>{release=resolve;});
  const {request} = await startFixture(t,{...setup,resolveAddress:async()=> '192.168.1.50',sendELF:async()=>{entered();await pending;return {status:'sent',message:'Bytes sent.'};}});
  const body = {actionId:'fixture-ps5',platform:'ps5',address:'192.168.1.50',firmware:'9.00'};
  const first = request('/api/run',body); await started;
  for (let i=0;i<2;i++) assert.equal((await (await request('/api/run',body)).json()).code,'console-busy');
  release(); assert.equal((await (await first).json()).status,'sent');
});
test('bridge serves only its dashboard and curated payloads, without disclosing its token',async t=>{
  const setup = fixture(t);
  delete setup.actions[0].run; // A bootstrap loader may be downloadable without being runnable by this sender.
  const {base,token} = await startFixture(t,setup);
  const html = await (await fetch(base+'/hosts/ps5/')).text();
  assert.match(html,/Fixture only/);
  assert.match(html,/<meta name="whatwhatboy-local-sender" content="true">/);
  assert.match(html,/href="https:\/\/whatwhatboy.com\/docs\/host-payload-sender.md"/);
  assert.match(html,/href="\/hosts\/ps4\/"/);
  assert.ok(!html.includes(token));
  assert.equal((await fetch(base+'/AGENTS.md')).status,404);
  assert.equal((await fetch(base+'/downloads/fixture/menu.bin')).status,200);
  assert.equal((await fetch(base+'/downloads/fixture/payload.elf')).status,200);
  assert.equal((await fetch(base+'/downloads/fixture/unknown.bin')).status,404);
  const r = await fetch(base+'/api/status'); assert.equal(r.status,401); assert.equal(r.headers.get('access-control-allow-origin'),null);
});
test('raw ELF sender uses raw bytes on fixed TCP9021 and reports only transport completion',async()=>{
  const data = Buffer.from([0x7f,0x45,0x4c,0x46]);
  const socket = new EventEmitter(); let captured, destroyed = false;
  socket.end = bytes => {assert.deepEqual(bytes,data);queueMicrotask(()=>socket.emit('finish'));}; socket.destroy = ()=>{destroyed=true;};
  const out = await bridge.sendRawELF('192.168.1.50',data,{connect:options=>{captured=options;queueMicrotask(()=>socket.emit('connect'));return socket;}});
  assert.deepEqual(captured,{host:'192.168.1.50',port:9021}); assert.equal(out.status,'sent'); assert.match(out.message,/Check the console/); assert.equal(destroyed,true);
});
test('GoldHEN bridge honors readiness and HTTP200 rather than faking a TCP result',async()=>{
  const seen = [], data = Buffer.from([1,2,3]);
  const out = await bridge.sendGoldHENHTTP('192.168.1.50',data,{fetcher:async(url,init)=>{seen.push([url,init]);return {ok:true,status:200,json:async()=>({status:'ready'})};}});
  assert.equal(out.status,'accepted'); assert.equal(seen[0][0],'http://192.168.1.50:9090/status'); assert.equal(seen[0][1].method,'GET'); assert.equal(seen[1][0],'http://192.168.1.50:9090/'); assert.equal(seen[1][1].body,data);
  let calls = 0;
  await assert.rejects(()=>bridge.sendGoldHENHTTP('192.168.1.50',data,{fetcher:async()=>{calls++;return {ok:true,status:200,json:async()=>({status:'busy'})};}}),{code:'loader-busy'});
  assert.equal(calls,1);
});
