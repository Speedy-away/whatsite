'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {integrateWebhostLink}=require('../host-webhost-navigation.cjs');
test('sidebar generator keeps one named host item after Help and remains idempotent',()=>{
 const html='<ul><li data-webhost-navigation><a>Old host</a></li><li><a data-tooltip="Help &amp; FAQ">Help</a></li></ul>';
 const result=integrateWebhostLink(html);
 assert.equal((result.match(/data-webhost-navigation/g)||[]).length,1);
 assert.ok(result.indexOf('Help</a>')<result.indexOf('data-webhost-navigation'));
 assert.ok(result.includes('<span>PS4 / PS5 Host</span>'));
 assert.equal(integrateWebhostLink(result),result);
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
 assert.equal(canonical.attrs.href,'https://speedy-away.github.io/WWB-HOST/');
 assert.equal(canonical.attrs['aria-label'],'PS4 / PS5 Host');
});
