(function(root){
 'use strict';
 function selection(hash){
  const value=String(hash||'').replace(/^#/,'');
  if(value==='app-aurora-store')return {device:'phone',phone:'phone-android'};
  return {device:/^phone(?:-|$)/.test(value)?'phone':'tv',phone:['phone-ios','phone-android','phone-harmony'].includes(value)?value:'phone-ios'};
 }
 function init(win){
  const doc=win.document,lists=Array.from(doc.querySelectorAll('[data-app-tablist]'));
  if(!lists.length)return;
  function apply(){
   const state=selection(win.location.hash);
   for(const list of lists){
    const active=list.getAttribute('data-app-tablist')==='device'?state.device:state.phone;
    for(const tab of list.querySelectorAll('[data-app-target]')){
     const selected=tab.getAttribute('data-app-target')===active;
     tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
     doc.getElementById(tab.getAttribute('data-app-target')).hidden=!selected;
    }
   }
  }
  for(const list of lists){
   list.setAttribute('role','tablist');
   const tabs=Array.from(list.querySelectorAll('[data-app-target]'));
   tabs.forEach((tab,index)=>{
    const id=tab.getAttribute('data-app-target'),panel=doc.getElementById(id);
    tab.setAttribute('role','tab');tab.id='tab-'+id;tab.setAttribute('aria-controls',id);
    panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.tabIndex=0;
    tab.addEventListener('click',event=>{event.preventDefault();win.location.hash=id;apply();});
    tab.addEventListener('keydown',event=>{
     let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;
     event.preventDefault();tabs[next].focus();tabs[next].click();
    });
   });
  }
  doc.addEventListener('click',event=>{
   const link=event.target.closest&&event.target.closest('a[href="#apk-time"]');
   if(!link||event.button>0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   event.preventDefault();win.location.hash='apk-time';apply();
   const target=doc.getElementById('apk-time');if(target&&target.scrollIntoView)target.scrollIntoView({block:'start'});
  });
  win.addEventListener('hashchange',apply);apply();
 }
 const api={selection,init};if(typeof module==='object'&&module.exports)module.exports=api;
 else if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>init(root));else init(root);
})(typeof window!=='undefined'?window:globalThis);
