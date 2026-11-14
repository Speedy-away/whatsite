'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {contained} = require('./console-expansion-archive.cjs');
const MANIFEST = 'docs/download-panel-entries.json';
const TYPES = {menu:'Mod menus',cheat:'Cheats / trainers',script:'Scripts',payload:'Payloads',tool:'Tools',app:'Apps / homebrew',game:'Games',source:'Source code'};
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const readEntries = root => fs.existsSync(path.join(root, MANIFEST)) ? JSON.parse(fs.readFileSync(path.join(root, MANIFEST), 'utf8')).entries : [];
function groupFor(file) {
  if (file.startsWith('games/')) return 'Free cheats';
  if (file.startsWith('mods/')) return 'PC game mods';
  const platform = file.match(/^console\/(?:mods\/)?([^/]+)/)?.[1];
  return platform ? ({ps4:'PS4',ps5:'PS5',ps3:'PS3',xbox360:'Xbox 360',psvita:'PS Vita',retro:'Retro consoles','nintendo-switch':'Nintendo Switch','nintendo-switch-2':'Nintendo Switch 2',steamdeck:'Steam Deck','xbox-one-series':'Xbox One / Series'}[platform] || 'Console') : 'PC / downloads';
}
function allowedPage(file, html) {
  return /^(?:console|games|mods|pc|games-downloads)\/[a-zA-Z0-9_./-]+\.html$/.test(file) &&
    !file.split('/').includes('..') && !/\b(?:host|whatsite-ps[45])[^/]*\.html$/i.test(file) &&
    !/<meta\b[^>]*http-equiv\s*=\s*["']?refresh/i.test(html) && /<main\b/i.test(html) && /<\/main>/i.test(html);
}
function listPages(root) {
  const result = [];
  function walk(folder) {
    if (!fs.existsSync(path.join(root,folder))) return;
    for (const item of fs.readdirSync(path.join(root,folder),{withFileTypes:true})) {
      const file = folder+'/'+item.name;
      if(item.isDirectory()) walk(file);
      else if(item.isFile() && file.endsWith('.html')) {
        const html=fs.readFileSync(contained(root,path.join(root,file)),'utf8');
        if (!allowedPage(file,html)) continue;
        const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || file).replace(/\s*\|.*$/,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').trim();
        result.push({file,title,group:groupFor(file)});
      }
    }
  }
  for(const folder of ['console','games','mods','pc','games-downloads']) walk(folder);
  return result.sort((a,b)=>a.group.localeCompare(b.group)||a.title.localeCompare(b.title)||a.file.localeCompare(b.file));
}
function card(entry) {
  const pins=[entry.version && 'Release '+entry.version,entry.gameVersion && 'Game '+entry.gameVersion,entry.firmware && 'Firmware '+entry.firmware,entry.region,entry.variant].filter(Boolean);
  return `<article class="panel-download-card" id="${esc(entry.id)}" data-search="${esc([entry.title,entry.description,...pins].join(' '))}">${entry.image ? `<img src="${esc(entry.image)}" alt="${esc(entry.title)}" loading="lazy">` : ''}<div class="panel-download-copy"><h3>${esc(entry.title)}</h3><p>${esc(entry.description).replace(/\r?\n/g,'<br>')}</p><p class="panel-download-pins">${pins.map(esc).join(' · ')}</p><div class="panel-download-links"><a class="btn btn-primary" href="${esc(entry.downloadUrl)}"${entry.downloadUrl.startsWith('/')?' download':' target="_blank" rel="noopener noreferrer"'}>Download${entry.variant?' '+esc(entry.variant):''}</a><a href="${esc(entry.sourceUrl)}" target="_blank" rel="noopener noreferrer">Source</a></div></div></article>`;
}
function apply(file,html,entries) {
  const relevant=(entries || []).filter(entry=>entry.page===file);
  if(!relevant.length || !allowedPage(file,html)) return html;
  html=html.replace(/<!-- download-panel:start -->[\s\S]*?<!-- download-panel:end -->\s*/g,'');
  const groups=new Map();
  for(const entry of relevant) {if(!groups.has(entry.type))groups.set(entry.type,[]);groups.get(entry.type).push(entry);}
  const block='<!-- download-panel:start -->\n<section class="panel-downloads container" id="added-downloads" aria-label="Downloads">'+[...groups].map(([type,items])=>`<h2>${esc(TYPES[type]||type)}</h2><div class="panel-download-grid">${items.map(card).join('\n')}</div>`).join('\n')+'</section>\n<!-- download-panel:end -->\n';
  // Place additions before the existing page footer when possible.
  html=html.replace(/<footer\b|<\/main>/i,match=>block+match);
  if(!html.includes('href="/assets/download-panel-cards.css"')) html=html.replace(/<\/head>/i,'<link rel="stylesheet" href="/assets/download-panel-cards.css">\n</head>');
  return html;
}
function create(root=path.resolve(__dirname,'..')) {const entries=readEntries(root);return (file,html)=>apply(file,html,entries);}
function sync(root=path.resolve(__dirname,'..')) {
  const entries=readEntries(root), files=[...new Set(entries.map(entry=>entry.page))];
  for(const file of files) {
    const target=contained(root,path.join(root,file));
    const html=fs.readFileSync(target,'utf8');
    if(!allowedPage(file,html)) throw Error('Page is no longer a supported download destination: '+file);
    const output=apply(file,html,entries);
    if(output!==html) fs.writeFileSync(target,output);
  }
  return files;
}
module.exports={MANIFEST,TYPES,esc,readEntries,groupFor,allowedPage,listPages,card,apply,create,sync};
if(require.main===module) console.log('Updated '+sync().length+' download pages.');
