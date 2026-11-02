(() => {
 'use strict';
 const search=document.querySelector('[data-theme-search]'),filter=document.querySelector('[data-theme-filter]');
 if(!search||!filter)return;
 const cards=[...document.querySelectorAll('[data-wiiu-theme]')],count=document.querySelector('[data-theme-count]'),empty=document.querySelector('[data-theme-empty]');
 const normalize=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function update(){const terms=normalize(search.value.trim()).split(/\s+/).filter(Boolean);let shown=0;for(const card of cards){card.hidden=!terms.every(term=>normalize(card.dataset.search).includes(term))||Boolean(filter.value&&!card.dataset.features.split(' ').includes(filter.value));if(!card.hidden)shown++;}const text=shown===1?'{count} theme':'{count} themes';count.textContent=window.__scoobyI18n?.t(text,{count:shown})||text.replace('{count}',shown);empty.hidden=shown!==0;}
 search.addEventListener('input',update);filter.addEventListener('change',update);window.addEventListener('scooby:langchange',update);
 document.querySelector('[data-theme-clear]')?.addEventListener('click',()=>{search.value='';filter.value='';update();search.focus();});
 function reveal(){if(!location.hash)return;let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const card=cards.find(c=>c.id===id);if(!card)return;search.value='';filter.value='';update();card.scrollIntoView({block:'start'});}
 window.addEventListener('hashchange',reveal);update();reveal();
})();
