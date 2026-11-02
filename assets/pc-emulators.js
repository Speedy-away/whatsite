/* Scoped emulator catalogue search. Native, experimental and legacy packages
   remain distinct from source builds, Wine and frontend cores. */
(function(){'use strict';
  var form=document.querySelector('[data-emu-filters]');if(!form)return;
  var cards=Array.from(document.querySelectorAll('[data-emu-card]'));
  var sections=Array.from(document.querySelectorAll('[data-emu-section]'));
  var query=form.querySelector('[name=q]'),os=form.querySelector('[name=os]'),ready=form.querySelector('[name=ready]');
  var count=document.querySelector('[data-emu-count]'),empty=document.querySelector('[data-emu-empty]');
  function apply(){var terms=query.value.toLowerCase().trim().split(/\s+/).filter(Boolean),host=os.value,packaged=ready.checked,visible=0;
    cards.forEach(function(card){var hosts=(card.getAttribute(packaged?'data-ready-os':'data-os')||'').split(' ');var matches=terms.every(function(t){return card.getAttribute('data-search').includes(t)})&&(host==='all'||hosts.includes(host))&&(!packaged||hosts.some(Boolean));card.hidden=!matches;if(matches)visible++;});
    sections.forEach(function(s){s.hidden=!Array.from(s.querySelectorAll('[data-emu-card]')).some(function(c){return !c.hidden;});});
    count.textContent=visible+' of '+cards.length+' entries shown';empty.hidden=visible!==0;
  }
  form.addEventListener('submit',function(ev){ev.preventDefault()});form.addEventListener('input',apply);form.addEventListener('change',apply);form.addEventListener('reset',function(){setTimeout(apply,0)});
  var params=new URLSearchParams(location.search);if(params.has('q'))query.value=params.get('q');if(['windows','macos','linux'].includes(params.get('os')))os.value=params.get('os');if(params.get('ready')==='1')ready.checked=true;apply();
})();
