'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),html=require('./localized-html.cjs');
const {revision:languageRevision}=require('./language-loader.cjs');
const configName='docs/i18n/page-translations.json';
function load(root,{estimateSource=false,previewPages=null,previewLanguages=null}={}){
 const file=path.join(root,configName);if(!fs.existsSync(file))return null;
 const manifest=JSON.parse(fs.readFileSync(file,'utf8')),strings=new Map(manifest.strings.map(row=>[row.source,row])),languages=new Map();
 const previewRequired=previewPages?new Set(manifest.pages.filter(page=>previewPages.includes(page.page)).flatMap(page=>page.strings).map(source=>strings.get(source)?.id).filter(Boolean)):null;
 for(const code of manifest.languages.filter(code=>!previewLanguages||previewLanguages.includes(code))){
  assert(html.codes.includes(code),'Unknown locale '+code);
  const cached=JSON.parse(fs.readFileSync(path.join(root,'languages/pages',code+'.json'),'utf8')),dictionary=html.dictionary(root,code);
  for(const [id,source]of Object.entries(manifest.segments)){
   if(previewRequired&&!previewRequired.has(id))continue;
   if(estimateSource&&!cached.translations[id])cached.translations[id]=source;
   const value=cached.translations[id];assert(typeof value==='string'&&value.trim(),'Missing translation '+code+': '+id);
   html.restore(value,(source.match(/ZXQ\d{4}QXZ/g)||[]).map((_,i)=>String(i)));
  }
  languages.set(code,{dictionary,translations:cached.translations});
 }
 const pages=new Map(manifest.pages.map(page=>[page.page,page])),routes=new Map();
 for(const page of pages.values()){routes.set(new URL(page.canonical).pathname,page.canonical);routes.set('/'+page.page,page.canonical);}
 return {root,manifest,strings,languages,pages,routes,shared:new Map(),preview:Boolean(previewPages||previewLanguages)};
}
function translate(ctx,source,code){
 if(code==='en')return source;
 const record=ctx.strings.get(html.normalize(source));
 // New authored source text remains in English until the next translation-cache refresh.
 // Keep the Pages build deployable while preserving the source text verbatim.
 if(!record)return source;
 if(record.literal)return source;
 const language=ctx.languages.get(code);
 if(record.dictionary){const value=language.dictionary[record.source];assert(typeof value==='string','Missing dictionary '+code+': '+record.source);return value;}
 return html.restore(language.translations[record.id],record.values);
}
function replaceEdits(source,edits){const parts=[];let cursor=0;for(const edit of edits.sort((a,b)=>a.start-b.start)){assert(edit.start>=cursor,'Overlapping localized HTML edits');parts.push(source.slice(cursor,edit.start),edit.value);cursor=edit.end;}parts.push(source.slice(cursor));return parts.join('');}
function localURL(ctx,value,page,code,{download=false}={}){
 if(!value||/^(?:data:|javascript:|mailto:|tel:|blob:)/i.test(value))return value;
 let parsed;try{parsed=new URL(value,page.canonical);}catch{return value;}
 if(parsed.origin!==html.origin)return value;
 const destination=ctx.routes.get(parsed.pathname);
 if(destination&&!download)return new URL(html.urlFor(destination,code)).pathname+parsed.search+parsed.hash;
 return parsed.pathname+parsed.search+parsed.hash;
}
function compactSearch(source,dictionary){
 const digest=value=>html.hash(value).slice(0,12);
 return source.replace(/<(?:article|div|a|li)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi,tag=>{
  const attrs=html.attributes(tag),marker=attrs['data-search-i18n'];if(!marker)return tag;
  const name=Object.hasOwn(attrs,'data-search')?'data-search':'data-library-search',value=attrs[name];if(!value)return tag;
  const [length,hash]=marker.split(':'),suffix=value.slice(-Number(length));assert.equal(digest(suffix),hash,'Stale multilingual search suffix');
  const base=value.slice(0,-Number(length));
  const localized=[];
  // Generic topic aliases are already in the selected runtime dictionary.
  for(const key of ['Game Mods','Mods / Mod Menus','Cheats & Mods','Emulators','Themes','Apps','Tools','Guides','Downloads','Game Downloads','Game patches','Save tools','Source Code','Free shops','Setup instructions','Firmware','Jailbreak','Multiplayer']){
   const text=dictionary[key];if(text&&suffix.includes(text.toLowerCase()))localized.push(text.toLowerCase());
  }
  const next=[base,...new Set(localized)].filter(Boolean).join(' ');
  return tag.replace(new RegExp('('+name+'=)(["\'])([\\s\\S]*?)\\2','i'),(_,prefix,quote)=>prefix+quote+html.escape(next).replaceAll("'",'&#39;')+quote).replace(/\sdata-search-i18n="[^"]*"/i,'');
 });
}
function shareStyles(ctx,source,page){
 return html.mapTokens(source,whole=>{
  const style=/^<style\b([^>]*)>([\s\S]*?)<\/style>$/i.exec(whole);if(!style)return whole;const [,attrs,css]=style;
  if(/\bid=|\bnonce=|\bscoped\b/i.test(attrs))return whole;
  const rewritten=css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi,(match,quote,value)=>{
   if(/^(?:[a-z]+:|\/\/|#)/i.test(value))return match;
   return 'url('+quote+new URL(value,page.canonical).href+quote+')';
  });
  const name='assets/locale-shared/'+html.hash(rewritten).slice(0,24)+'.css';ctx.shared.set(name,rewritten);
  const media=attrs.match(/\bmedia=(["'])([\s\S]*?)\1/i)?.[0];return '<link rel="stylesheet" href="/'+name+'"'+(media?' '+media:'')+'>';
 });
}
function shareSearch(ctx,source){
 const records={};let body=false;
 let output=html.mapTokens(source,token=>{
  if(/^<body\b/i.test(token)){body=true;return token;}
  if(/^<\/body>/i.test(token))return '<script>if(window.WhatsiteLocalizedSearch)WhatsiteLocalizedSearch.apply(document);</script>'+token;
  if(body&&/^<script\b/i.test(token))return '<script>if(window.WhatsiteLocalizedSearch)WhatsiteLocalizedSearch.apply(document);</script>'+token;
  if(!/^<[a-z][\w:-]*\b/i.test(token)||/^<(?:script|style|svg|code|pre|textarea)\b/i.test(token))return token;
  const values={};for(const m of token.matchAll(/\b(data-search|data-library-search)=(["'])([\s\S]*?)\2/gi))values[m[1]]=html.decode(m[3]);
  if(!Object.keys(values).length)return token;
  const id=html.hash(JSON.stringify(values)).slice(0,20);records[id]=values;
  return token.replace(/\b(data-search|data-library-search)=(["'])([\s\S]*?)\2/gi,(_,name,quote)=>name+'='+quote+quote).replace(/\sdata-search-i18n="[^"]*"/i,'').replace(/>$/,' data-localized-search="'+id+'">');
 });
 if(!Object.keys(records).length)return source;
 const data=JSON.stringify(records).replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
 const script='(function(w){var data='+data+';w.WhatsiteLocalizedSearch={apply:function(root){var nodes=root.querySelectorAll("[data-localized-search]");for(var i=0;i<nodes.length;i++){var n=nodes[i],v=data[n.getAttribute("data-localized-search")];if(!v)continue;for(var k in v)if(Object.prototype.hasOwnProperty.call(v,k))n.setAttribute(k,v[k]+" "+(n.textContent||""));n.removeAttribute("data-localized-search");}}};})(window);\n';
 const name='assets/locale-shared/search-'+html.hash(script).slice(0,24)+'.js';ctx.shared.set(name,script);
 output=output.replace(/<head\b[^>]*>/i,tag=>tag+'\n<script src="/'+name+'"></script>');return output;
}
function shareIcons(ctx,source){
 ctx.icons||=new Map();
 return html.mapTokens(source,token=>{
  const match=/^<svg\b([^>]*)>([\s\S]*)<\/svg>$/i.exec(token);if(!match||!(/\bdata-nav-icon=/.test(match[1])))return token;
  const attrs=html.attributes('<svg '+match[1]+'>'),graphics=[...match[1].matchAll(/\s(?:fill|stroke(?:-width|-linecap|-linejoin)?)=(["'])([\s\S]*?)\1/gi)].map(m=>m[0]).join(''),body='<g'+graphics+'>'+match[2]+'</g>',id='icon-'+html.hash(body).slice(0,20);ctx.icons.set(id,{body,viewBox:attrs.viewbox||'0 0 24 24'});
  const outer=match[1].replace(/\s(?:xmlns|fill|stroke(?:-width|-linecap|-linejoin)?)=(["'])([\s\S]*?)\1/gi,'');
  return '<svg'+outer+'><use href="/assets/locale-shared/navigation-icons.svg#'+id+'"></use></svg>';
 });
}
function schema(ctx,source,page,code){
 return source.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi,(_,open,json,close)=>{
  function walk(value,key){
   if(typeof value==='string'){
    if(html.schemaTextKeys.has(key)&&/[A-Za-z]/.test(value))return translate(ctx,value,code);
    if(key==='url'||key==='@id'||key==='item'){const url=localURL(ctx,value,page,code);return url.startsWith('/')?html.origin+url:url;}
    return value;
   }
   if(Array.isArray(value))return value.map(item=>walk(item,key));
   if(value&&typeof value==='object'){
    const result=Object.fromEntries(Object.entries(value).map(([k,item])=>[k,walk(item,k)]));
    if(/^(?:WebPage|CollectionPage|WebSite|Article|TechArticle)$/.test(result['@type']))result.inLanguage=code;
    return result;
   }
   return value;
  }
  return open+JSON.stringify(walk(JSON.parse(json))).replaceAll('<','\\u003c')+close;
 });
}
function render(ctx,page,source,code){
 assert(code==='en'||ctx.languages.has(code),'Unsupported locale');
 let output=source;
 if(code!=='en'){
  const edits=html.spans(source).map(span=>{
   const text=translate(ctx,span.source,code),lead=span.kind==='text'?(span.raw.match(/^\s*/)?.[0]||''):'',trail=span.kind==='text'?(span.raw.match(/\s*$/)?.[0]||''):'';
   let value=lead+html.escape(text)+trail;if(span.quote==="'")value=value.replaceAll("'",'&#39;');
   return {start:span.start,end:span.end,value};
  });
  output=replaceEdits(source,edits);
 }
 output=schema(ctx,output,page,code);
 const target=html.urlFor(page.canonical,code);
 output=output.replace(/<html\b[^>]*>/i,tag=>tag.replace(/\s(?:lang|dir|data-site-language|data-site-source)=["'][^"']*["']/gi,'').replace(/>$/,' lang="'+code+'" dir="'+(['ar','he'].includes(code)?'rtl':'ltr')+'" data-site-language="'+code+'" data-site-source="'+new URL(page.canonical).pathname+'">'));
 output=html.mapTokens(output,tag=>{
  if(!/^<link\b/i.test(tag))return tag;const attrs=html.attributes(tag);
  if(attrs.rel==='alternate'&&attrs.hreflang)return '';
  return attrs.rel==='canonical'?'<link rel="canonical" href="'+target+'">':tag;
 });
 output=html.mapTokens(output,tag=>{
  if(!/^<meta\b/i.test(tag))return tag;
  const attrs=html.attributes(tag);if(attrs.property==='og:url')return '<meta property="og:url" content="'+target+'">';
  if(attrs.property==='og:locale')return '<meta property="og:locale" content="'+html.locales[code]+'">';return tag;
 });
 if(code!=='en'){
  // Base keeps existing inline JavaScript's relative data requests on their original paths.
  output=html.mapTokens(output,tag=>/^<base\b/i.test(tag)?'':/^<head\b/i.test(tag)?tag+'\n<base href="'+new URL(page.canonical).pathname+'">':tag);
  output=html.mapTokens(output,tag=>{
   if(!/^<(?:a|link|img|source|video|audio|iframe|form)\b/i.test(tag))return tag;
   const attrs=html.attributes(tag),download=/\bdownload(?:\s|=|>)/i.test(tag);
   return tag.replace(/\b(href|src|action)=(["'])([\s\S]*?)\2/gi,(whole,attr,quote,raw)=>{
    if(/^<base|^<link\b[^>]*rel=["'](?:canonical|alternate)["']/i.test(tag))return whole;
    const value=html.decode(raw),next=localURL(ctx,value,page,code,{download:download||attr!=='href'||!/^<a\b/i.test(tag)});
    return attr+'='+quote+html.escape(next).replaceAll("'",'&#39;')+quote;
   });
  });
  output=shareStyles(ctx,output,page);
  output=shareIcons(ctx,shareSearch(ctx,output));
  output=html.mapTokens(output,token=>!token.startsWith('<')?token.replace(/[\r\n\t ]+/g,' '):token);
 }
 output=html.mapTokens(output,token=>{
  if(!/^<script\b/i.test(token))return token;
  return token.replace(/\bsrc=(["'])([^"']+)\1/i,(whole,quote,value)=>{
   const url=new URL(html.decode(value),page.canonical);
   if(url.origin!==html.origin||!/^\/(?:languages\/i18n\.js|assets\/(?:pc-ports|console-guide-dialog|console-setup-popups|console-topic-entry)\.js)$/.test(url.pathname))return whole;
   url.searchParams.set('rev',url.pathname==='/languages/i18n.js'?languageRevision:'20261104-static-seo');return 'src='+quote+html.escape(url.pathname+url.search)+quote;
  });
 });
 output=html.mapTokens(output,token=>/^<\/head>/i.test(token)?html.alternateLinks(page.canonical)+'\n'+token:token);
 const links=['en',...html.codes].map(lang=>'<a lang="'+lang+'" hreflang="'+lang+'" href="'+new URL(html.urlFor(page.canonical,lang)).pathname+'"'+(lang===code?' aria-current="page"':'')+'>'+html.native[lang]+'</a>').join(' · ');
 output=html.mapTokens(output,token=>/^<\/body>/i.test(token)?'<nav class="site-language-links" aria-label="'+html.escape(code==='en'?'Language':ctx.languages.get(code).dictionary.Language||html.native[code])+'" style="padding:16px;text-align:center;font-size:13px;line-height:2;overflow-wrap:anywhere">'+links+'</nav>\n'+token:token);
 return output;
}
function generate({root,output,rewrite=(value)=>value,estimate=false,context}={}){
 const ctx=context||load(root);if(!ctx)return {pages:0,bytes:0,sharedFiles:0};
 assert(!ctx.preview||estimate,'Preview contexts cannot publish a partially translated site');
 let bytes=0,count=0;const sitemaps=new Map(html.codes.map(code=>[code,[]]));
 for(const page of ctx.pages.values()){
  const original=fs.readFileSync(path.join(root,page.page),'utf8');
  // Page generators may update authored HTML before the translation manifest is regenerated.
  // Render the current source and keep untranslated/new segments in English until refresh.
  const deliveryFile=path.join(root,'docs/download-source-links.json'),delivery=fs.existsSync(deliveryFile)?JSON.parse(fs.readFileSync(deliveryFile,'utf8')).entries:[];
  const source=require('./source-download-notes.cjs').annotate(original,page.page,delivery);
  for(const code of ['en',...html.codes]){
   const rendered=rewrite(render(ctx,page,source,code),page.page),name=code==='en'?page.page:code+'/'+page.page;
   if(code!=='en'){bytes+=Buffer.byteLength(rendered);count++;sitemaps.get(code).push(html.urlFor(page.canonical,code));}else bytes+=Buffer.byteLength(rendered)-Buffer.byteLength(source);
   if(!estimate){const file=path.join(output,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,rendered);}
  }
 }
 const sitemapFiles=[];
 for(const [code,urls]of sitemaps){
  const name='sitemaps/'+code+'.xml',xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+urls.map(url=>'<url><loc>'+html.escape(url)+'</loc></url>').join('\n')+'\n</urlset>\n';bytes+=Buffer.byteLength(xml);sitemapFiles.push(html.origin+'/'+name);
  if(!estimate){fs.mkdirSync(path.join(output,'sitemaps'),{recursive:true});fs.writeFileSync(path.join(output,name),xml);}
 }
 if(ctx.icons?.size)ctx.shared.set('assets/locale-shared/navigation-icons.svg','<svg xmlns="http://www.w3.org/2000/svg">'+[...ctx.icons].map(([id,icon])=>'<symbol id="'+id+'" viewBox="'+html.escape(icon.viewBox)+'">'+icon.body+'</symbol>').join('')+'</svg>');
 for(const [name,source]of ctx.shared){const content=rewrite(source,name);bytes+=Buffer.byteLength(content);if(!estimate){const file=path.join(output,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);}}
 const index='<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+[html.origin+'/sitemap.xml',...sitemapFiles].map(url=>'<sitemap><loc>'+url+'</loc></sitemap>').join('\n')+'\n</sitemapindex>\n';bytes+=Buffer.byteLength(index);
 if(!estimate){fs.writeFileSync(path.join(output,'sitemap-index.xml'),index);const file=path.join(output,'robots.txt'),before=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'User-agent: *\nAllow: /\n';fs.writeFileSync(file,before.replace(/^Sitemap:.*$/gm,'').trimEnd()+'\nSitemap: '+html.origin+'/sitemap-index.xml\n');}
 return {pages:count,englishPages:ctx.pages.size,languages:html.codes.length,bytes,sharedFiles:ctx.shared.size};
}
if(require.main===module){const root=path.resolve(process.argv[2]||path.join(__dirname,'..')),output=path.resolve(process.argv[3]||path.join(__dirname,'../tmp/localized-site'));console.log(JSON.stringify(generate({root,output,estimate:process.argv.includes('--estimate')}),null,2));}
module.exports={load,translate,localURL,render,generate,compactSearch};
