'use strict';
const {eligible,relativePath}=require('./site-public-pages.cjs');
function apply(file,html){
 file=relativePath(file);
 if(!eligible(file)||file.startsWith('hosts/')||/http-equiv=["']refresh/i.test(html))return html;
 const base='https://whatwhatboy.com/'+file;
 return html.replace(/<a\b[^>]*\bhref="([^"]*)"[^>]*>[\s\S]*?<\/a>/g,(anchor,href)=>{
  const opening=anchor.slice(0,anchor.indexOf('>')+1);
  if(/\bdownload(?:\s|=|>)/.test(opening))return anchor;
  let url;try{url=new URL(href.replaceAll('&amp;','&'),base);}catch{return anchor;}
  if(!['https://whatwhatboy.com','https://www.whatwhatboy.com'].includes(url.origin)||/^\/(?:downloads|assets)\//.test(url.pathname)||/\.[a-z0-9]+$/i.test(url.pathname)&&!url.pathname.endsWith('.html'))return anchor;
  let tag=opening.replace(/\s+target="[^"]*"/g,'').replace(/\s+rel="([^"]*)"/g,(_,rel)=>{const kept=rel.split(/\s+/).filter(v=>!['noopener','noreferrer'].includes(v));return kept.length?' rel="'+kept.join(' ')+'"':'';}).replace(/ \(opens in a new tab\)/gi,'');
  return tag+anchor.slice(opening.length).replaceAll('fa-external-link-alt','fa-arrow-right');
 }).replace('Console catalogues open in a new tab. Choose a game inside its console page.','Choose your console, then choose a game.');
}
module.exports={apply};
