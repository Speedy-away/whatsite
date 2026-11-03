const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),manifestPath=path.join(root,'docs/optimized-category-covers.json');
let cache,stamp;
function manifest(){if(!fs.existsSync(manifestPath))return {images:{}};const stat=fs.statSync(manifestPath),next=stat.mtimeMs+':'+stat.size;if(stamp!==next){cache=JSON.parse(fs.readFileSync(manifestPath,'utf8'));stamp=next;}return cache;}
function apply(file,html){
 if(!require('./site-public-pages.cjs').eligible(file)||require('./page-search-tags.cjs').protectedFile(file,html))return html;
 const images=manifest().images,reverse=new Map(Object.entries(images).flatMap(([original,item])=>item.variants.map(v=>[v.path,original])));
 return html.replace(/(\/assets\/(?:console-guides|console-menu-catalog|ps3-catalog)\.css)\?[^"']*/g,'$1?v=20261103-images').replace(/<img\b[^>]*>/gi,tag=>{
  const src=tag.match(/\bsrc="([^"]*)"/)?.[1],original=reverse.get(src)||src,item=images[original];if(!item)return tag;
  const variants=[...new Map(item.variants.map(v=>[v.width,v])).values()],last=variants.at(-1),srcset=variants.map(v=>v.path+' '+v.width+'w').join(', ');
  let output=tag.replace(/\s(?:srcset|sizes|data-original-image)="[^"]*"/g,'').replace(/\bsrc="[^"]*"/,'src="'+last.path+'"');
  if(!/\bwidth=/.test(output))output=output.replace(/>$/,' width="'+last.width+'">');
  if(!/\bheight=/.test(output))output=output.replace(/>$/,' height="'+last.height+'">');
  if(!/\bdecoding=/.test(output))output=output.replace(/>$/,' decoding="async">');
  return output.replace(/>$/,' srcset="'+srcset+'" sizes="(max-width: 600px) calc(100vw - 48px), (max-width: 1000px) 45vw, 480px" data-original-image="'+original+'">');
 });
}
module.exports={apply};
