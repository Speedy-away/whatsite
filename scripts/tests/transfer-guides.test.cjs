const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=require('../../i18n-tools/transfer-guide-source.json');
const codes=require('../localized-html.cjs').codes;
test('dedicated guides use their own console manager and exact FTP services',()=>{
 const ps4=fs.readFileSync('console/ps4/file-transfer-guide.html','utf8');
 const ps5=fs.readFileSync('console/ps5/file-transfer-guide.html','utf8');
 assert.match(ps4,/<h2[^>]*>PS4 file management · PS4-Xplorer/);
 assert.match(ps5,/<h2[^>]*>PS5 file management · ezRemote Client/);
 assert.match(ps4,/GoldHEN normally uses port 2121/);
 assert.match(ps5,/etaHEN[^<]*port 1337/);
 for(const html of [ps4,ps5]){
  assert.match(html,/data-choose-method="ftp"/);assert.match(html,/data-choose-method="usb"/);
  for(const host of ['apps.apple.com','play.google.com','appgallery.huawei.com'])assert.ok(html.includes(host));
  assert.match(html,/Copying a file does not install or run it/);
  assert.ok(!html.includes('console-setup-popups.js'));
  assert.doesNotMatch(html,/data-(?:localized-diagram|diagram-link)|transfer-guides\/[\w-]+\.svg/);
  for(const id of ['ios','android','harmony']){
   const card=html.match(new RegExp('<article[^>]*data-phone-platform="'+id+'"[\\s\\S]*?</article>'))?.[0];
   assert.equal((card?.match(/<li><strong>/g)||[]).length,3,id+' walkthrough');
  }
 }
});
test('method selection, deep links and browser back reveal only the selected instructions',()=>{
 const listeners={},choices=['ftp','usb'].map(method=>({dataset:{chooseMethod:method},classList:{toggle(){}},setAttribute(){},removeAttribute(){},addEventListener(){}}));
 const panels=['ftp','ftp','usb'].map(method=>({dataset:{transferMethod:method},hidden:false}));
 const shared={hidden:false};
 const location={hash:'',search:''};
 const document={documentElement:{lang:'en'},getElementById(){return null;},querySelectorAll(selector){return selector==='[data-choose-method]'?choices:selector==='[data-transfer-method]'?panels:selector==='[data-transfer-shared]'?[shared]:[];},addEventListener(){}};
 vm.runInNewContext(fs.readFileSync('assets/transfer-guides.js','utf8'),{document,location,URLSearchParams,window:{addEventListener(name,fn){listeners[name]=fn;}}});
 assert.ok(panels.every(p=>p.hidden));assert.equal(shared.hidden,true);
 location.search='?method=ftp';listeners.popstate();assert.deepEqual(panels.map(p=>p.hidden),[false,false,true]);
 location.hash='#file-manager';listeners.hashchange();assert.deepEqual(panels.map(p=>p.hidden),[true,true,false]);
 location.hash='#phone';listeners.hashchange();assert.deepEqual(panels.map(p=>p.hidden),[false,false,true]);
 location.hash='';location.search='';listeners.popstate();assert.ok(panels.every(p=>p.hidden));
});
test('every supported language has complete guide prose and app instructions',()=>{
 for(const code of codes){
  const locale=JSON.parse(fs.readFileSync('i18n-tools/transfer-guide-locales/'+code+'.json','utf8'));
  assert.deepEqual(Object.keys(locale).sort(),Object.keys(source).sort(),code);
  for(const [id,value]of Object.entries(locale))assert.ok(typeof value==='string'&&value.trim(),code+'/'+id);
  // Storage limits and distinct ports survive translation.
  assert.ok(locale.ps4Setup.includes('2121'),code);assert.ok(locale.ps5Setup.includes('1337')&&locale.ps5Setup.includes('2121'),code);
  assert.ok(locale.usb3.includes('/mnt/usb0')&&locale.usb3.includes('/mnt/usb1'),code);
 }
});
test('new hub entry replaces the old desktop-only card on PS4 and PS5, preserving other platforms',()=>{
 const {apply}=require('../console-helpful-tools.cjs');
 const input='<html><body><div id="content"></div></body></html>';
 for(const platform of ['ps4','ps5']){
  const file='console/'+platform+'/index.html',out=apply(file,input);
  assert.match(out,new RegExp('/console/'+platform+'/file-transfer-guide.html'));assert.match(out,/Not finished/);assert.ok(!out.includes('Download FileZilla Client'));
  assert.equal(apply(file,out),out);
 }
 assert.match(apply('console/ps3/index.html',input),/Download FileZilla Client/);
});
test('guide routes, source assets and hub entry links resolve locally',()=>{
 const files=['console/ps4/file-transfer-guide.html','console/ps5/file-transfer-guide.html','console/download-center/index.html',...['ps4','ps5'].flatMap(p=>['index','transfer-tools'].map(n=>'console/'+p+'/'+n+'.html'))];
 for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,file+' duplicate ids');
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
   const value=match[1].replaceAll('&amp;','&');if(value==='#'||/^(?:https?:|mailto:|data:)/.test(value))continue;
   const url=new URL(value,'https://whatwhatboy.com/'+file);let target='.'+decodeURIComponent(url.pathname);
   if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target+='/index.html';
   assert.ok(fs.existsSync(target),file+' missing '+value);
   if(url.hash&&target.endsWith('.html'))assert.ok(fs.readFileSync(target,'utf8').includes('id="'+decodeURIComponent(url.hash.slice(1))+'"'),file+' missing anchor '+value);
  }
 }
});
test('published language routes include translated guide prose and real localized links',()=>{
 const path=require('node:path'),localize=require('../build-localized-pages.cjs');
 const ctx=localize.load(process.cwd(),{previewPages:['console/ps4/file-transfer-guide.html','console/ps5/file-transfer-guide.html','console/download-center/index.html']});
 for(const platform of ['ps4','ps5']){
  const file='console/'+platform+'/file-transfer-guide.html',page=ctx.pages.get(file);
  assert.ok(page,'Missing localization route '+file);
  const authored=fs.readFileSync(file,'utf8');
  for(const code of codes){
   const locale=JSON.parse(fs.readFileSync(path.join('i18n-tools/transfer-guide-locales',code+'.json'),'utf8'));
   const rendered=localize.render(ctx,page,authored,code);
   assert.ok(rendered.includes('data-site-language="'+code+'"'));
   assert.ok(rendered.includes(locale[platform+'Title']),code+'/'+platform+' title');
   const picture=platform==='ps4'?'/assets/images/transfer-guides/screenshots/ps4-xplorer.png':'/assets/images/expansion-ps4-ps5/ps5-ezremote.jpg';
   assert.ok(rendered.includes(picture),code+' real manager screenshot');
   for(const os of ['ios','android','harmony'])for(const step of ['Connect','Find','Upload']){
    assert.equal(localize.translate(ctx,source[os+step],code),locale[os+step],code+' '+os+step);
   }
   const keywords=require('../localized-html.cjs').decode(rendered.match(/<meta name="keywords" content="([^"]+)"/)[1]);
   assert.ok(keywords.includes(localize.translate(ctx,source.usb,code)),code+' localized keywords');
   assert.equal(localize.translate(ctx,source.ipStep,code),locale.ipStep,code+' IPv4 prose');
   assert.equal(localize.translate(ctx,source.fz1,code),locale.fz1,code+' FileZilla prose');
   assert.ok(rendered.includes('/'+code+'/console/'+platform+'/file-transfer-guide.html?method=ftp#ftp'));
  }
 }
});

