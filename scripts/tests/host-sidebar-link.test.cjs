'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {HOST,hostDestination,normalizeHostOrigin,integrateWebhostLink}=require('../host-webhost-navigation.cjs');
test('sidebar generator keeps one named host item after Help and remains idempotent',()=>{
 const html='<ul><li data-webhost-navigation><a>Old host</a></li><li><a data-tooltip="Help &amp; FAQ">Help</a></li></ul>';
 const result=integrateWebhostLink(html);
 assert.equal((result.match(/data-webhost-navigation/g)||[]).length,1);
 assert.ok(result.indexOf('Help</a>')<result.indexOf('data-webhost-navigation'));
 assert.ok(result.includes('<span>PS4 / PS5 Host</span>'));
 assert.equal(integrateWebhostLink(result),result);
});
test('legacy host origins and chooser aliases resolve to root while exact deep routes, queries and fragments survive',()=>{
 for(const prefix of ['/WWB-HOST','/wwb-host','']){
  for(const chooser of ['/hosts/','/hosts/index.html'])assert.equal(normalizeHostOrigin(HOST+prefix+chooser+'?from=main#choose'),HOST+'/?from=main#choose');
  const route='/hosts/ps4/?view=goldhen&build=2.3#file';assert.equal(normalizeHostOrigin(HOST+prefix+route),HOST+route);
 }
 assert.equal(hostDestination('/hosts/'),HOST+'/');assert.equal(hostDestination('/hosts/index.html?view=mods#game'),HOST+'/?view=mods#game');
 assert.equal(hostDestination('/hosts/ps5/gta5/?update=1.00#exact'),HOST+'/hosts/ps5/gta5/?update=1.00#exact');
 for(const immutable of ['https://github.com/Speedy-away/WWB-HOST/releases/download/old/file.zip','https://raw.githubusercontent.com/Speedy-away/WWB-HOST/'+'a'.repeat(40)+'/old.bin',HOST+'/WWB-HOST-extra/'])assert.equal(normalizeHostOrigin(immutable),immutable);
});
test('active authored navigation and host redirects use the owning root site without regenerating native documents',()=>{
 const scope=require('../site-public-pages.cjs'),{hostRedirect}=require('./migration-contracts.cjs');
 for(const file of scope.pages()){
  const name=scope.relativePath(file);if(name.startsWith('downloads/'))continue;
  const html=fs.readFileSync(file,'utf8');assert.doesNotMatch(html,/https:\/\/speedy-away\.github\.io\/(?:WWB-HOST|wwb-host)(?=\/|["'\s<>?#]|$)/,name);
  if(name.startsWith('hosts/')&&html.includes('location.search+location.hash'))hostRedirect(name);
 }
 for(const file of ['hosts/index.html','hosts/ps4/index.html','hosts/ps5/gta5/index.html']){
  const html=hostRedirect(file),script=html.match(/<script>(location\.replace\([\s\S]*?\);)<\/script>/)[1];let target;
  vm.runInNewContext(script,{location:{search:'?view=mods&build=exact',hash:'#game',replace(value){target=value;}}});
  assert.equal(target,hostDestination('/'+file.replace(/index\.html$/,''))+'?view=mods&build=exact#game');
 }
});
test('Language initializer reuses the static host item, removes the legacy duplicate and places it below Language',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../../languages/i18n.js'),'utf8');
 class Item {
  constructor(label){this.tagName='LI';this.attrs={};this.link={parentNode:this,classList:{remove(){},add(){}},setAttribute:(k,v)=>this.attrs[k]=v,removeAttribute:k=>delete this.attrs[k],querySelector:s=>s==='span'?this.span:null,insertAdjacentHTML(){},addEventListener(){}};this.span={textContent:label};}
  querySelector(){return this.link;}setAttribute(k,v){this.attrs[k]=v;}cloneNode(){return new Item(this.span.textContent);}
 }
 const sample=new Item('Home'),canonical=new Item('PS4 / PS5 host'),legacy=new Item('PS4 / PS5 webhost');
 canonical.attrs['data-webhost-navigation']='';
 const list={children:[sample,canonical,legacy],querySelector:s=>s==='.i18n-nav-link'?null:sample.link,querySelectorAll:()=>[canonical,legacy.link],appendChild(item){if(item.parentNode===this)this.removeChild(item);item.parentNode=this;this.children.push(item);},removeChild(item){this.children=this.children.filter(x=>x!==item);item.parentNode=null;}};
 for(const item of list.children)item.parentNode=list;
 const start=source.indexOf('  function mountSidebarLink()'),end=source.indexOf('  function mount(el)',start);
 const context={document:{querySelector:()=>list},showPicker(){}};
 vm.runInNewContext(source.slice(start,end),context);context.mountSidebarLink();
 assert.deepEqual(list.children.map(x=>x.span.textContent),['Home','Language','PS4 / PS5 Host']);
 assert.equal(list.children.at(-1),canonical);
 assert.equal(canonical.attrs.href,'https://speedy-away.github.io/');
 assert.equal(canonical.attrs['aria-label'],'PS4 / PS5 Host');
});
