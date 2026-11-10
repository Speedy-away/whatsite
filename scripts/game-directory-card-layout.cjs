'use strict';
const {eligible,relativePath}=require('./site-public-pages.cjs');
function apply(file,html){
 file=relativePath(file);
 if(!eligible(file)||file.startsWith('hosts/')||/http-equiv=["']refresh/i.test(html))return html;
 html=html.replace(/<article\b[\s\S]*?<\/article>/g,card=>{
  if(!/<p>External game directory<\/p>/.test(card))return card;
  if(!card.includes('game-directory-card'))card=card.replace(/^(<article\b[^>]*class=")([^"]*)"/,'$1$2 game-directory-card"');
  if(/href="https:\/\/dlpsgame\.com\//.test(card)){
   const logo='<div class="directory-cover" data-directory-cover="dlpsgame-logo"><img src="/assets/images/game-directories/dlpsgame-logo.png" alt="DLPSGame · Link Download Free" width="317" height="80" loading="lazy" decoding="async"></div>';
   if(/<div\b[^>]*class="[^"]*\bdirectory-cover\b/.test(card))card=card.replace(/<div\b[^>]*class="[^"]*\bdirectory-cover\b[^>]*>[\s\S]*?<\/div>/,logo);
   else card=card.replace(/<img\b[^>]*>/,logo);
  }
  return card;
 });
 const compactFixes = file === 'console/ps4/game-downloads.html' && html.includes('id="fpkg-fixes"');
 if((html.includes('game-directory-card') || compactFixes)&&!html.includes('/assets/game-directory-cards.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/game-directory-cards.css?v=1">\n</head>');
 if(compactFixes)html=html.replace('/assets/game-directory-cards.css?v=1','/assets/game-directory-cards.css?v=2');
 if(html.includes('class="library-card-brand"'))html=html.replace(/\/assets\/game-directory-cards\.css\?v=\d+/,'/assets/game-directory-cards.css?v=3');
 return html;
}
module.exports={apply};
