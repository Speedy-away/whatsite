const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../nenyoo-free-key.js'), 'utf8');
const resolver = source.slice(source.indexOf('  const downloadPageFallback ='), source.indexOf('  const fail ='));
async function resolve(responses) {
  const calls=[];
  const context={URL,AbortController,setTimeout,clearTimeout,fetch:async(url, options)=>{
    calls.push({url,options});
    const response=responses.shift();
    if(response instanceof Error) throw response;
    return {ok:!!response,json:async()=>response};
  }};
  vm.createContext(context);
  vm.runInContext(resolver+'\nglobalThis.result = loaderUrl;',context);
  return {url:await context.result,calls};
}
test('uses the published manifest and omits credentials',async()=>{
  const result=await resolve([{url:'https://filego.at/bucket/new-release'}]);
  assert.equal(result.url,'https://filego.at/bucket/new-release');
  assert.equal(result.calls.length,1);
  assert.match(result.calls[0].url,/loader-download\.json$/);
  assert.equal(result.calls[0].options.credentials,'omit');
});
test('CORS or network failure uses the hosting repository manifest',async()=>{
  const result=await resolve([new Error('CORS'),{url:'https://filego.at/bucket/fallback'}]);
  assert.equal(result.url,'https://filego.at/bucket/fallback');
  assert.match(result.calls[1].url,/raw\.githubusercontent\.com/);
});
test('rejects unsafe links and falls back to the downloads page',async()=>{
  for(const url of ['javascript:alert(1)','https://filego.at.evil.test/bucket/x','https://evil@filego.at/bucket/x','http://filego.at/bucket/x','https://filego.at/bucket/x?redirect=evil']){
    const result=await resolve([{url},{url}]);
    assert.equal(result.url,'https://nenyoomenu.com/downloads');
  }
});
