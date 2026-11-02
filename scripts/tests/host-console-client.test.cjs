const test = require('node:test');
const assert = require('node:assert/strict');
const {webcrypto,createHash} = require('node:crypto');
const client = require('../../assets/host-console-client.js');
const origin = 'http://192.168.1.50:8084';
function response(body, status = 200) { return {ok:status >= 200 && status < 300,status,text:async()=>String(body),json:async()=>body,arrayBuffer:async()=>Uint8Array.from(body).buffer}; }

test('console address validation permits only private IPv4 and local hostname syntax', () => {
  for (const value of ['10.1.2.3','172.16.1.2','172.31.2.3','192.168.1.50','127.0.0.1','localhost','ps5','ps5.local']) assert.equal(client.normalizeAddress(value),value);
  assert.equal(client.normalizeAddress('  PS5.Local '),'ps5.local');
  for (const value of ['', 'http://192.168.1.50','192.168.1.50:8084','192.168.1.50/','foo@bar','example.com','999.1.1.1','8.8.8.8','172.32.1.2','192.168.1.255','192.168.1.0','file:','ps5.local?x','ps5.local.evil','-ps5','ps5-', '1.2.3']) assert.throws(()=>client.normalizeAddress(value),value);
});
test('service URLs preserve verified ports and direct manager capabilities require exact origin',()=>{
  assert.equal(client.serviceURL('ps5.local','manager'),'http://ps5.local:8084/');
  assert.equal(client.serviceURL('192.168.1.50','files'),'http://192.168.1.50:8080/fs/');
  assert.equal(client.serviceURL('192.168.1.50','ps4-files'),'http://192.168.1.50:8080/');
  assert.equal(client.capabilities('192.168.1.50',{origin}).canRunManager,true);
  for (const other of ['https://whatwhatboy.com','http://192.168.1.50:8080','http://192.168.1.50','http://192.168.1.50:8084.evil','null']) assert.equal(client.capabilities('192.168.1.50',{origin:other}).canRunManager,false);
  assert.throws(()=>client.serviceURL('ps5','shutdown'));
});
test('foreign-origin manager inspection and launch make no requests or fake success',async()=>{
  let calls = 0;
  const options = {origin:'https://whatwhatboy.com',fetch:async()=>{calls++; throw Error();}};
  assert.equal((await client.inspectManager('192.168.1.50',options)).status,'blocked');
  const out = await client.launchInstalled('192.168.1.50','/data/pldmgr/payloads/local/app.elf',options);
  assert.equal(out.status,'blocked'); assert.equal(calls,0);
});
test('manager inspection reports only the service-reported IP and leaves unknown IP unset',async()=>{
  const seen = [];
  const fetch = async(url,init)=>{seen.push([url,init]);return response(url.endsWith('/version')?'0.6.3':'192.168.1.50');};
  const out = await client.inspectManager('192.168.1.50',{origin,fetch});
  assert.equal(out.status,'connected'); assert.equal(out.version,'0.6.3'); assert.equal(out.reportedAddress,'192.168.1.50');
  assert.ok(seen.every(([,init])=>init.method === 'GET' && init.mode === 'same-origin'));
  assert.equal((await client.inspectManager('192.168.1.50',{origin,fetch:async(url)=>response(url.endsWith('/version')?'0.6.3':'0.0.0.0')})).reportedAddress,null);
  assert.equal((await client.inspectManager('192.168.1.50',{origin,fetch:async()=>response('<html>')})).status,'unavailable');
});
test('manager launch encodes an approved installed path and distinguishes transfer from execution',async()=>{
  const path = '/mnt/usb1/pldmgr/tools/ftpsrv-ps5.elf'; let call;
  const out = await client.launchInstalled('192.168.1.50',path,{origin,fetch:async(url,init)=>{call={url,init};return response('OK');}});
  assert.equal(call.url,origin+'/loadpayload:'+encodeURIComponent(path));
  assert.equal(call.init.method,'POST'); assert.deepEqual(call.init.headers,{'X-PLDMGR-Request':'1'});
  assert.equal(out.status,'accepted'); assert.match(out.message,/Check the console/); assert.doesNotMatch(out.message,/running|executed successfully/i);
  const unacknowledged=await client.launchInstalled('192.168.1.50',path,{origin,fetch:async()=>response('queued')});
  assert.equal(unacknowledged.status,'uncertain');assert.equal(unacknowledged.mayHaveExecuted,true);assert.equal(unacknowledged.outcome,'unknown');
  assert.equal((await client.launchInstalled('192.168.1.50',path,{origin,fetch:async()=>response('no',403)})).code,'http-403');
});
test('manager does not accept arbitrary paths, encoded traversal, BINs or self launch',()=>{
  for (const value of ['/data/foo.elf','/data/pldmgr/payloads/local/../secret.elf','/data/pldmgr/payloads/local/%2e%2e/secret.elf','/data/pldmgr/payloads/local/pldmgr_v0.6.3.elf','/mnt/usb8/pldmgr/a.elf','/mnt/usb0/pldmgr/a.bin','/mnt/usb0/pldmgr/a.elf?x','/mnt/usb0/pldmgr//a.elf']) assert.throws(()=>client.validatePayloadPath(value),value);
});
test('bridge requests require localhost origin and pairing, then send only an action ID and selected versions',async()=>{
  const bridgeURL = 'http://127.0.0.1:8766', token = 'a'.repeat(64); let calls = 0, captured;
  const fetch = async(url,init)=>{calls++;captured={url,init};return response({status:'sent',code:'elf-bytes-sent',message:'Bytes sent.'});};
  assert.equal((await client.inspectBridge(bridgeURL,token,{origin:'https://whatwhatboy.com',fetch})).status,'blocked');
  assert.equal(calls,0);
  const out = await client.runViaBridge('192.168.1.50','ps5-ftpsrv',token,'ps5',{bridgeURL,origin:bridgeURL,firmware:'9.00',fetch});
  assert.equal(out.status,'sent'); assert.equal(captured.url,bridgeURL+'/api/run');
  assert.deepEqual(JSON.parse(captured.init.body),{address:'192.168.1.50',actionId:'ps5-ftpsrv',platform:'ps5',firmware:'9.00',gameVersion:''});
  assert.equal(captured.init.headers['X-Whatsite-Token'],token);
  assert.equal((await client.inspectBridge(bridgeURL,'bad',{origin:bridgeURL,fetch})).code,'invalid-token');
  assert.throws(()=>client.bridgeOrigin('http://192.168.1.50:8766'));
  assert.throws(()=>client.bridgeOrigin('http://localhost:99999'));
  const error = await client.runViaBridge('192.168.1.50','ps5-ftpsrv',token,'ps5',{bridgeURL,origin:bridgeURL,fetch:async()=>response({status:'error',code:'checksum-mismatch',message:'Nothing sent.'},400)});
  assert.equal(error.code,'checksum-mismatch'); assert.equal(error.message,'Nothing sent.');
});

