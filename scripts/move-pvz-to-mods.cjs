'use strict';
const fs=require('node:fs'),path=require('node:path'),art=require('./category-card-art.cjs');
const root=path.resolve(__dirname,'..');
function move(downloads,mods,detail){
 const card=art.cards(downloads).find(c=>/Fusion mods for PvZ/.test(c.html));
 if(card){
  const moved=card.html.replace('class="game-card"','class="game-card" data-mod="plants vs zombies pvz fusion pvz2 fan mods hybrids"').replace('href="plants-vs-zombies.html"','href="/games-downloads/plants-vs-zombies.html"').replace('View Downloads','View Mods');
  downloads=downloads.slice(0,card.start)+downloads.slice(card.end);
  if(!art.cards(mods).some(c=>c.html.includes('/games-downloads/plants-vs-zombies.html')))mods=mods.replace('<div class="games-grid">','<div class="games-grid">\n'+moved);
 }
 detail=detail.replace('<a href="index.html" class="btn btn-outline">','<a href="/pages/mods.html" class="btn btn-outline">').replace(/\bAll Downloads\b/,'Game Mods');
 return {downloads,mods,detail};
}
function main(){
 const files=['games-downloads/index.html','pages/mods.html','games-downloads/plants-vs-zombies.html'];
 const result=move(...files.map(f=>fs.readFileSync(path.join(root,f),'utf8')));
 for(const [i,key]of ['downloads','mods','detail'].entries())fs.writeFileSync(path.join(root,files[i]),require('./page-search-metadata.cjs').transform(files[i],result[key]).html);
 console.log('Plants vs Zombies card moved to Game Mods; original game/download URLs retained.');
}
module.exports={move};if(require.main===module)main();
