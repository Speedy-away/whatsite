// Group existing PS4/PS5 cards by destination without changing their content.
const {range}=require('./category-card-art.cjs');
function apply(file,html){
 const platform=/^console\/(ps[45])\/index\.html$/.exec(file)?.[1];
 if(!platform)return html;
 // The helper pass reinserts this after the library, including when an old
 // grouped hub put it inside #start.
 html=html.replace(/<section\b[^>]*\bid="helpful-desktop-tools"[^>]*>[\s\S]*?<\/section>/, '');
 const opening=/<section\b[^>]*\bid="start"[^>]*>/.exec(html);
 if(!opening)return html;
 const section=range(html,opening.index,opening[0]);if(!section)return html;
 const content=html.slice(section.start,section.end);
 const firstGroup=/<div\b[^>]*class="[^"]*\bconsole-hub-group\b[^>]*>/.exec(content) ||
  /<div class="games-grid">/.exec(content);
 const tail=content.match(/<\/div>\s*<\/section>$/);if(!firstGroup||!tail)return html;
 const cards=[...content.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(m=>m[0]);
 const setup=cards.filter(card=>/href="\/console\/ps[45]\/(?:jailbreaks|y2jb)\.html/.test(card));
 const group=(id,title,cards)=>cards.length?`<div class="console-hub-group" id="${id}"><p class="console-hub-group-label">${title}</p><div class="games-grid console-hub-library">${cards.join('\n')}</div></div>`:'';
 const gameRoutes = [platform === 'ps4' ? '/console/mods/ps4/' : '/console/ps5/mods.html',
  `/console/${platform}/save-tools.html`, '/console/ps4/game-downloads.html', '/console/ps4/game-patches.html'];
 const gameOrder = card => gameRoutes.findIndex(route => card.includes(`href="${route}"`) || card.includes(`href="${route}#`));
 const resources = cards.filter(card => !setup.includes(card));
 const isApps = card => card.includes(`href="/console/${platform}/apps.html"`);
 const library = group('console-hub-games', 'Games', resources.filter(card => gameOrder(card) >= 0).sort((a,b) => gameOrder(a)-gameOrder(b))) +
  group('console-hub-more', 'More', resources.filter(card => gameOrder(card) < 0).sort((a,b) => Number(isApps(b))-Number(isApps(a))));
 const setupSection=setup.length?`<section class="section" id="console-hub-setup"><div class="container"><div class="section-header"><h2 class="section-title">Firmware &amp; jailbreak</h2><p class="section-subtitle">Check your installed firmware before choosing a route.</p></div><div class="games-grid console-hub-setup-grid">${setup.join('\n')}</div></div></section>`:'';
 const updated=content.slice(0,firstGroup.index)+library+tail[0]+setupSection;
 return html.slice(0,section.start)+updated+html.slice(section.end);
}
module.exports={apply};
