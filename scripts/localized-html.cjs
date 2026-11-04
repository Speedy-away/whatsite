'use strict';
// Offset-based HTML processing preserves scripts, download attributes and technical opt-outs.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const origin='https://whatwhatboy.com';
const codes=['es','pt','fr','de','ru','tr','pl','it','zh','ja','ko','th','vi','id','hi','sr','nl','ka','ar','he'];
const native={en:'English',es:'Español',pt:'Português',fr:'Français',de:'Deutsch',ru:'Русский',tr:'Türkçe',pl:'Polski',it:'Italiano',zh:'简体中文',ja:'日本語',ko:'한국어',th:'ไทย',vi:'Tiếng Việt',id:'Indonesia',hi:'हिन्दी',sr:'Српски',nl:'Nederlands',ka:'ქართული',ar:'العربية',he:'עברית'};
const locales={en:'en_US',es:'es_ES',pt:'pt_BR',fr:'fr_FR',de:'de_DE',ru:'ru_RU',tr:'tr_TR',pl:'pl_PL',it:'it_IT',zh:'zh_CN',ja:'ja_JP',ko:'ko_KR',th:'th_TH',vi:'vi_VN',id:'id_ID',hi:'hi_IN',sr:'sr_RS',nl:'nl_NL',ka:'ka_GE',ar:'ar_AR',he:'he_IL'};
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const normalize=value=>value.replace(/\s+/g,' ').trim();
const entities={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' ',mdash:'—',ndash:'–',hellip:'…',copy:'©',reg:'®',trade:'™',rsquo:'’',lsquo:'‘',ldquo:'“',rdquo:'”',times:'×',middot:'·',euro:'€',pound:'£',bull:'•',rarr:'→'};
const decode=value=>value.replace(/&#x([a-f\d]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&([a-z]+);/gi,(all,n)=>entities[n]??all);
const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const tokenPattern=/<!--[\s\S]*?-->|<![^>]*>|<(script|style|code|pre|textarea|svg|canvas)\b(?:"[^"]*"|'[^']*'|[^'">])*>[\s\S]*?<\/\1\s*>|<\/?[a-z][\w:-]*\b(?:"[^"]*"|'[^']*'|[^'">])*>|[^<]+|</gi;
const attrPattern=/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g;
const voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
function attributes(tag){return Object.fromEntries([...tag.matchAll(attrPattern)].map(m=>[m[1].toLowerCase(),decode(m[3])]));}
function spans(html){
 const found=[],stack=[];
 for(const match of html.matchAll(tokenPattern)){
  const token=match[0],at=match.index;
  if(/^<!--|^<!|^<(script|style|code|pre|textarea|svg|canvas)\b/i.test(token))continue;
  const closing=/^<\/([\w:-]+)/.exec(token);
  if(closing){const i=stack.map(n=>n.tag).lastIndexOf(closing[1].toLowerCase());if(i>=0)stack.splice(i);continue;}
  const opening=/^<([\w:-]+)\b/.exec(token);
  if(opening){
   const tag=opening[1].toLowerCase(),attrs=attributes(token),skip=stack.some(n=>n.skip)||attrs.translate==='no'||/\bnotranslate\b/.test(attrs.class||'')||/\bdata-i18n-skip(?:\s|=|>)/i.test(token);
   if(!skip)for(const m of token.matchAll(attrPattern)){
    const name=m[1].toLowerCase(),meta=tag==='meta'&&name==='content'&&/^(?:description|keywords|og:title|og:description|og:image:alt|twitter:title|twitter:description|twitter:image:alt)$/.test(attrs.name||attrs.property||'');
    const input=tag==='input'&&name==='value'&&/^(button|submit|reset)$/.test(attrs.type||'');
    if(!meta&&!input&&!/^(?:alt|title|placeholder|aria-label|aria-description|aria-valuetext|data-tooltip)$/.test(name))continue;
    const source=normalize(decode(m[3]));if(source&&/[A-Za-z]/.test(source))found.push({start:at+m.index+m[0].indexOf(m[2])+1,end:at+m.index+m[0].length-1,source,raw:m[3],kind:'attribute',quote:m[2],context:meta?attrs.name||attrs.property:name});
   }
   if(!voids.has(tag)&&!token.endsWith('/>'))stack.push({tag,skip});
  }else if(!token.startsWith('<')&&!stack.some(n=>n.skip)){
   const source=normalize(decode(token));if(source&&/[A-Za-z]/.test(source))found.push({start:at,end:at+token.length,source,raw:token,kind:'text',context:stack.at(-1)?.tag||'text'});
  }
 }
 return found;
}
function canonical(html){return [...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attributes(m[0])).find(a=>a.rel==='canonical')?.href;}
function publicSource(name,html){return !codes.includes(name.split('/')[0])&&!/^(?:hosts\/|downloads\/(?!index\.html$))/.test(name)&&!/<meta\b[^>]*http-equiv=["']refresh["']/i.test(html)&&!/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)&&canonical(html)?.startsWith(origin+'/');}
function dictionary(root,code){const box={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'languages',code+'.js'),'utf8'),box,{timeout:1000});const table=box.window.__scoobyI18nQueue?.find(row=>row[0]===code)?.[1];if(!table)throw Error('Missing dictionary '+code);return table;}
function protection(names=[]){
 const literals=[...new Set(['whatwhatboy','GoldHEN','etaHEN','webMAN','multiMAN','PSNinja','CCAPI','RPCS3','PCSX2','Dolphin','Cemu','Xenia','PPSSPP','RetroArch','Atmosphère','Atmosphere','Hekate','Windows','Linux','macOS','Android','iOS','YouTube','Discord','Telegram','Instagram','Twitter','TikTok','GitHub','Call of Duty','Grand Theft Auto','PlayStation','Nintendo Switch','Steam Deck','Xbox','PS Vita','GameCube','Wii U','PS4','PS5','PS3','PS2','PSP','DEX','CEX','HEN','CFW','HFW','JSON','PKG','FPKG','SPRX','PRX','ELF','FTP','USB','SD','SHA-256','EBOOT','PARAM.SFO','Share','L1','R1','L2','R2','L3','R3','HDD','SSD','SMB','PC',...names])].filter(n=>n.length>1).sort((a,b)=>b.length-a.length);
 const escaped=literals.map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
 const pattern=new RegExp('https?:\\/\\/[^\\s<>"\']+|(?:[A-Z]:[\\\\/]|(?:\\.\\.?/|/))[\\w./\\\\-]+|\\b[a-fA-F0-9]{12,64}\\b|\\b(?:CUSA|PPSA|BLES|BLUS|NPUB|NPEB|SCUS|SLUS)[A-Z0-9-]+\\b|\\b[^\\s<>"\']+\\.(?:zip|rar|7z|pkg|fpkg|bin|elf|sprx|prx|self|vpk|pup|nro|rpx|wuhb|exe|dll|ini|json|xml|gsc|csc|lua|iso|txt|cfg|conf|cmd|bat)\\b|\\bv?\\d+(?:\\.\\d+)+(?:[a-z][\\w.-]*)?\\b|\\b\\d+(?:[.,]\\d+)?\\s*(?:MiB|GiB|KiB|MB|GB|KB|FPS|Hz)\\b|\\b(?:'+escaped+')\\b','g');
 const files=/\b[^\s<>"']+\.(?:zip|rar|7z|pkg|fpkg|bin|elf|sprx|prx|self|vpk|pup|nro|rpx|wuhb|exe|dll|ini|json|xml|gsc|csc|lua|iso|txt|cfg|conf|cmd|bat|3dsx|p3t|pbp|xbe|png|jpg|jpeg|webp|bmp|ttf|woff2?)\b/;
 const complete=new RegExp(files.source+'|\\b(?:CUSA|PPSA|BLES|BLUS|NPUB|NPEB|SCUS|SLUS)[A-Z0-9_-]+\\b|'+pattern.source,'g');
 return source=>{const values=[];const template=source.replace(complete,value=>{const i=values.push(value)-1;return 'ZXQ'+String(i).padStart(4,'0')+'QXZ';});return {template,values,id:hash(template).slice(0,20)};};
}
function restore(translated,values){
 const markers=translated.match(/ZXQ\d{4}QXZ/g)||[],expected=values.map((_,i)=>'ZXQ'+String(i).padStart(4,'0')+'QXZ');
 if(markers.length!==expected.length||new Set(markers).size!==expected.length||expected.some(m=>!markers.includes(m)))throw Error('Translation changed a protected literal');
 return translated.replace(/ZXQ(\d{4})QXZ/g,(_,i)=>values[+i]);
}
function urlFor(source,code){return code==='en'?source:origin+'/'+code+new URL(source).pathname;}
function alternateLinks(source){return ['en',...codes,'x-default'].map(code=>'<link rel="alternate" hreflang="'+code+'" href="'+urlFor(source,code==='x-default'?'en':code)+'">').join('\n');}
const schemaTextKeys=new Set(['name','description','headline','alternateName','keywords','articleSection','caption']);
function structuredStrings(source){const result=[];function walk(value,key){if(typeof value==='string'&&schemaTextKeys.has(key)&&/[A-Za-z]/.test(value))result.push(normalize(value));else if(Array.isArray(value))value.forEach(item=>walk(item,key));else if(value&&typeof value==='object')for(const[k,item]of Object.entries(value))walk(item,k);}for(const m of source.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))walk(JSON.parse(m[1]));return result;}
function mapTokens(source,visit){return source.replace(tokenPattern,token=>visit(token)??token);}
const sourceHash=value=>hash(String(value).replace(/\r\n/g,'\n'));
module.exports={origin,codes,native,locales,hash,sourceHash,normalize,decode,escape,attributes,spans,canonical,publicSource,dictionary,protection,restore,urlFor,alternateLinks,schemaTextKeys,structuredStrings,mapTokens};
