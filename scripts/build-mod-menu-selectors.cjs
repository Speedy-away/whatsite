'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),nav=require('./mod-menu-navigation.cjs');
const pages=[{file:nav.selector.slice(1),title:'Game Mods / Mod Menus',intro:'Choose your platform.',back:'/',backLabel:'Back to home',cards:[['/console/mods/','gamepad','Console','Browse game mods and mod menus by console.'],[nav.pcSelector,'desktop','PC','Choose free cheats or game mods for PC.']]},{file:nav.pcSelector.slice(1),title:'PC',intro:'What would you like to browse?',back:nav.selector,backLabel:'Change platform',cards:[['/cheats/','crosshairs','Free Cheats','Free cheats and tools, organised by game.'],['/pages/mods.html','puzzle-piece','Game Mods / Mod Menus','Mods, menus, scripts and add-ons by game.']]}];
function build(){
 let home=fs.readFileSync(path.join(root,'index.html'),'utf8');home=nav.apply('index.html',home);fs.writeFileSync(path.join(root,'index.html'),home);
 const metadata=require('./page-search-metadata.cjs');
 for(const p of pages){
  const template=home.replace(/((?:href|src)=")([^"]*)"/g,(all,prefix,value)=>{if(/^(?:https?:|mailto:|tel:|data:|javascript:|\/)/i.test(value)||value==='#main-content')return all;const url=new URL(value,'https://whatwhatboy.com/');return prefix+url.pathname+url.search+url.hash+'"';});
  let html=template.replace(/<main\b[^>]*>[\s\S]*?<\/main>/,`<main class="main-content" id="main-content" tabindex="-1"><section class="mod-platform-selector container" aria-labelledby="selector-title"><a class="selector-back" href="${p.back}"><span aria-hidden="true">←</span> ${p.backLabel}</a><h1 id="selector-title">${p.title}</h1><p class="selector-intro">${p.intro}</p><div class="mod-platform-grid">${p.cards.map(([href,icon,title,description])=>`<a class="mod-platform-option" href="${href}"><i class="fas fa-${icon}" aria-hidden="true"></i><div><h2>${title}</h2><p>${description}</p></div><i class="fas fa-arrow-right" aria-hidden="true"></i></a>`).join('')}</div></section></main>`);
  html=html.replace(/<link rel="canonical" href="[^"]+">/,'<link rel="canonical" href="https://whatwhatboy.com/'+p.file+'">');
  html=html.replace('class="home-page site-shell"','class="home-page site-shell mod-selector-page"');
  html=html.replace('</head>','<link rel="stylesheet" href="/assets/mod-platform-selector.css?v=1"></head>');
  html=metadata.transform(p.file,html).html;fs.mkdirSync(path.dirname(path.join(root,p.file)),{recursive:true});fs.writeFileSync(path.join(root,p.file),html);
 }
 const pc='pages/mods.html',html=fs.readFileSync(path.join(root,pc),'utf8');fs.writeFileSync(path.join(root,pc),metadata.transform(pc,nav.apply(pc,html)).html);
 return pages.map(p=>p.file);
}
module.exports={build,pages};if(require.main===module)console.log('Built selector pages: '+build().join(', '));
