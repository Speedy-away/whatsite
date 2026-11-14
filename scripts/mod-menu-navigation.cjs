'use strict';
const selector='/pages/mods-selector.html';
const pcSelector='/pages/pc-mods-selector.html';
function apply(file,html){
 if(file==='index.html')html=html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi,anchor=>/<strong>Game mods(?: \/ Mod Menus)?<\/strong>/i.test(anchor)&&/href="\/pages\/mods(?:-selector)?\.html"/.test(anchor)?anchor.replace(/href="[^"]+"/,'href="'+selector+'"').replace(/<strong>Game mods(?: \/ Mod Menus)?<\/strong>/i,'<strong>Game Mods / Mod Menus</strong>'):anchor);
 if(file==='index.html')html=html.replace(/(<div class="home-directory-grid">)([\s\S]*?)(<\/div>)/,(_all,open,body,close)=>{const cards=[...body.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(match=>match[0]);const at=cards.findIndex(card=>card.includes('href="'+selector+'"'));if(at<=0)return open+body+close;return open+'\n'+[cards[at],...cards.filter((_card,index)=>index!==at)].join('\n')+'\n'+close;});
 html=html.replace(/<a\b[^>]*href="(?:\/pages\/)?mods\.html"[^>]*>[\s\S]*?<\/a>/gi,anchor=>anchor.replace(/Game Mods(?! \/ Mod Menus)/gi,'Game Mods / Mod Menus'));
 if(file==='pages/mods.html'){
  html=html.replace(/(<h1\b[^>]*>)Game Mods(<\/h1>)/i,'$1Game Mods / Mod Menus$2');
  html=html.replace(/(<a\b[^>]*class="mod-back-link"[^>]*href=")\/pc\/("[^>]*>)/,'$1'+pcSelector+'$2');
  html=html.replace(/<nav class="guide-breadcrumb mod-breadcrumb"[\s\S]*?<\/nav>/,nav=>nav.replace('href="/pc/"','href="'+pcSelector+'"').replace('>Mods / Mod Menus<','>Game Mods / Mod Menus<'));
 }
 return html;
}
module.exports={apply,selector,pcSelector};
