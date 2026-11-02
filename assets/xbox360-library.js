(() => {
  'use strict';
  if (!document.querySelector('[data-xbox360-library]')) return;
  const search=document.getElementById('library-search');
  const category=document.getElementById('library-category');
  const support=document.getElementById('library-support');
  const cards=[...document.querySelectorAll('[data-library-card]')];
  const count=document.getElementById('library-count');
  const empty=document.getElementById('library-empty');
  const normal=value=>value.toLocaleLowerCase().normalize('NFKD').replace(/\p{M}/gu,'');
  function filter() {
    const terms=normal(search.value).trim().split(/\s+/).filter(Boolean);
    let visible=0;
    for(const card of cards){
      const match=terms.every(term=>normal(card.dataset.librarySearch).includes(term))&&(category.value==='all'||card.dataset.libraryCategory===category.value)&&(support.value==='all'||card.dataset.librarySupport.split(/\s+/).includes(support.value));
      card.hidden=!match;if(match)visible++;
    }
    count.textContent=visible+' of '+cards.length+' resources';empty.hidden=visible!==0;
  }
  search.addEventListener('input',filter);category.addEventListener('change',filter);support.addEventListener('change',filter);
  document.getElementById('library-reset').addEventListener('click',()=>{search.value='';category.value='all';support.value='all';filter();search.focus();});
  filter();
})();