test('console inspection is an explicit paired read-only bridge request with no firmware guess',async()=>{
  const bridgeURL='http://127.0.0.1:8766',token='a'.repeat(64);let calls=0,captured;
  const fetch=async(url,init)=>{calls++;captured={url,init};return response({status:'connected',code:'manager-connected',message:'App responded.',service:'payload-manager',version:'0.6.3',reportedAddress:'192.168.1.50'});};
  const options={bridgeURL,token,origin:bridgeURL,fetch};
  assert.equal((await client.inspectConsole('192.168.1.50','ps5',{...options,origin:'https://whatwhatboy.com'})).status,'blocked');
  assert.equal((await client.inspectConsole('http://evil.example/','ps5',options)).status,'error');
  assert.equal((await client.inspectConsole('192.168.1.50','other',options)).code,'invalid-platform');
  assert.equal((await client.inspectConsole('192.168.1.50','ps5',{...options,token:''})).code,'invalid-token');
  assert.equal(calls,0);
  const out=await client.inspectConsole('192.168.1.50','ps5',options);
  assert.equal(captured.url,bridgeURL+'/api/inspect');assert.equal(captured.init.method,'POST');
  assert.deepEqual(JSON.parse(captured.init.body),{address:'192.168.1.50',platform:'ps5'});
  assert.equal(captured.init.headers['X-Whatsite-Token'],token);assert.equal(out.firmware,undefined);assert.equal(out.activeGame,undefined);assert.equal(out.version,'0.6.3');
});
test('GoldHEN sends verified BIN bytes only when HTTP readiness is explicit',async()=>{
  const bytes = Buffer.from([4,3,2,1]), sha256 = createHash('sha256').update(bytes).digest('hex');
  const action = {format:'BIN',downloadURL:'/downloads/fixture/menu.bin',sha256}, seen = [];
  const out = await client.sendGoldHEN('192.168.1.50',action,{origin:'http://127.0.0.1:8766',crypto:webcrypto,fetch:async(url,init)=>{
    seen.push([url,init]);
    return url.endsWith('/status')?response({status:'ready'}):url.startsWith('/downloads/')?response(bytes):response('OK');
  }});
  assert.equal(out.status,'accepted'); assert.equal(seen[0][1].method,'GET');
  assert.equal(seen[2][0],'http://192.168.1.50:9090/'); assert.equal(seen[2][1].method,'POST');
  assert.deepEqual(Buffer.from(seen[2][1].body),bytes);
  assert.equal(seen[2][1].headers,undefined); // The native API expects raw bytes, no invented framing.
});
test('GoldHEN busy, mixed-content and bad checksum never POST payload bytes, with or without WebCrypto',async()=>{
  const action = {format:'BIN',downloadURL:'/downloads/fixture/menu.bin',sha256:'0'.repeat(64)};
  let sent = 0;
  const fetch = async(url,init)=>{if(url.endsWith(':9090/'))sent++;return url.endsWith('/status')?response({status:'ready'}):response([1,2]);};
  assert.equal((await client.sendGoldHEN('192.168.1.50',action,{origin:'https://whatwhatboy.com',fetch})).code,'mixed-content');
  assert.equal((await client.sendGoldHEN('192.168.1.50',action,{origin:'http://host',crypto:{},fetch})).code,'checksum-mismatch');
  assert.equal((await client.sendGoldHEN('192.168.1.50',action,{origin:'http://host',crypto:webcrypto,fetch})).code,'checksum-mismatch');
  assert.equal((await client.inspectGoldHEN('127.0.0.1',{origin:'http://host',fetch:async(url,init)=>{assert.equal(init.method,'POST');return response({status:'busy'});}})).code,'loader-busy');
  assert.equal(sent,0);
});
test('the SHA-256 console fallback matches standard hashes, padding boundaries and changed bytes',()=>{
  const inputs = [Buffer.alloc(0),Buffer.from('abc'),Buffer.from('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),Buffer.alloc(55,0x7e),Buffer.alloc(56,0x7e),Buffer.alloc(63,0x7e),Buffer.alloc(64,0x7e),Buffer.alloc(65,0x7e),Buffer.alloc(1000000,0x61)];
  for (const bytes of inputs) assert.equal(client.sha256(bytes),createHash('sha256').update(bytes).digest('hex'));
  assert.notEqual(client.sha256(Buffer.from([1,2,3])),client.sha256(Buffer.from([1,2,4])));
});
test('GoldHEN sends on an HTTP console browser using the SHA fallback when WebCrypto is absent',async()=>{
  const bytes = Buffer.from([4,3,2,1]), action = {format:'BIN',downloadURL:'/downloads/fixture/menu.bin',sha256:createHash('sha256').update(bytes).digest('hex')};
  let posts = 0;
  const out = await client.sendGoldHEN('127.0.0.1',action,{origin:'http://whatwhatboy.com',crypto:{},fetch:async(url,init)=>{
    if(url.endsWith('/status'))return response({status:'ready'});
    if(url.startsWith('/downloads/'))return response(bytes);
    posts++;return response('OK');
  }});
  assert.equal(out.status,'accepted');assert.equal(posts,1);
});
test('PS5 native HTTP ELF requests use the documented URI endpoint and report request acceptance only',async()=>{
  const action = {format:'ELF',downloadURL:'/downloads/fixture/app.elf',sha256:'a'.repeat(64)};
  const launchURL = client.elfLaunchURL('127.0.0.1',action,{origin:'http://192.168.1.2:8765'});
  assert.equal(launchURL,'http://127.0.0.1:9021/?uri='+encodeURIComponent('http://192.168.1.2:8765/downloads/fixture/app.elf'));
  let seen;
  const out = await client.sendPS5ELF('192.168.1.50',action,{origin:'http://whatwhatboy.com',fetch:async(url,init)=>{seen={url,init};return response('');}});
  assert.equal(seen.url,client.elfLaunchURL('192.168.1.50',action,{origin:'http://whatwhatboy.com'}));assert.equal(seen.init.method,'GET');assert.equal(seen.init.mode,'cors');assert.equal(seen.init.headers,undefined);
  assert.equal(out.status,'accepted');assert.equal(out.code,'elf-loader-requested');assert.match(out.message,/have not been verified/);
});
test('PS5 HTTPS native ELF requests return an explicit navigation fallback without making a request',async()=>{
  const action = {format:'ELF',downloadURL:'/downloads/fixture/app.elf',sha256:'a'.repeat(64)}; let calls = 0;
  const out = await client.sendPS5ELF('192.168.1.50',action,{origin:'https://whatwhatboy.com',fetch:async()=>{calls++;return response('');}});
  assert.equal(out.status,'blocked');assert.equal(out.code,'mixed-content');assert.equal(calls,0);assert.match(out.launchURL,/^http:\/\/192\.168\.1\.50:9021\//);
  for (const downloadURL of ['https://evil.test/app.elf','/downloads/../app.elf','/downloads/%2e%2e/app.elf','/downloads/%252e%252e/app.elf','/downloads/app.bin','/downloads/app.elf?args=x']) assert.throws(()=>client.elfLaunchURL('192.168.1.50',{...action,downloadURL},{origin:'http://192.168.1.2:8765'}));
  const failed = await client.sendPS5ELF('192.168.1.50',action,{origin:'http://whatwhatboy.com',fetch:async()=>{throw Error('CORS');}});
  assert.equal(failed.status,'uncertain');assert.equal(failed.code,'connection-failed');assert.equal(failed.mayHaveExecuted,true);
});
test('PS5 URL launching uses the actual LAN/public asset origin and refuses localhost previews',async()=>{
  const action = {format:'ELF',downloadURL:'/downloads/fixture/app.elf',sha256:'a'.repeat(64)};let calls = 0;
  for (const origin of ['http://127.0.0.1:8765','http://localhost:8765','http://preview.localhost:8765','http://0.0.0.0:8765','file:///C:/site/index.html','']) {
    const out = await client.sendPS5ELF('192.168.1.50',action,{origin,fetch:async()=>{calls++;return response('');}});
    assert.equal(out.status,'blocked',origin);assert.equal(out.code,'payload-origin-unreachable');assert.equal(out.launchURL,undefined);
  }
  assert.equal(calls,0);
  const explicit = client.elfLaunchURL('192.168.1.50',action,{origin:'http://127.0.0.1:8765',payloadOrigin:'http://192.168.1.2:8765'});
  assert.equal(new URL(explicit).searchParams.get('uri'),'http://192.168.1.2:8765/downloads/fixture/app.elf');
  const publicURL = client.elfLaunchURL('192.168.1.50',action,{origin:'https://staging.example.org'});
  assert.equal(new URL(publicURL).searchParams.get('uri'),'https://staging.example.org/downloads/fixture/app.elf');
  assert.throws(()=>client.elfLaunchURL('192.168.1.50',action,{payloadOrigin:'https://user:pass@example.com'}));
  assert.throws(()=>client.elfLaunchURL('192.168.1.50',action,{payloadOrigin:'https://example.com/another/path'}));
});
test('execution-request network errors and timeouts are uncertain, never successful or automatically retried',async()=>{
  const path = '/data/pldmgr/payloads/local/app.elf';
  let calls=0;
  const network=await client.launchInstalled('192.168.1.50',path,{origin,fetch:async()=>{calls++;throw Error('CORS');}});
  assert.equal(network.status,'uncertain');assert.equal(network.mayHaveExecuted,true);assert.equal(network.outcome,'unknown');assert.equal(calls,1);
  const timeout=await client.launchInstalled('192.168.1.50',path,{origin,timeoutMs:5,fetch:()=>{calls++;return new Promise(()=>{});}});
  assert.equal(timeout.status,'uncertain');assert.equal(timeout.code,'timeout');assert.equal(timeout.mayHaveExecuted,true);assert.equal(calls,2);
});
