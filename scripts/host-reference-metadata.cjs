'use strict';
// Curated metadata for moved host landings and the two main console hubs only.
// Canonicals, redirect targets, executable scripts and visible content stay intact.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),host='https://speedy-away.github.io',main='https://whatwhatboy.com';
const profiles=new Map();
const common=['WWB HOST','PS4 PS5 host','console firmware compatibility','homebrew payloads','mods and mod menus'];
function add(file,title,description,keywords=[],platform=''){profiles.set(file,{title,description,keywords:[...new Set([...keywords,...common])],platform,redirect:true});}
add('hosts/index.html','WWB HOST | PS4 & PS5 Firmware, Payloads & Mods','Open WWB HOST to choose PS4 or PS5 firmware and browse compatible browser loaders, payloads, Mods / Mod Menus and game patches.');
add('hosts/karo/index.html','KARO Builds & Preserved Versions | WWB HOST','Open the preserved KARO build directory on WWB HOST. Match the exact console, firmware and original build before choosing a download.',['KARO builds','preserved console hosts']);
const routes={
 '':['Webhost | Firmware, Payloads & Mods','Choose exact firmware, then browse compatible browser loaders, payloads, Mods / Mod Menus and game patches.'],
 files:['File Manager','Open the console file-workspace resources on WWB HOST. Check the matching native service and installation requirements before managing files.'],
 'payload-manager':['Payload Manager','Browse payload-management resources on WWB HOST with their exact firmware, native-service and installation requirements.'],
 lua:['Lua Resources','Browse preserved Lua resources on WWB HOST. Match the documented console, game update and setup requirements before using a file.'],
 packages:['Package Resources','Browse package resources and installation notes on WWB HOST. Keep the original file version and console compatibility requirements.'],
 gta5:['GTA V Mods & Mod Menus','Open GTA V in the shared Mods / Mod Menus catalogue on WWB HOST, then choose the exact game update and menu build.'],
 rdr2:['RDR2 Mods & Mod Menus','Open Red Dead Redemption 2 in the shared Mods / Mod Menus catalogue on WWB HOST, then choose the exact update and menu build.'],
 'other-games':['Mods / Mod Menus','Open the shared game catalogue on WWB HOST. Choose a title, exact game update and menu version while keeping each original download.']
};
for(const platform of ['ps4','ps5']){
 const name=platform.toUpperCase();
 for(const [route,[label,description]]of Object.entries(routes))add('hosts/'+platform+'/'+(route?route+'/':'')+'index.html',name+' '+label+' | WWB HOST',name+': '+description,[name+' host','PlayStation '+platform.slice(-1),name+' '+label],platform);
 profiles.set('console/'+platform+'/index.html',{title:name+' Jailbreak Hosts, Homebrew & Game Mods | whatwhatboy',description:name+' firmware guides and homebrew resources, plus WWB HOST links for compatible browser loaders, payloads, Mods / Mod Menus and game patches.',keywords:[name+' firmware compatibility',name+' browser host',name+' homebrew',name+' payloads',name+' mods',name+' mod menus',name+' game patches',platform==='ps4'?'GoldHEN':'etaHEN','PlayStation '+platform.slice(-1),'WWB HOST','whatwhatboy'],platform,redirect:false});
}
const ps4Hub = profiles.get('console/ps4/index.html');
ps4Hub.description = 'PS4 14.02 or lower jailbreak guide, firmware compatibility, homebrew and game mods, plus WWB HOST links for browser loaders, payloads and patches.';
ps4Hub.keywords.unshift('PS4 WebKit exploit host', 'PS4 14.02 jailbreak', '14.02 jailbreak', 'PS4 jailbreak 14.02', 'PS4 14.02 or lower guide', 'PS4 browser jailbreak tutorial', 'PS4 offline jailbreak');
add('hosts/ps4/afterglow/index.html','PS4 WebKit Host | WWB HOST','Open the preserved PS4 browser-host entry on WWB HOST. Match its exact firmware and displayed loading requirements before starting.',['PS4 WebKit host','PS4 firmware compatibility'],'ps4');
add('hosts/ps4/cheats/index.html','PS4 GoldHEN Cheats | WWB HOST','Browse PS4 GoldHEN cheat resources on WWB HOST. Match the title ID, region and installed game update to each original file.',['GoldHEN cheats','PS4 title IDs','PS4 game updates'],'ps4');
add('hosts/ps4/firmware/index.html','PS4 Firmware Selection | WWB HOST','Open PS4 firmware selection on WWB HOST and read the exact browser-host and payload requirements for the selected firmware.',['PS4 firmware selection','PS4 browser host'],'ps4');
add('hosts/tools/ps4-trainer/index.html','PS4 Offline Trainer | WWB HOST','Open the PS4 Offline Trainer on WWB HOST. Choose the exact game, title ID and update, then follow the matching WebRTE requirements.',['PS4 Offline Trainer','WebRTE','PS4 title IDs'],'ps4');
add('hosts/tools/esp-flasher/index.html','ESP Web Flasher | WWB HOST','Open the browser-based ESP Web Flasher on WWB HOST. Select compatible hardware, firmware files and their documented flash offsets.',['ESP Web Flasher','ESP firmware files','browser serial tools']);
const decode=s=>String(s).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function transform(file,before){
 const profile=profiles.get(file);if(!profile)return null;
 const match=before.match(/(<head\b[^>]*>)([\s\S]*?)(<\/head>)/i);if(!match)return null;let head=match[2];
 const attribute=(tag,key)=>{const m=tag.match(new RegExp('(?:^|\\s)'+key+'\\s*=\\s*(["\'])([\\s\\S]*?)\\1','i'));return m?decode(m[2]):'';};
 const get=(kind,key)=>{for(const m of head.matchAll(/<meta\b[^>]*>/gi))if(attribute(m[0],kind).toLowerCase()===key)return attribute(m[0],'content');return '';};
 const canonical=[...head.matchAll(/<link\b[^>]*>/gi)].find(m=>attribute(m[0],'rel').toLowerCase()==='canonical')?.[0],url=attribute(canonical||'','href');
 if(!url.startsWith((profile.redirect?host:main)+'/')||profile.redirect&&!/http-equiv\s*=\s*["']refresh["']/i.test(head))return null;
 const newline=before.includes('\r\n')?'\r\n':'\n',append=tag=>{head+=(head.endsWith('\n')?'':newline)+'    '+tag+newline;};
 function meta(kind,key,value){let found=false;head=head.replace(/<meta\b[^>]*>/gi,tag=>{if(attribute(tag,kind).toLowerCase()!==key)return tag;if(found)return '';found=true;if(attribute(tag,'content')===value)return tag;const content=/\scontent\s*=\s*(["'])[\s\S]*?\1/i;return content.test(tag)?tag.replace(content,' content="'+escape(value)+'"'):tag.replace(/\/?>$/,' content="'+escape(value)+'">');});if(!found)append('<meta '+kind+'="'+key+'" content="'+escape(value)+'">');}
 const shared=main+'/assets/images/social/illustrated/whatwhatboy-playstation-v1.png',image=profile.platform||file==='hosts/index.html'?shared:get('property','og:image')||shared;
 const imageURL=new URL(image),local=path.join(root,imageURL.pathname),png=fs.openSync(local,'r'),header=Buffer.alloc(24);try{fs.readSync(png,header,0,24,0);}finally{fs.closeSync(png);}if(header.toString('hex',0,8)!=='89504e470d0a1a0a')throw Error('Expected preserved PNG preview: '+file);
 const width=header.readUInt32BE(16),height=header.readUInt32BE(20),alt=profile.title.split(' | ')[0]+' preview';
 let titleFound=false;head=head.replace(/(<title\b[^>]*>)[\s\S]*?(<\/title>)/gi,(_,open,close)=>{if(titleFound)return '';titleFound=true;return open+escape(profile.title)+close;});if(!titleFound)append('<title>'+escape(profile.title)+'</title>');
 const values=[['name','description',profile.description],['name','keywords',profile.keywords.join(', ')],['name','robots',profile.redirect?'noindex, follow':get('name','robots')||'index, follow'],['property','og:type','website'],['property','og:site_name',profile.redirect?'WWB HOST':'whatwhatboy'],['property','og:locale','en_US'],['property','og:url',url],['property','og:title',profile.title],['property','og:description',profile.description],['property','og:image',image],['property','og:image:secure_url',image],['property','og:image:type','image/png'],['property','og:image:width',String(width)],['property','og:image:height',String(height)],['property','og:image:alt',alt],['name','twitter:card','summary_large_image'],['name','twitter:url',url],['name','twitter:title',profile.title],['name','twitter:description',profile.description],['name','twitter:image',image],['name','twitter:image:alt',alt]];
 for(const [kind,key,value]of values)meta(kind,key,value);
 const noindex=profile.redirect||/noindex/i.test(get('name','robots')),schemaPattern=/<script\b[^>]*\bid=["']site-page-schema["'][^>]*>([\s\S]*?)<\/script>/gi;
 if(noindex)head=head.replace(schemaPattern,'');
 else{
  const existing=[...head.matchAll(schemaPattern)][0],schema=existing?JSON.parse(existing[1]):{'@context':'https://schema.org','@graph':[]},graph=Array.isArray(schema['@graph'])?schema['@graph']:[];
  const website=graph.find(x=>x['@type']==='WebSite')||{'@type':'WebSite'},page=graph.find(x=>x['@type']==='WebPage')||{'@type':'WebPage'};
  Object.assign(website,{'@id':main+'/#website',url:main+'/',name:'whatwhatboy'});
  Object.assign(page,{'@id':url+'#webpage',url,name:profile.title,description:profile.description,keywords:profile.keywords.join(', '),image,isPartOf:{'@id':main+'/#website'},primaryImageOfPage:{'@type':'ImageObject',contentUrl:image,url:image,description:alt,encodingFormat:'image/png',width,height}});
  if(!graph.includes(website))graph.unshift(website);if(!graph.includes(page))graph.push(page);schema['@graph']=graph;
  const tag='<script id="site-page-schema" type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script>';let found=false;
  head=head.replace(schemaPattern,()=>{if(found)return '';found=true;return tag;});if(!found)append(tag);
 }
 const html=before.replace(match[0],()=>match[1]+head+match[3]);
 return {html,metadata:{page:file,title:profile.title,description:profile.description,keywords:profile.keywords.join(', '),canonical:url,noindex,redirect:profile.redirect,image,structuredData:noindex?null:'WebPage'},skipped:false};
}
module.exports={transform,files:[...profiles.keys()]};
