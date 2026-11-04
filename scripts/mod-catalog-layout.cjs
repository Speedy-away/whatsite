'use strict';
const {relativePath,eligible}=require('./site-public-pages.cjs');
const stylesheet='<link rel="stylesheet" href="/assets/mod-catalog-layout.css?v=1">';
function isModPage(file){
 file=relativePath(file);
 return eligible(file)&&!file.startsWith('hosts/')&&(/(?:^|\/)(?:mods|discord-mods)(?:\/|\.html$)/.test(file)||/(?:^|\/)(?:game-mods|3ds-mods|mod-menus)\.html$/.test(file));
}
function removeGenericMediaLinks(html){
 return html.replace(/<article\b[\s\S]*?<\/article>/g,card=>card.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g,anchor=>{
  const label=anchor.replace(/<[^>]*>/g,'').replace(/[→↗]/g,'').trim();
  return /^Guide (?:&amp;|&) media$/i.test(label)&&/data-guide-open|href="#guide-/.test(anchor)?'':anchor;
 }));
}
function apply(file,html){
 if(!isModPage(file)||/http-equiv=["']refresh|name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)||!/class="[^"]*\bmain-content\b/.test(html))return html;
 html=html.replace(/<body\b[^>]*>/,tag=>tag.includes('data-mod-catalog')?tag:tag.replace(/>$/,' data-mod-catalog>'));
 if(!html.includes('/assets/mod-catalog-layout.css'))html=html.replace('</head>',stylesheet+'\n</head>');
 // Cross-platform navigation already lives in the sidebar, outside the download actions.
 html=html.replace(/<div class="hero-buttons">[\s\S]*?<\/div>/,hero=>hero.replace(/<a\b[^>]*href="\/(?:pc|console)\/"[^>]*>(?:PC|Console)<\/a>/g,''));
 return require('./mod-breadcrumbs.cjs').apply(relativePath(file),removeGenericMediaLinks(html));
}
module.exports={apply,isModPage,removeGenericMediaLinks};
