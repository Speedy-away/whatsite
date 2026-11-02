(function (global) {
  'use strict';
  function install(doc) {
    var search=doc.getElementById('ps3-theme-search'), type=doc.getElementById('ps3-theme-type');
    if (!search || !type) return;
    var cards=Array.prototype.slice.call(doc.querySelectorAll('[data-theme-card]'));
    var shown=doc.querySelector('[data-theme-visible-count]'), empty=doc.getElementById('ps3-theme-empty');
    function update() {
      var words=String(search.value || '').toLowerCase().trim().split(/\s+/).filter(Boolean), count=0;
      cards.forEach(function(card) {
        var text=card.getAttribute('data-search') || '';
        var visible=(type.value==='all' || card.getAttribute('data-type')===type.value) && words.every(function(word){return text.indexOf(word)!==-1;});
        card.hidden=!visible;
        if(visible)count++;
      });
      shown.textContent=String(count);
      empty.hidden=count!==0;
      if(global.__scoobyI18n && global.__scoobyI18n.refresh) global.__scoobyI18n.refresh(doc.getElementById('ps3-theme-count'));
    }
    function clear() {search.value='';type.value='all';update();search.focus();}
    search.addEventListener('input',update);
    type.addEventListener('change',update);
    doc.getElementById('ps3-theme-clear').addEventListener('click',clear);
    doc.getElementById('ps3-theme-empty-clear').addEventListener('click',clear);
    update();
  }
  if(typeof module==='object' && module.exports)module.exports={install:install};
  else if(global.document.readyState==='loading')global.document.addEventListener('DOMContentLoaded',function(){install(global.document);});
  else install(global.document);
}(typeof window!=='undefined'?window:globalThis));
