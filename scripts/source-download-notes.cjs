'use strict';
// Visible distinctions for publisher packages and mutable upstream downloads.
function annotate(html,name,entries){
  const local=new Map(entries.map(entry=>[entry.local,entry]));
  const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  return html.replace(/<a\b([^>]*\bhref=(["'])(.*?)\2[^>]*)>([\s\S]*?)<\/a>/gi,(whole,attributes,quote,href,body)=>{
    if(body.includes('source-download-note'))return whole;
    let entry;try{const url=new URL(href.replaceAll('&amp;','&'),'https://whatwhatboy.com/'+name);if(url.origin==='https://whatwhatboy.com')entry=local.get(decodeURIComponent(url.pathname));else entry=entries.find(e=>e.url===url.href);}catch{}
    if(!entry?.linkNote)return whole;
    return '<a'+attributes+'>'+body+' <small class="source-download-note">('+escape(entry.linkNote)+')</small></a>';
  });
}
module.exports={annotate};
