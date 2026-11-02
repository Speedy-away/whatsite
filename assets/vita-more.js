(() => {
 const root=document.querySelector('[data-vita-library]');if(!root)return;
 const query=root.querySelector('#vita-query'),category=root.querySelector('#vita-category'),format=root.querySelector('#vita-format');
 const cards=[...root.querySelectorAll('[data-vita-item]')],count=root.querySelector('[data-vita-count]'),empty=root.querySelector('[data-vita-empty]');
 function apply(){
  const words=query.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);let shown=0;
  for(const card of cards){const match=words.every(w=>card.dataset.search.includes(w))&&(!category.value||card.dataset.category===category.value)&&(!format.value||card.dataset.formats.split(' ').includes(format.value));card.hidden=!match;if(match)shown++;}
  count.textContent=`${shown} of ${cards.length} projects`;empty.hidden=shown>0;
 }
 for(const el of [query,category,format]){el.addEventListener('input',apply);el.addEventListener('change',apply);}
 root.querySelector('[data-vita-reset]').addEventListener('click',()=>{query.value='';category.value='';format.value='';apply();query.focus();});
 function reveal(){const target=document.getElementById(location.hash.slice(1));if(target?.matches('[data-vita-item]')&&target.hidden){query.value='';category.value='';format.value='';apply();target.scrollIntoView();}}
 window.addEventListener('hashchange',reveal);apply();reveal();
})();
