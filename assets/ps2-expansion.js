(() => {
  'use strict';
  const search=document.querySelector('[data-ps2-search]'),category=document.querySelector('[data-ps2-category]');
  if(!search||!category)return;
  const cards=[...document.querySelectorAll('[data-ps2-item]')],groups=[...document.querySelectorAll('[data-ps2-group]')];
  const count=document.querySelector('[data-ps2-count]'),empty=document.querySelector('[data-ps2-empty]');
  const normalize=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  // Keep native details as the no-script fallback; move their existing content
  // into one modal so translation state and download handlers stay intact.
  const dialog=document.createElement('dialog');
  dialog.className='ps2-setup-dialog';
  dialog.setAttribute('aria-labelledby','ps2-setup-title');
  dialog.innerHTML='<header class="ps2-dialog-header"><h2 id="ps2-setup-title" translate="no"></h2><button type="button" class="ps2-dialog-close" aria-label="Close setup">Close</button></header><div class="ps2-dialog-content"></div>';
  document.body.append(dialog);
  const content=dialog.querySelector('.ps2-dialog-content');
  let sourceDetails=null,opener=null;
  dialog.querySelector('button').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
  dialog.addEventListener('close',()=>{if(sourceDetails){while(content.firstChild)sourceDetails.append(content.firstChild);if(sourceDetails.tagName==='DETAILS')sourceDetails.open=false;}document.documentElement.classList.remove('ps2-modal-open');opener?.setAttribute('aria-expanded','false');opener?.focus({preventScroll:true});sourceDetails=null;});
  function openSetup(source,title,trigger,nodes){sourceDetails=source;opener=trigger;dialog.querySelector('h2').textContent=title;for(const node of nodes)content.append(node);dialog.showModal();trigger.setAttribute('aria-expanded','true');document.documentElement.classList.add('ps2-modal-open');window.__scoobyI18n?.refresh();}
  for(const card of cards){
    const details=card.querySelector('.ps2-card-body > details'),summary=details?.querySelector(':scope > summary');
    if(!summary||typeof dialog.showModal!=='function')continue;
    summary.setAttribute('aria-haspopup','dialog');summary.setAttribute('aria-expanded','false');summary.dataset.ps2Popup='';
    summary.addEventListener('click',event=>{event.preventDefault();openSetup(details,card.querySelector('h3').textContent,summary,[...details.childNodes].filter(node=>node!==summary));});
  }
  const guides=new Map();
  if(typeof dialog.showModal==='function')for(const id of ['start','ps2-storage-guide','storage']){
    const section=document.getElementById(id),container=section?.querySelector(':scope > .container'),heading=container?.querySelector(':scope > .section-header');
    if(!heading)continue;
    const body=document.createElement('div');body.hidden=true;
    for(const node of [...container.childNodes])if(node!==heading)body.append(node);
    const button=document.createElement('button');button.type='button';button.className='ps2-guide-trigger btn btn-outline';button.textContent=id==='start'?'Open PS2 setup guide':'Open storage guide';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
    container.append(button,body);
    const open=()=>openSetup(body,heading.querySelector('h2').textContent,button,[...body.childNodes]);
    button.addEventListener('click',open);guides.set(id,open);
  }
  const themeNote=document.querySelector('#ps2-themes > .container > .guide-note');
  if(themeNote&&typeof dialog.showModal==='function'){
    const button=document.createElement('button');button.type='button';button.id='ps2-theme-setup';button.className='ps2-guide-trigger btn btn-outline';button.textContent='Open OPL theme setup guide';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
    const body=document.createElement('div');body.hidden=true;
    themeNote.before(button,body);body.append(themeNote);
    const open=()=>openSetup(body,window.__scoobyI18n?.t('OPL theme setup')||'OPL theme setup',button,[...body.childNodes]);
    button.addEventListener('click',open);guides.set('ps2-theme-setup',open);
  }
  document.addEventListener('click',event=>{const anchor=event.target.closest('a[href^="#"]');if(!anchor)return;let id;try{id=decodeURIComponent(anchor.getAttribute('href').slice(1));}catch{return;}if(guides.has(id)&&!dialog.open){event.preventDefault();event.stopImmediatePropagation();history.replaceState(null,'',anchor.getAttribute('href'));guides.get(id)();}else if(dialog.open&&dialog.contains(anchor))dialog.close();},true);
  function update(){const terms=normalize(search.value.trim()).split(/\s+/).filter(Boolean);let shown=0;for(const card of cards){card.hidden=Boolean(category.value&&card.dataset.category!==category.value)||!terms.every(t=>normalize(card.dataset.search).includes(t));if(!card.hidden)shown++;}for(const group of groups)group.hidden=![...group.querySelectorAll('[data-ps2-item]')].some(c=>!c.hidden);const source=shown===1?'{count} resource':'{count} resources';count.textContent=window.__scoobyI18n?.t(source,{count:shown})||source.replace('{count}',shown);empty.hidden=shown!==0;}
  function clear(){search.value='';category.value='';update();}
  search.addEventListener('input',update);category.addEventListener('change',update);window.addEventListener('scooby:langchange',update);
  document.querySelector('[data-ps2-clear]')?.addEventListener('click',()=>{clear();search.focus();});
  // Shared smooth navigation updates history without emitting hashchange.
  // Reveal the destination before its scroll handler measures the section.
  document.addEventListener('click',event=>{const a=event.target.closest('a[href^="#"]');if(!a)return;let id;try{id=decodeURIComponent(a.getAttribute('href').slice(1));}catch{return;}if(cards.some(c=>c.id===id)||groups.some(g=>g.id===id))clear();},true);
  function reveal(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}if(guides.has(id)){if(!dialog.open)guides.get(id)();return;}const card=cards.find(c=>c.id===id),group=groups.find(g=>g.id===id);if(!card&&!group)return;clear();(card||group).scrollIntoView({block:'start'});}
  window.addEventListener('hashchange',reveal);update();reveal();
})();