test('guide metadata names the taught protocols, correct console manager and article breadcrumbs',()=>{
 const meta=require('../page-search-metadata.cjs');
 for(const platform of ['ps4','ps5']){
  const file='console/'+platform+'/file-transfer-guide.html',html=fs.readFileSync(file,'utf8');
  const output=meta.transform(file,html);assert.equal(output.html,html);
  const words=output.metadata.keywords;
  for(const name of ['FileZilla','FTPManager','Solid Explorer','electerm','exFAT','FAT32'])assert.ok(words.includes(name),platform+' '+name);
  assert.doesNotMatch(words,/SFTP|SMB|WebDAV/);
  if(platform==='ps4'){assert.match(words,/GoldHEN FTP port 2121/);assert.match(words,/PS4-Xplorer 2.07/);}
  else{assert.match(words,/etaHEN FTP port 1337/);assert.match(words,/ezRemote Client 2.18/);assert.doesNotMatch(words,/PS4-Xplorer|GoldHEN/);}
  const schema=JSON.parse(html.match(/<script id="site-page-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const article=schema['@graph'].find(x=>x['@type']==='TechArticle');
  const breadcrumb=schema['@graph'].find(x=>x['@type']==='BreadcrumbList');
  assert.ok(article);assert.equal(article.dateModified,'2026-11-11');
  assert.deepEqual(breadcrumb.itemListElement.map(x=>x.position),[1,2,3,4]);
  assert.ok(html.includes('class="tg-tags"'));assert.ok(html.includes('data-search='));
 }
 const center=fs.readFileSync('console/download-center/index.html','utf8');
 const schema=JSON.parse(center.match(/<script id="site-page-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema['@graph'].find(x=>x['@type']==='CollectionPage').mainEntity.numberOfItems,5);
});
test('runtime tutorial pictures remain hosted rather than being offloaded',()=>{
 const {plan,LIMIT}=require('../build-pages.cjs');
 for(const name of ['assets/images/transfer-guides/screenshots/usb-flash-drive.jpg','assets/images/expansion-ps4-ps5/ps5-ezremote.jpg']){
  assert.throws(()=>plan(process.cwd(),[name],'main',new Map([[name,100]]),LIMIT-50),/exceed/);
 }
});
test('FTP device and phone choices restore only their own steps, including deep links',()=>{
 const listeners={},methodChoices=['ftp','usb'].map(value=>choice('chooseMethod',value)),deviceChoices=['computer','phone'].map(value=>choice('chooseDevice',value)),phoneChoices=['ios','android','harmony'].map(value=>choice('choosePhone',value));
 function choice(key,value){return {dataset:{[key]:value},classList:{toggle(){}},setAttribute(){},removeAttribute(){}};}
 const panels=[{dataset:{transferMethod:'ftp'}},{dataset:{transferMethod:'ftp',ftpDevice:'computer'}},{dataset:{transferMethod:'ftp',ftpDevice:'phone'}},{dataset:{transferMethod:'usb'}}];
 const phones=['ios','android','harmony'].map(value=>({dataset:{phonePlatform:value}}));
 const location={hash:'#ftp',search:'?method=ftp'};
 const document={documentElement:{lang:'en'},getElementById(){return null;},addEventListener(){},querySelectorAll(selector){
  return {'[data-choose-method]':methodChoices,'[data-choose-device]':deviceChoices,'[data-choose-phone]':phoneChoices,'[data-transfer-method]':panels,'[data-phone-platform]':phones}[selector]||[];
 }};
 vm.runInNewContext(fs.readFileSync('assets/transfer-guides.js','utf8'),{document,location,URLSearchParams,window:{addEventListener(k,v){listeners[k]=v;}}});
 assert.deepEqual(panels.map(p=>Boolean(p.hidden)),[false,true,true,true]);
 location.hash='#android';listeners.hashchange();
 assert.deepEqual(panels.map(p=>Boolean(p.hidden)),[false,true,false,true]);
 assert.deepEqual(phones.map(p=>Boolean(p.hidden)),[true,false,true]);
 location.hash='#filezilla';listeners.popstate();
 assert.deepEqual(panels.map(p=>Boolean(p.hidden)),[false,false,true,true]);assert.ok(phones.every(p=>p.hidden));
 location.hash='#usb';listeners.hashchange();assert.deepEqual(panels.map(p=>Boolean(p.hidden)),[true,true,true,false]);
});


test('guide choices retain native ads without publisher click-interception layers',()=>{
 const {publishAds}=require('../site-ads.cjs');
 const input='<html><head></head><body><main id="main-content"><p>Guide</p></main></body></html>';
 for(const page of ['console/ps4/file-transfer-guide.html','console/ps5/file-transfer-guide.html','console/download-center/index.html']){
  const html=publishAds(page,input);
  assert.match(html,/bauval.org\/21\//);assert.match(html,/site-ad-sponsored/);
  assert.doesNotMatch(html,/abscloud.org\/1\//);assert.doesNotMatch(html,/bauval.org\/14\//);
  assert.equal(publishAds(page,html),html);
 }
 const other=publishAds('console/ps4/apps.html',input);
 assert.match(other,/abscloud.org\/1\//);assert.match(other,/bauval.org\/14\//);
});
