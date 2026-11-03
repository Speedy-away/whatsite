const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),manifestPath=path.join(root,'docs/optimized-category-covers.json');
let cache,stamp;
function manifest(){if(!fs.existsSync(manifestPath))return {images:{}};const stat=fs.statSync(manifestPath),next=stat.mtimeMs+':'+stat.size;if(stamp!==next){cache=JSON.parse(fs.readFileSync(manifestPath,'utf8'));stamp=next;}return cache;}
function apply(file,html){
 if(!require('./site-public-pages.cjs').eligible(file)||require('./page-search-tags.cjs').protectedFile(file,html))return html;
 const images=manifest().images,reverse=new Map(Object.entries(images).flatMap(([original,item])=>item.variants.map(v=>[v.path,original])));
 return html.replace(/((?:(?:\.\.\/|\/)*)(?:(?:assets|free-keys)\/)?(?:console-guides|console-menu-catalog|ps3-catalog|mobile|home|console-directory|steamdeck|console-hubs|console-game-patches|switch-game-mods|console-themes|xbox360-library|key-page|style)\.css)(?:\?[^"']*)?(?=["'])/g,'$1?v=20261103-mobile-images-2').replace(/<img\b[^>]*>/gi,tag=>{
  if(!/\b(?:profile-avatar|avatar)\b/.test(tag))tag=tag.replace(/\bstyle=(["'])(.*?)\1/gi,(_,quote,value)=>'style='+quote+value.replace(/object-fit\s*:\s*cover/gi,'object-fit:contain').replace(/max-width\s*:\s*(\d+)px/gi,'max-width:min($1px,100%)')+quote);
  const src=tag.match(/\bsrc=["']([^"']*)["']/)?.[1];let original=tag.match(/\bdata-original-image=["']([^"']*)["']/)?.[1]||reverse.get(src)||src;
  if(!images[original])try{const url=new URL(src,'https://whatwhatboy.com/'+file);if(url.origin==='https://whatwhatboy.com')original=reverse.get(url.pathname)||decodeURIComponent(url.pathname);}catch{}
  const item=images[original];if(!item)return tag;
  const variants=[...new Map(item.variants.map(v=>[v.width,v])).values()],last=variants.at(-1),srcset=variants.map(v=>v.path+' '+v.width+'w').join(', ');
  const declaredWidth=Number(tag.match(/\bwidth=["'](\d+)["']/)?.[1]);
  const sizes=declaredWidth>0&&declaredWidth<=160?declaredWidth+'px':'(max-width: 600px) calc(100vw - 48px), (max-width: 1000px) 45vw, 480px';
  let output=tag.replace(/\s(?:srcset|sizes|data-original-image)=["'][^"']*["']/g,'').replace(/\bsrc=["'][^"']*["']/,'src="'+last.path+'"');
  if(!/\bwidth=/.test(output))output=output.replace(/>$/,' width="'+last.width+'">');
  if(!/\bheight=/.test(output))output=output.replace(/>$/,' height="'+last.height+'">');
  if(!/\bdecoding=/.test(output))output=output.replace(/>$/,' decoding="async">');
  return output.replace(/>$/,' srcset="'+srcset+'" sizes="'+sizes+'" data-original-image="'+original+'">');
 });
}
module.exports={apply};
