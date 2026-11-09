'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=require('../../assets/apk-directory.js'),builder=require('../build-apk-directory.cjs');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function fixture(hash=''){
 const panels=Object.fromEntries(['tv','phone','phone-ios','phone-android','phone-harmony'].map(id=>[id,{hidden:false,setAttribute(){}}]));
 const lists=[['device',['tv','phone']],['phone',['phone-ios','phone-android','phone-harmony']]].map(([group,ids])=>({setAttribute(){},getAttribute:()=>group,querySelectorAll:()=>ids.map(id=>tabs[id])}));
 const clicks={},tabs={},doc={activeElement:null,querySelectorAll:()=>lists,getElementById:id=>panels[id],addEventListener:(key,fn)=>clicks[key]=fn};
 for(const id of Object.keys(panels)){const events={},attrs={'data-app-target':id};tabs[id]={getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v,addEventListener:(k,f)=>events[k]=f,focus(){doc.activeElement=this;},click(){events.click({preventDefault(){}});},key(key){events.keydown({key,preventDefault(){}});}};}
 const events={},win={document:doc,location:{hash},addEventListener:(k,f)=>events[k]=f};api.init(win);return {tabs,panels,doc,win,events,clicks};
}
test('device tabs isolate TV from Phone and phone tabs open the exact requested platform',()=>{
 const f=fixture();assert.equal(f.panels.tv.hidden,false);assert.equal(f.panels.phone.hidden,true);
 f.tabs.phone.click();assert.equal(f.panels.tv.hidden,true);assert.equal(f.panels.phone.hidden,false);assert.equal(f.panels['phone-ios'].hidden,false);
 f.tabs['phone-harmony'].click();assert.equal(f.panels['phone-ios'].hidden,true);assert.equal(f.panels['phone-harmony'].hidden,false);
 const deep=fixture('#phone-android');assert.equal(deep.panels.phone.hidden,false);assert.equal(deep.panels['phone-android'].hidden,false);
 deep.win.location.hash='#apk-time';deep.events.hashchange();assert.equal(deep.panels.tv.hidden,false);
 const app=fixture('#app-aurora-store');assert.equal(app.panels['phone-android'].hidden,false);assert.equal(app.panels.phone.hidden,false);
 app.clicks.click({target:{closest:()=>({})},preventDefault(){}});assert.equal(app.panels.tv.hidden,false);
});
test('tabs support keyboard navigation and a single roving tab stop per group',()=>{
 const f=fixture('#phone-ios');f.tabs['phone-ios'].key('ArrowLeft');assert.equal(f.doc.activeElement,f.tabs['phone-harmony']);assert.equal(f.tabs['phone-harmony'].getAttribute('aria-selected'),'true');assert.equal(f.tabs['phone-ios'].tabIndex,-1);
 f.tabs['phone-harmony'].key('Home');assert.equal(f.doc.activeElement,f.tabs['phone-ios']);f.tabs['phone-ios'].key('End');assert.equal(f.doc.activeElement,f.tabs['phone-harmony']);
});
test('directory removes the old Downloader instruction, preserves APK Time and exposes only archived APK downloads',()=>{
 const catalog=JSON.parse(read('docs/apk-app-catalog.json')),html=builder.render(read('scripts/templates/apk-page.html'),catalog);
 assert.doesNotMatch(html,/On Home Page of Downloader, type:/);
 for(const id of ['tv','apk-time','installation'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(html.indexOf('id="apk-time"') < html.indexOf('id="tv"'));
 assert.match(html,/<h1 class="page-title">Tv\/Movies apps<\/h1>/);
 assert.ok(html.includes('/downloads/archive/ca9af15933d9/APKTime-v2.2-Original.apk'));
 assert.doesNotMatch(html, /data-app-tablist|id="phone(?:-ios|-android|-harmony)?"/);
 assert.ok(!html.includes(' hidden'),'No-script users can read every section');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const app of catalog.apps){const card=builder.appCard(app);assert.doesNotMatch(card,/<details\b|>Source page</i);if(app.status==='archived'){assert.ok(card.includes(app.downloadURL.replaceAll('&','&amp;')));assert.ok(app.file.bytes>0);assert.match(app.file.sha256,/^[a-f0-9]{64}$/);}else if(app.delivery){assert.ok(card.includes(app.delivery.url.replaceAll('&','&amp;')));assert.ok(!card.includes('>Download APK</a>'));}else {assert.ok(!card.includes('>Download APK</a>'));assert.ok(card.includes('unavailable'));}}
});

test('all eight repaired entries keep their old source and use accurately labelled APK, store or exact-version actions',()=>{
 const c=JSON.parse(read('docs/apk-app-catalog.json'));
 for(const id of ['file-synced','unlinked','applinked','launcher-manager','peacock-tv','xumo','tv-launcher','atv-launcher']){
  const app=c.apps.find(a=>a.id===id);assert.ok(app.retainedSources.length);assert.equal(app.retainedSources[0].status,'source-unavailable');
  assert.ok(app.status==='archived'||app.delivery);
  if(app.repair){assert.equal(app.repair.manifest.versionName,app.file.version);assert.ok(app.repair.manifest.package);}
 }
 assert.match(c.apps.find(a=>a.id==='tv-launcher').delivery.url,/tvlauncher-3-1-1/);
 assert.match(c.apps.find(a=>a.id==='atv-launcher').delivery.description,/paid Pro/);
});
test('Phone groups its landing page and the Tv/Movies apps link',()=>{
 const phone=read('pages/phone.html'),apk=read('pages/apk.html');
 const main=phone.slice(phone.indexOf('<div class="main-content"'),phone.indexOf('<!-- Footer -->'));
 assert.match(main,/<h1 class="page-title">Phone<\/h1>/);
 assert.doesNotMatch(main,/app-card|app-tabs|<article|<a\b/);
 assert.match(phone,/href="\/pages\/phone\.html" class="nav-link nav-sublink active" aria-current="page"/);
 assert.match(apk,/href="\/pages\/apk\.html" class="nav-link nav-sublink active" aria-current="page" data-tooltip="Tv\/Movies apps"/);
 assert.doesNotMatch(apk,/data-app-tablist|id="phone(?:-ios|-android|-harmony)?"/);
 const navigation=require('../phone-navigation.cjs');
 for(const file of require('../site-public-pages.cjs').pages()){
  const html=fs.readFileSync(file,'utf8');
  const sidebar=html.match(/<nav\b[^>]*class="sidebar-nav"[^>]*>[\s\S]*?<\/nav>/)?.[0];
  if(!sidebar?.includes('data-tooltip="PC"'))continue;
  assert.equal((sidebar.match(/data-phone-navigation/g)||[]).length,1,file);
  assert.match(sidebar, /data-phone-navigation><button[^>]+data-tooltip="Phone"[\s\S]*?<ul class="nav-sublist">[\s\S]*?href="\/pages\/apk\.html"[^>]+data-tooltip="Tv\/Movies apps"/,file);
  assert.doesNotMatch(sidebar,/data-tooltip="APK Downloads"/,file);
  assert.equal(navigation.apply(path.relative(root,file),html),html,file);
 }
});
