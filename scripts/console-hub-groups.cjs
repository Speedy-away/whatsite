// Group existing PS4/PS5 cards by destination without changing their content.
const {range}=require('./category-card-art.cjs');
function apply(file,html){
 const platform=/^console\/(ps[45])\/index\.html$/.exec(file)?.[1];
 if(!platform)return html;
 let desktopTools='';
 if(platform==='ps4'){
  const toolsOpening=/<section\b[^>]*\bid="helpful-desktop-tools"[^>]*>/.exec(html);
  const tools=toolsOpening&&range(html,toolsOpening.index,toolsOpening[0]);
  if(tools){desktopTools=html.slice(tools.start,tools.end);html=html.slice(0,tools.start)+html.slice(tools.end);}
 }
 const opening=/<section\b[^>]*\bid="start"[^>]*>/.exec(html);
 if(!opening)return html;
 const section=range(html,opening.index,opening[0]);if(!section)return html;
 const content=html.slice(section.start,section.end);
 const firstGroup=/<div\b[^>]*class="[^"]*\bconsole-hub-group\b[^>]*>/.exec(content);
 const tail=content.match(/<\/div>\s*<\/section>$/);if(!firstGroup||!tail)return html;
 const cards=[...content.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(m=>m[0]);
 const groups={mods:[],games:[],homebrew:[],setup:[]};
 for(const card of cards){
  const key=/href="\/console\/ps[45]\/(?:jailbreaks|y2jb)\.html/.test(card)?'setup':
   /href="\/console\/ps4\/goldhen\.html/.test(card)?'homebrew':
   /href="\/console\/(?:mods\/ps4\/|ps5\/mods\.html|ps[45]\/game-patches\.html)/.test(card)?'mods':
   /href="\/console\/ps[45]\/(?:game-downloads|free-shops)\.html/.test(card)?'games':'homebrew';
  groups[key].push(card);
 }
 groups.mods.sort((a,b)=>Number(a.includes('data-game-patches-entry'))-Number(b.includes('data-game-patches-entry')));
 groups.games.sort((a,b)=>Number(a.includes('data-free-shops-card'))-Number(b.includes('data-free-shops-card')));
 const group=(id,title,cards)=>cards.length?`<div class="console-hub-group" id="${id}"><p class="console-hub-group-label">${title}</p><div class="games-grid console-hub-library">${cards.join('\n')}</div></div>`:'';
 const grouped=group('console-hub-mods','Game mods / Mod Menus',groups.mods)+group('console-hub-games','Game downloads &amp; free shops',groups.games)+desktopTools+
  (groups.setup.length?`<div class="console-hub-group console-hub-setup" id="console-hub-setup"><div class="console-hub-group-heading"><p class="console-hub-group-label">${platform==='ps4'?'Firmware &amp; jailbreak':'Set up your '+platform.toUpperCase()}</p><span>Check your installed firmware before choosing a route.</span></div><div class="games-grid console-hub-setup-grid">${groups.setup.join('\n')}</div></div>`:'');
 const updated=content.slice(0,firstGroup.index)+grouped+tail[0];
 return html.slice(0,section.start)+updated+html.slice(section.end);
}
module.exports={apply};
