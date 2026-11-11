'use strict';
const {eligible,relativePath}=require('./site-public-pages.cjs');
const providerLogos = {
 'dlpsgame.com': '/assets/images/game-directories/dlpsgame-logo.png',
 'vimm.net': '/assets/images/ps3-resources/vimm.png',
 'downloadgamepsp.org': '/assets/images/game-directories/downloadgamepsp-logo.png',
 'nswgame.com': '/assets/images/game-directories/nswgame-logo.png',
 'nswgf.com': '/assets/images/game-directories/nswgame-logo.png'
};
function providerLogo(url) {
 try { return providerLogos[new URL(url).hostname]; } catch { return undefined; }
}
function apply(file,html){
 file=relativePath(file);
 if(!eligible(file)||file.startsWith('hosts/')||/http-equiv=["']refresh/i.test(html))return html;
 html=html.replace(/<article\b[\s\S]*?<\/article>/g,card=>{
  if(!/<p>External game directory<\/p>/.test(card))return card;
  if(!card.includes('game-directory-card'))card=card.replace(/^(<article\b[^>]*class=")([^"]*)"/,'$1$2 game-directory-card"');
  const source = providerLogo(card.match(/href="(https:\/\/[^"]+)"/)?.[1]);
  if(source){
   card = card.replace(/^<article\b[^>]*>/, opening => {
    const label = card.match(/<h3>([^<]*)<\/h3>/)?.[1];
    const attributes = (opening.includes('data-card-art=') ? '' : ' data-card-art="fixed"') +
     (!label || opening.includes('data-search=') ? '' : ' data-search="' + label.toLowerCase().replaceAll('"','&quot;') + ' game directory game listings"');
    return opening.slice(0, -1) + attributes + '>';
   });
   const logo = '<div class="directory-cover directory-cover--provider"><img src="' + source + '" alt="" loading="lazy" decoding="async"></div>';
   if(/<div\b[^>]*class="[^"]*\bdirectory-cover\b/.test(card))card=card.replace(/<div\b[^>]*class="[^"]*\bdirectory-cover\b[^>]*>[\s\S]*?<\/div>/,logo);
   else if (/<img\b/.test(card)) card=card.replace(/<img\b[^>]*>/,logo);
   else card=card.replace(/^(<article\b[^>]*>)/,'$1'+logo);
  }
  return card;
 });
 const compactFixes = file === 'console/ps4/game-downloads.html' && html.includes('id="fpkg-fixes"');
 if (html.includes('game-directory-card') || compactFixes) {
  const stylesheet = '/assets/game-directory-cards.css?v=4';
  html = html.includes('/assets/game-directory-cards.css')
   ? html.replace(/\/assets\/game-directory-cards\.css(?:\?v=\d+)?/, stylesheet)
   : html.replace('</head>', '<link rel="stylesheet" href="' + stylesheet + '">\n</head>');
 }
 return html;
}
module.exports={apply,providerLogo};
