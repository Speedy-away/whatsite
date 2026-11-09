'use strict';
function apply(file,html){
 const platform=/^console\/(ps[45])\/(?:index|game-patches)\.html$/.exec(file)?.[1];if(!platform)return html;
 const href='/console/ps4/game-patches.html'+(platform==='ps5'?'#native-ps5-patches':'');
 if(file.endsWith('/game-patches.html')){
  const name=platform.toUpperCase();
  const crumbs='<a class="patch-back" href="/console/'+platform+'/">← Back to '+name+'</a><nav class="guide-breadcrumb patch-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/console/">Console</a> / <a href="/console/'+platform+'/">'+name+'</a> / <span aria-current="page">Game patches</span></nav>';
  html=html.replace(/<div class="guide-breadcrumb">[\s\S]*?<\/div>/,crumbs);
  html=html.replace(/<div class="hero-buttons">[\s\S]*?<\/div>/,hero=>hero.replace(/<a\b[^>]*href="\/pc\/"[^>]*>PC<\/a>/,''));
  if(platform==='ps4') html=html.replace(/<nav\b[^>]*class="[^"]*\bguide-nav\b[^>]*>[\s\S]*?<\/nav>/,nav=>
   nav.includes('href="/console/ps4/fpkg-fixes.html"')?nav:nav.replace('</nav>','<a href="/console/ps4/fpkg-fixes.html">FPKG\'s Fixes</a></nav>'));
 }
 html=html.replace(/<nav\b[^>]*class="[^"]*\bguide-nav\b[^>]*>[\s\S]*?<\/nav>/,nav=>nav.includes('href="'+href+'"')?nav:nav.replace('</nav>','<a href="'+href+'">Game patches</a></nav>'));
 if(!file.endsWith('/index.html')||html.includes('data-game-patches-entry'))return html;
 const card='<article class="guide-resource" data-game-patches-entry><img src="/assets/images/game-patches/bloodborne-official.jpg" alt="Bloodborne game artwork" loading="lazy"><h3>Game patches</h3><p>Browse PS4, PS4 Pro and native PS5 patches for FPS, graphics and gameplay. Check the title ID and game update.</p><div class="guide-links"><a href="'+href+'">Browse game patches <i class="fas fa-arrow-right" aria-hidden="true"></i></a></div></article>';
 if(html.includes('<div class="games-grid console-hub-library">')) return html.replace('<div class="games-grid console-hub-library">',grid=>grid+card);
 return html.replace(/<section\b[^>]*\bid="start"[^>]*>(?:(?!<\/section>)[\s\S])*?<div class="games-grid">/,start=>start+card);
}
module.exports={apply};
