'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const labels={'call-of-duty':'Call of Duty','black-ops-1':'Black Ops 1','black-ops-2':'Black Ops 2','black-ops-3':'Black Ops 3','gta5':'GTA V','gta-v':'GTA V','gta-iv':'GTA IV','gta4':'GTA IV','rdr2':'Red Dead Redemption 2','multicod':'MultiCOD · supported games','install':'Installation guide','online':'Los Santos Online','menus':'Menu directory'};
const url=file=>'/'+file.replace(/index\.html$/,'');
function heading(file,html){
 const slug=path.posix.basename(file==='index.html'?file:file.replace(/\/index\.html$/,'')).replace(/\.html$/,'');
 if(labels[slug])return labels[slug];
 const source=html??(fs.existsSync(path.join(root,file))?fs.readFileSync(path.join(root,file),'utf8'):'');
 const title=source.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replace(/^Call of Duty:\s*/,'').replace(/\s*·\s*(?:PS[345]|Xbox)[\s\S]*$/,'').replace(/\s+(?:Mods for PS[345]|Resources)$/,'');
 return title||slug.split('-').map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' ');
}
function trail(file,html){
 const rows=[['/','Home']];
 if(file.startsWith('console/')){
  rows.push(['/console/','Console'],['/console/mods/','Mods / Mod Menus']);
  if(file.startsWith('console/mods/ps4/'))rows.push(['/console/mods/ps4/','PS4/PS5']);
  else if(file.startsWith('console/ps3/'))rows.push(['/console/ps3/mods.html','PS3']);
  else if(file.startsWith('console/xbox360/'))rows.push(['/console/xbox360/mods.html','Xbox 360']);
  else if(file.startsWith('console/nintendo-switch/'))rows.push(['/console/nintendo-switch/mods.html','Nintendo Switch']);
  else if(file.startsWith('console/retro/wii/'))rows.push(['/console/retro/wii.html','Wii']);
  else if(file.startsWith('console/retro/3ds'))rows.push(['/console/retro/3ds.html','Nintendo 3DS']);
  else if(file.startsWith('console/wiiu/'))rows.push(['/console/wiiu/mods.html','Wii U']);
  else if(file.startsWith('console/ps5/'))rows.push(['/console/ps5/','PS5']);
 }else rows.push(['/pc/','PC'],['/pages/mods.html','Mods / Mod Menus']);
 const parts=file.split('/');
 for(let i=2;i<parts.length;i++){
  const parent=parts.slice(0,i).join('/')+'/index.html';
  if(!/(?:mods|discord-mods)\//.test(parent)||!fs.existsSync(path.join(root,parent)))continue;
  const href=url(parent);if(!rows.some(row=>row[0]===href))rows.push([href,heading(parent)]);
 }
 const current=url(file),existing=rows.findIndex(row=>row[0]===current);
 if(existing>=0)rows.splice(existing+1);else rows.push([current,heading(file,html)]);
 return rows;
}
function apply(file,html){
 const rows=trail(file,html),parent=rows.at(-2)||rows[0];
 const nav='<nav class="guide-breadcrumb mod-breadcrumb" aria-label="Breadcrumb"><ol>'+rows.map(([href,label],i)=>'<li>'+(i===rows.length-1?'<span aria-current="page">'+esc(label)+'</span>':'<a href="'+esc(href)+'">'+esc(label)+'</a>')+'</li>').join('')+'</ol></nav>';
 const back='<a class="mod-back-link" href="'+esc(parent[0])+'"><span aria-hidden="true">←</span> Back to '+esc(parent[1])+'</a>';
 // Replacing the complete component makes repeated builds idempotent.
 html=html.replace(/<a class="mod-back-link"[\s\S]*?<\/a>/g,'');
 if(/<(?:div|nav) class="[^"]*\bguide-breadcrumb\b/.test(html))return html.replace(/<(div|nav) class="[^"]*\bguide-breadcrumb\b[^>]*>[\s\S]*?<\/\1>/,back+nav);
 return html.replace(/<h1\b/,back+nav+'<h1');
}
module.exports={apply,trail};
