'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const policy=require('../host-reference-metadata.cjs'),metadata=require('../page-search-metadata.cjs'),root=path.resolve(__dirname,'../..');
const decode=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"');
const get=(html,key)=>decode(html.match(new RegExp('<meta (?:name|property)="'+key.replace(/:/g,'\\:')+'" content="([^\"]*)"'))?.[1]||'');
const scripts=html=>[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!/application\/ld\+json/i.test(m[1])).map(m=>m[0]);
test('host reference policy is limited to23 moved landings and two platform hubs',()=>{
 assert.equal(policy.files.length,25);assert.equal(policy.files.filter(f=>f.startsWith('hosts/')).length,23);
 for(const file of ['index.html','console/ps3/index.html','guides/console-files/ps4.html','hosts/runtime/ps4/index.html','downloads/helper.html','console/ps4/whatsite-ps4.html'])assert.equal(policy.transform(file,'<html><head></head><body>Exact bytes</body></html>'),null,file);
});
test('moved host metadata preserves canonical, body and executable/config scripts while describing the actual destination',()=>{
 const canonical='https://speedy-away.github.io/hosts/ps4/',before='<html><head><title>Page moved</title><link rel="canonical" href="'+canonical+'"><meta http-equiv="refresh" content="0;url='+canonical+'"><meta name="description"><meta name="robots" content="index, follow"><script>var exact="$&";</script><script id="config" type="application/json">{"sha":"pinned"}</script></head><body><a href="'+canonical+'">Original link</a><script>location.replace("'+canonical+'"+location.search+location.hash);</script></body></html>';
 const result=metadata.transform('hosts/ps4/index.html',before);
 assert.equal(result.html.split('<body>')[1],before.split('<body>')[1]);assert.deepEqual(scripts(result.html),scripts(before));assert.ok(result.html.includes('<link rel="canonical" href="'+canonical+'">'));
 assert.equal(get(result.html,'robots'),'noindex, follow');assert.equal(get(result.html,'og:url'),canonical);assert.equal(get(result.html,'twitter:url'),canonical);assert.equal(get(result.html,'og:title'),get(result.html,'twitter:title'));assert.equal(get(result.html,'description'),get(result.html,'og:description'));assert.doesNotMatch(get(result.html,'description'),/page has moved|working on every|all firmware/i);
 assert.equal(metadata.transform('hosts/ps4/index.html',result.html).html,result.html);
});
test('all scoped outputs have consistent previews, accurate PNG dimensions, bounded terms and idempotent metadata',()=>{
 for(const file of policy.files){
  const before=fs.readFileSync(path.join(root,file),'utf8'),result=metadata.transform(file,before),html=result.html;
  assert.equal(html,before,file+' saved output');assert.equal(metadata.transform(file,html).html,html,file+' repeat');
  assert.equal(get(html,'og:title'),decode(html.match(/<title>([\s\S]*?)<\/title>/)[1]));assert.equal(get(html,'description'),get(html,'twitter:description'));assert.equal(get(html,'og:url'),get(html,'twitter:url'));
  assert.ok(get(html,'description').length>=80&&get(html,'description').length<=165,file+' useful description');assert.ok(get(html,'keywords').split(', ').length<=18,file+' bounded terms');
  const image=new URL(get(html,'og:image')),bytes=fs.readFileSync(path.join(root,image.pathname));assert.equal(get(html,'og:image:width'),String(bytes.readUInt32BE(16)));assert.equal(get(html,'og:image:height'),String(bytes.readUInt32BE(20)));
  if(file.startsWith('hosts/')){assert.equal(get(html,'robots'),'noindex, follow');assert.equal(result.metadata.structuredData,null);}
  else{const data=JSON.parse(html.match(/<script id="site-page-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]),page=data['@graph'].find(x=>x['@type']==='WebPage'),site=data['@graph'].find(x=>x['@type']==='WebSite');assert.equal(page.name,get(html,'og:title'));assert.equal(page.description,get(html,'description'));assert.equal(page.url,get(html,'og:url'));assert.equal(page.keywords,get(html,'keywords'));assert.equal(page.image,get(html,'og:image'));assert.equal(site.url,'https://whatwhatboy.com/');assert.equal(page.isPartOf['@id'],site['@id']);}
 }
});
