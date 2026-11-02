(function(){
  'use strict';
  var root=document.querySelector('[data-three-ds-search]');
  if(!root)return;
  var input=root.querySelector('input'),select=root.querySelector('select'),clear=root.querySelector('button');
  var cards=Array.prototype.slice.call(document.querySelectorAll(root.getAttribute('data-three-ds-search')==='themes'?'.three-ds-theme[data-three-ds-card]':'[data-three-ds-card]'));
  var count=root.querySelector('[role="status"]'),empty=root.querySelector('[data-empty]');
  function t(source,values){return window.__scoobyI18n&&typeof window.__scoobyI18n.t==='function'?window.__scoobyI18n.t(source,values):source.replace(/\{(\w+)\}/g,function(_,key){return values[key];});}
  function update(){
    var query=input.value.toLowerCase().trim(),category=select?select.value:'all',visible=0;
    cards.forEach(function(card){var show=(!query||(card.getAttribute('data-search')||card.textContent).toLowerCase().indexOf(query)!==-1)&&(category==='all'||(card.getAttribute('data-three-ds-category')||'').split(' ').indexOf(category)!==-1);card.hidden=!show;if(show)visible++;});
    document.querySelectorAll('[data-three-ds-group]').forEach(function(group){group.hidden=!group.querySelector('[data-three-ds-card]:not([hidden])');});
    count.textContent=t('{count} resources shown',{count:visible});
    empty.hidden=visible!==0;
  }
  input.addEventListener('input',update);
  if(select)select.addEventListener('change',update);
  clear.addEventListener('click',function(){input.value='';if(select)select.value='all';update();input.focus();});
  document.querySelectorAll('[data-three-ds-reveal]').forEach(function(anchor){anchor.addEventListener('click',function(){input.value='';if(select)select.value='all';update();});});
  window.addEventListener('scooby:langchange',update);
  update();
}());
