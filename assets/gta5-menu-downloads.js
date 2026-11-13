(function(global,factory){
 'use strict';const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(global?.document){const start=()=>api.install(global.document);if(global.document.readyState==='loading')global.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof window==='object'?window:null,function(){
 'use strict';
 function install(doc){
  const widgets=[];
  for(const group of doc.querySelectorAll('[data-menu-download-group]')){
   if(group.dataset.menuReady)continue;
   const select=group.querySelector('[data-menu-version]'),link=group.querySelector('[data-menu-download]');
   if(!select||!link)continue;
   const update=()=>{
    const option=select.options[select.selectedIndex];if(!option)return;
    link.setAttribute('href',option.value);
    link.setAttribute('download',option.dataset.filename);
    link.setAttribute('aria-label','Download '+group.dataset.menuName+' · '+option.textContent);
   };
   select.addEventListener('change',update);update();select.disabled=false;group.dataset.menuReady='true';widgets.push(group);
  }
  return widgets;
 }
 return {install};
});
