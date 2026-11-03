'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=require('../../assets/apk-directory.js'),builder=require('../build-apk-directory.cjs');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
function fixture(hash=''){
 const panels=Object.fromEntries(['tv','phone','phone-ios','phone-android','phone-harmony'].map(id=>[id,{hidden:false,setAttribute(){}}]));
 const lists=[['device',['tv','phone']],['phone',['phone-ios','phone-android','phone-harmony']]].map(([group,ids])=>({setAttribute(){},getAttribute:()=>group,querySelectorAll:()=>ids.map(id=>tabs[id])}));
 const tabs={},doc={activeElement:null,querySelectorAll:()=>lists,getElementById:id=>panels[id]};
 for(const id of Object.keys(panels)){const events={},attrs={'data-app-target':id};tabs[id]={getAttribute:k=>attrs[k],setAttribute:(k,v)=>attrs[k]=v,addEventListener:(k,f)=>events[k]=f,focus(){doc.activeElement=this;},click(){events.click({preventDefault(){}});},key(key){events.keydown({key,preventDefault(){}});}};}
 const events={},win={document:doc,location:{hash},addEventListener:(k,f)=>events[k]=f};api.init(win);return {tabs,panels,doc,win,events};
}
test('device tabs isolate TV from Phone and phone tabs open the exact requested platform',()=>{
 const f=fixture();assert.equal(f.panels.tv.hidden,false);assert.equal(f.panels.phone.hidden,true);
 f.tabs.phone.click();assert.equal(f.panels.tv.hidden,true);assert.equal(f.panels.phone.hidden,false);assert.equal(f.panels['phone-ios'].hidden,false);
 f.tabs['phone-harmony'].click();assert.equal(f.panels['phone-ios'].hidden,true);assert.equal(f.panels['phone-harmony'].hidden,false);
 const deep=fixture('#phone-android');assert.equal(deep.panels.phone.hidden,false);assert.equal(deep.panels['phone-android'].hidden,false);
 deep.win.location.hash='#apk-time';deep.events.hashchange();assert.equal(deep.panels.tv.hidden,false);
});
test('tabs support keyboard navigation and a single roving tab stop per group',()=>{
 const f=fixture('#phone-ios');f.tabs['phone-ios'].key('ArrowLeft');assert.equal(f.doc.activeElement,f.tabs['phone-harmony']);assert.equal(f.tabs['phone-harmony'].getAttribute('aria-selected'),'true');assert.equal(f.tabs['phone-ios'].tabIndex,-1);
 f.tabs['phone-harmony'].key('Home');assert.equal(f.doc.activeElement,f.tabs['phone-ios']);f.tabs['phone-ios'].key('End');assert.equal(f.doc.activeElement,f.tabs['phone-harmony']);
});
test('directory removes the old Downloader instruction, preserves APK Time and exposes only archived APK downloads',()=>{
 const catalog=JSON.parse(read('docs/apk-app-catalog.json')),html=builder.render(read('scripts/templates/apk-page.html'),catalog);
 assert.doesNotMatch(html,/On Home Page of Downloader, type:/);
 for(const id of ['tv','phone','phone-ios','phone-android','phone-harmony','apk-time','installation'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(html.includes('/downloads/archive/ca9af15933d9/APKTime-v2.2-Original.apk'));
 assert.ok(html.includes('https://appgallery.huawei.com/'));assert.ok(html.includes('https://apps.apple.com/'));assert.ok(html.includes('https://play.google.com/'));
 assert.ok(!html.includes(' hidden'),'No-script users can read every section');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const app of catalog.apps){const card=builder.appCard(app);if(app.status==='archived'){assert.ok(card.includes(app.downloadURL.replaceAll('&','&amp;')));assert.ok(app.file.bytes>0);assert.match(app.file.sha256,/^[a-f0-9]{64}$/);}else {assert.ok(!card.includes('>Download APK</a>'));assert.ok(card.includes('unavailable'));}}
});
