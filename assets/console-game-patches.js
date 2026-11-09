(function(){
  'use strict';
  var root=document.querySelector('[data-patch-catalogue]');if(!root)return;
  var search=root.querySelector('[data-patch-search]'),filter=root.querySelector('[data-patch-filter]'),count=root.querySelector('[data-patch-count]'),cards=root.querySelectorAll('[data-patch-card]');
  var platform=root.querySelector('[data-patch-platform]'),groups=root.querySelectorAll('[data-patch-group]');
  function searchText(value){return value.toLowerCase().replace(/(\d)\s*fps\b/g,'$1fps').trim();}
  function update(){
    var terms=searchText(search.value).split(/\s+/),kind=filter.value,visible=0;
    for(var i=0;i<cards.length;i++){
      var card=cards[i],text=searchText(card.getAttribute('data-search'));
      var matches=terms.every(function(term){return text.indexOf(term)!==-1;})&&(!kind||card.getAttribute('data-kinds').split(' ').indexOf(kind)!==-1)&&(!platform.value||card.getAttribute('data-platforms').split(' ').indexOf(platform.value)!==-1);
      card.hidden=!matches;
      if(matches)visible++;
    }
    for(var j=0;j<groups.length;j++) groups[j].hidden=!groups[j].querySelector('[data-patch-card]:not([hidden])');
    count.textContent=visible+' of '+cards.length+' patch entries shown';
  }
  search.addEventListener('input',update);filter.addEventListener('change',update);platform.addEventListener('change',update);update();
  var pickers=root.querySelectorAll('[data-patch-file-picker]');
  for(var j=0;j<pickers.length;j++)(function(picker){
    var select=picker.querySelector('select'),download=picker.querySelector('[data-patch-download]'),storage=picker.querySelectorAll('[data-patch-storage]');
    function choose(){
      var option=select.options[select.selectedIndex],selected=Boolean(option.value);
      if(selected){
        download.href=option.getAttribute('data-url');
        download.setAttribute('download',option.value+'.xml');
        download.textContent='Download '+option.value+'.xml';
        download.removeAttribute('aria-disabled');
      }else{
        download.removeAttribute('href');
        download.removeAttribute('download');
        download.textContent='Download selected XML';
        download.setAttribute('aria-disabled','true');
      }
      for(var i=0;i<storage.length;i++){
        var link=storage[i];
        if(selected){
          link.href=(link.getAttribute('data-patch-storage')||picker.getAttribute('data-download-page'))+'?file='+encodeURIComponent(option.getAttribute('data-id'))+'#files';
          link.removeAttribute('aria-disabled');
        }else{
          link.removeAttribute('href');
          link.setAttribute('aria-disabled','true');
        }
      }
    }
    select.addEventListener('change',choose);choose();
  })(pickers[j]);
}());
