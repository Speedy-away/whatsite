'use strict';
const $=id=>document.getElementById(id);
const token=document.querySelector('meta[name="panel-token"]').content;
const form=$('download-form');
let catalog={pages:[],entries:[],types:{}},imageUpload='',downloadUpload='',imageBlob='',pending=0,previewSequence=0;
async function api(url,options={}) {
  const response=await fetch(url,{...options,headers:{'X-Panel-Token':token,...options.headers}});
  const result=await response.json();if(!response.ok)throw Error(result.error||'Request failed.');return result;
}
function option(value,text){const item=document.createElement('option');item.value=value;item.textContent=text;return item;}
function message(text,error=false){const box=$('result');box.replaceChildren();box.textContent=text;box.className=error?'error':'';box.hidden=false;}
function choosePages() {
  const old=$('page').value,query=$('page-search').value.toLowerCase();
  const rows=catalog.pages.filter(page=>page.group===$('group').value&&(!query||(page.title+' '+page.file).toLowerCase().includes(query)));
  $('page').replaceChildren(option('','Select a page…'),...rows.map(page=>option(page.file,page.title+' — /'+page.file.replace(/index\.html$/,''))));
  if(rows.some(row=>row.file===old))$('page').value=old;
  $('destination').textContent=rows.length+' matching pages'+($('page').value?' · /'+$('page').value:'');
  const ps3=$('group').value==='PS3';$('variant-row').hidden=!ps3;if(!ps3)$('variant').value='';
}
function updatePreview() {
  $('preview-title').textContent=$('title').value||'Your download title';
  $('preview-description').textContent=$('description').value||'A short description of your download will appear here.';
  $('preview-type').textContent=catalog.types[$('type').value]||'MOD MENUS';
  $('preview-pins').textContent=[$('version').value&&'Release '+$('version').value,$('gameVersion').value&&'Game '+$('gameVersion').value,$('firmware').value&&'Firmware '+$('firmware').value,$('region').value,$('variant').value].filter(Boolean).join(' · ');
  const mirror=['menu','cheat','script','payload'].includes($('type').value);$('mirror-row').hidden=!mirror;if(!mirror)$('mirror').checked=false;
  $('destination').textContent=$('page').value?'/'+$('page').value:'Choose a destination above.';
}
function displayImage(url) {$('image-preview').src=url;$('image-preview').hidden=false;$('image-placeholder').hidden=true;}
function clearImage(){ $('image-preview').removeAttribute('src');$('image-preview').hidden=true;$('image-placeholder').hidden=false; }
function imageMode() {
  const remote=form.elements.imageMode.value==='url';$('image-local').hidden=remote;$('image-remote').hidden=!remote;previewImage();
}
async function previewImage() {
  const sequence=++previewSequence;
  try {
    if(form.elements.imageMode.value==='url') {const url=new URL($('imageUrl').value);if(url.protocol!=='https:')return clearImage();return displayImage(url.href);}
    if(imageUpload&&imageBlob)return displayImage(imageBlob);
    if(!$('imagePath').value)return clearImage();
    const response=await fetch('/api/image-preview',{method:'POST',headers:{'X-Panel-Token':token,'Content-Type':'application/json'},body:JSON.stringify({imagePath:$('imagePath').value})});
    if(!response.ok){const error=await response.json();throw Error(error.error);}
    const blob=await response.blob();if(sequence!==previewSequence)return;
    if(imageBlob)URL.revokeObjectURL(imageBlob);imageBlob=URL.createObjectURL(blob);displayImage(imageBlob);
  } catch(error){if(sequence===previewSequence){clearImage();if($('imagePath').value&&form.elements.imageMode.value==='local')message(error.message,true);}}
}
async function upload(kind,file) {
  if(!file)return;
  pending++;$('save-button').disabled=true;
  const name=$(kind+'-file-name');name.textContent='Uploading '+file.name+'…';
  try {
    if(kind==='image')imageUpload='';else downloadUpload='';
    const result=await api('/api/upload?kind='+kind,{method:'POST',headers:{'X-File-Name':encodeURIComponent(file.name),'Content-Type':'application/octet-stream'},body:file});
    name.textContent=result.name+' · '+(result.bytes/1048576).toFixed(2)+' MiB';
    $(kind+'Path').value='';
    if(kind==='image'){imageUpload=result.id;if(imageBlob)URL.revokeObjectURL(imageBlob);imageBlob=URL.createObjectURL(file);form.elements.imageMode.value='local';imageMode();}
    else downloadUpload=result.id;
  } catch(error){message(error.message,true);name.textContent='Upload failed — choose the file again.';}
  finally{pending--;$('save-button').disabled=pending>0;}
}
function renderLibrary() {
  $('entry-count').textContent=catalog.entries.length;
  const list=$('library-list');list.replaceChildren();
  if(!catalog.entries.length){const empty=document.createElement('p');empty.className='empty';empty.textContent='No downloads added through this panel yet. Start with Add download.';list.append(empty);return;}
  for(const entry of [...catalog.entries].reverse()) {
    const article=document.createElement('article');article.className='library-entry';
    const copy=document.createElement('div'),title=document.createElement('h2'),detail=document.createElement('p'),destination=document.createElement('p'),link=document.createElement('a');
    title.textContent=entry.title;detail.textContent=[catalog.types[entry.type],entry.version,entry.gameVersion,entry.variant].filter(Boolean).join(' · ');destination.textContent='/'+entry.page;
    copy.append(title,detail,destination);link.textContent='View page ↗';link.href='/site/'+entry.page+'#'+entry.id;link.target='_blank';link.rel='noopener';article.append(copy,link);list.append(article);
  }
}
function tab(library) {
  $('editor').hidden=library;$('library').hidden=!library;
  for(const [id,active] of [['add-tab',!library],['library-tab',library]]) {$(id).classList.toggle('active',active);if(active)$(id).setAttribute('aria-current','page');else $(id).removeAttribute('aria-current');}
}
$('add-tab').addEventListener('click',()=>tab(false));$('library-tab').addEventListener('click',()=>tab(true));
$('group').addEventListener('change',choosePages);$('page-search').addEventListener('input',choosePages);
form.addEventListener('input',updatePreview);form.addEventListener('change',updatePreview);
for(const radio of form.elements.imageMode)radio.addEventListener('change',imageMode);
$('imageUrl').addEventListener('change',previewImage);
$('imagePath').addEventListener('input',()=>{imageUpload='';$('image-file').value='';$('image-file-name').textContent='or paste a full path above';});
$('imagePath').addEventListener('change',previewImage);
$('downloadPath').addEventListener('input',()=>{downloadUpload='';$('download-file').value='';$('download-file-name').textContent='or paste its full path';});
$('image-file').addEventListener('change',event=>upload('image',event.target.files[0]));
$('download-file').addEventListener('change',event=>upload('download',event.target.files[0]));
$('image-preview').addEventListener('error',clearImage);
form.addEventListener('submit',async event=>{
  event.preventDefault();if(pending)return message('Wait for the selected file to finish uploading.',true);
  const button=$('save-button');button.disabled=true;button.textContent='Archiving & saving…';message('Saving the file to F:, recording its checksum and updating the selected page. Large downloads may take a few minutes.');
  const input=Object.fromEntries(new FormData(form));input.mirror=$('mirror').checked;
  if(input.imageMode==='local'){input.imageUpload=imageUpload;delete input.imageUrl;}else{delete input.imagePath;}
  input.downloadUpload=downloadUpload;
  try {
    const result=await api('/api/entries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
    catalog.entries.push(result.entry);renderLibrary();
    message('Saved “'+result.entry.title+'”. The download is archived and the entry is saved locally.'+(result.warnings.length?' '+result.warnings.join(' '):''));
    const link=document.createElement('a');link.href=result.pageUrl;link.target='_blank';link.rel='noopener';link.textContent='Open the updated page ↗';$('result').append(document.createElement('br'),link);
  } catch(error){message(error.message,true);}
  finally{button.disabled=false;button.replaceChildren(document.createTextNode('Save download '));const arrow=document.createElement('span');arrow.textContent='↗';button.append(arrow);}
});
async function init() {
  try {
    catalog=await api('/api/catalog');
    $('group').replaceChildren(...[...new Set(catalog.pages.map(page=>page.group))].map(group=>option(group,group)));
    if(catalog.pages.some(page=>page.group==='PS4'))$('group').value='PS4';
    $('type').replaceChildren(...Object.entries(catalog.types).map(([type,label])=>option(type,label)));
    choosePages();updatePreview();renderLibrary();
    $('archive-status').textContent=catalog.archiveReady?'Archive connected · '+catalog.archiveRoot:'F: archive unavailable. Connect the archive drive before saving.';
    $('archive-status').classList.toggle('unavailable',!catalog.archiveReady);
  }catch(error){message('Could not connect to the local panel: '+error.message,true);$('save-button').disabled=true;}
}
init();
