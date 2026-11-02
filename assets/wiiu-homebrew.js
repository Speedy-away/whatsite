(() => {
 'use strict';
 const search=document.querySelector('[data-wiiu-search]'),category=document.querySelector('[data-wiiu-category]');
 if(!search||!category)return;
 const apps=[...document.querySelectorAll('[data-wiiu-app]')],count=document.querySelector('[data-wiiu-count]'),empty=document.querySelector('[data-wiiu-empty]');
 const normalize=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function update(){const terms=normalize(search.value.trim()).split(/\s+/).filter(Boolean);let shown=0;for(const app of apps){app.hidden=Boolean(category.value&&app.dataset.category!==category.value)||!terms.every(term=>normalize(app.dataset.search).includes(term));if(!app.hidden)shown++;}const source=shown===1?'{count} app':'{count} apps';count.textContent=window.__scoobyI18n?.t(source,{count:shown})||source.replace('{count}',shown);empty.hidden=shown!==0;}
 search.addEventListener('input',update);category.addEventListener('change',update);window.addEventListener('scooby:langchange',update);update();
 document.querySelector('[data-wiiu-clear]')?.addEventListener('click',()=>{search.value='';category.value='';update();search.focus();});
 // Reveal bookmarked applications even when a previous search hid their card.
 function revealHash(){if(!location.hash)return;let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const app=apps.find(a=>a.id===id);if(!app)return;search.value='';category.value='';update();app.scrollIntoView({block:'start'});}
 window.addEventListener('hashchange',revealHash);revealHash();
})();
