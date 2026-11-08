(function(){
  'use strict';
  var root=document.querySelector('[data-patch-catalogue]');if(!root)return;
  var search=root.querySelector('[data-patch-search]'),filter=root.querySelector('[data-patch-filter]'),count=root.querySelector('[data-patch-count]'),cards=root.querySelectorAll('[data-patch-card]');
  function searchText(value){return value.toLowerCase().replace(/(\d)\s*fps\b/g,'$1fps').trim();}
  function update(){
    var terms=searchText(search.value).split(/\s+/),kind=filter.value,visible=0;
    for(var i=0;i<cards.length;i++){
      var card=cards[i],text=searchText(card.getAttribute('data-search'));
      var matches=terms.every(function(term){return text.indexOf(term)!==-1;})&&(!kind||card.getAttribute('data-kinds').split(' ').indexOf(kind)!==-1);
      card.hidden=!matches;
      if(matches)visible++;
    }
    count.textContent=visible+' of '+cards.length+' patch entries shown';
  }
  search.addEventListener('input',update);filter.addEventListener('change',update);update();
  var pickers=root.querySelectorAll('[data-patch-file-picker]');
  for(var j=0;j<pickers.length;j++)(function(picker){
    var select=picker.querySelector('select'),download=picker.querySelector('[data-patch-download]'),storage=picker.querySelector('[data-patch-storage]');
    function choose(){var option=select.options[select.selectedIndex];if(!option.value){download.removeAttribute('href');storage.removeAttribute('href');download.setAttribute('aria-disabled','true');storage.setAttribute('aria-disabled','true');return;}download.href=option.getAttribute('data-url');download.setAttribute('download',option.value+'.xml');storage.href=picker.getAttribute('data-download-page')+'?file='+encodeURIComponent(option.getAttribute('data-id'))+'#files';download.removeAttribute('aria-disabled');storage.removeAttribute('aria-disabled');download.textContent='Download '+option.value+'.xml';}
    select.addEventListener('change',choose);download.addEventListener('click',function(event){if(!download.href)event.preventDefault();});storage.addEventListener('click',function(event){if(!storage.href)event.preventDefault();});choose();
  })(pickers[j]);
}());
