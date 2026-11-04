'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const names={'file-synced':'FileSynced','unlinked':'UnLinked','applinked':'AppLinked','aptoide-tv':'Aptoide TV','aurora-store':'Aurora Store','launcher-manager':'Launcher Manager','mouse-toggle-firestick':'Mouse Toggle for Fire TV','kodi':'Kodi (32-bit)','kodi-64bit':'Kodi (64-bit)','mx-player':'MX Player Pro (MOD snapshot)','vlc-player':'VLC','9now':'9Now','filmrise':'FilmRise','peacock-tv':'Peacock TV','pluto-tv':'Pluto TV','tubi-tv':'Tubi (ad-free snapshot)','xumo':'Xumo','downloader':'Downloader','tv-launcher':'TV Launcher','wolf-launcher':'Wolf Launcher','atv-launcher':'ATV Launcher'};
const groups=[['App stores',['file-synced','unlinked','applinked','aptoide-tv']],['Media players',['kodi','kodi-64bit','mx-player','vlc-player']],['TV apps',['9now','filmrise','pluto-tv','tubi-tv']],['Tools & launchers',['downloader','launcher-manager','mouse-toggle-firestick','tv-launcher','wolf-launcher']]];
function link(url,label,cls=''){return '<a class="'+cls+'" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>';}
function appCard(app){
 const history=app.retainedSources?.map(s=>'<p>'+link(s.downloadURL||s.url,'Original source (unavailable)')+'</p>').join('')||'';
 if(app.delivery)return '<article class="app-card" id="app-'+app.id+'"><h4>'+esc(names[app.id]||app.name)+'</h4><p class="app-version">'+esc(app.delivery.version)+'</p><p>'+esc(app.delivery.description)+'</p><div class="app-links">'+link(app.delivery.url,app.delivery.label,'app-download')+'</div><details><summary>Original source</summary>'+history+'</details></article>';
 const archived=app.status==='archived'&&app.file;
 if(archived&&app.repair){
  const version=app.repair.mutable?'Publisher stable channel; local '+app.file.version+' snapshot':app.file.version;
  return '<article class="app-card" id="app-'+app.id+'"><h4>'+esc(names[app.id]||app.name)+'</h4><p class="app-version">'+esc(version)+'</p><p>'+esc(app.repair.description)+'</p><div class="app-links">'+link(app.downloadURL,'Download APK','app-download')+link(app.repair.source,'Source page')+'</div><details><summary>File &amp; original source</summary><p class="app-version">'+esc(app.file.name)+'</p><p>'+app.file.bytes+' bytes</p><p class="app-version">SHA-256: '+app.file.sha256+'</p>'+history+'</details></article>';
 }
 const version=app.repair?.mutable?'Publisher stable channel; local '+app.file.version+' snapshot':app.id==='downloader'?'Publisher link (unversioned)':archived?app.file.version.replace(/\.apk$/i,''):'Historical source listing';
 const source=app.repair?.source||(/\.apk(?:$|\?)/i.test(app.url)?app.source:app.url);
 return '<article class="app-card" id="app-'+app.id+'"><h4>'+esc(names[app.id]||app.name)+'</h4><p class="app-version">'+esc(version)+'</p><p>'+(app.id==='downloader'?'Publisher URL may change. A dated local snapshot is retained.':archived?'Archived source build. Check device requirements before installing.':'Original APK unavailable when checked. Source page retained.')+'</p><div class="app-links">'+(archived?link(app.downloadURL,'Download APK','app-download'):'')+link(source,'Source page')+'</div>'+(archived?'<details><summary>File details</summary><p class="app-version">'+esc(app.file.name)+'</p><p>'+app.file.bytes.toLocaleString('en-GB')+' bytes</p><p class="app-version">SHA-256: '+app.file.sha256+'</p></details>':'')+'</article>';
}
function render(template,catalog){
 const apk=template.slice(template.indexOf('        <!-- APK Time Section -->'),template.indexOf('        <!-- Installation Guides -->'));
 let guide=template.slice(template.indexOf('        <!-- Installation Guides -->'),template.indexOf('        <!-- Safety Warning -->'));
 guide=guide.replace(/\s*<li>On Home Page of Downloader, type:[\s\S]*?<\/li>\s*<li>Scroll down until you find[\s\S]*?<\/li>\s*<li>Click APK Time, then scroll down to the[\s\S]*?<\/li>/,'\n                            <li>Use the <a href="#apk-time">APK Time download on this page</a> to get the APK.</li>');
 guide=guide.replace('<strong>Note:</strong> Downloader is for Firestick Only! For Android phones and tablets, simply download the APK using your browser, then open the file to install.','For Android phones and tablets, download the APK using your browser, then open the file to install.');
 const cards=groups.map(([name,ids])=>'<section class="app-group"><h3>'+name.replaceAll('&','&amp;')+'</h3><div class="app-grid">'+ids.map(id=>appCard(catalog.apps.find(a=>a.id===id))).join('')+'</div></section>').join('');
 const content='<section class="page-header"><div class="container"><h1 class="page-title">APK Apps</h1><p class="page-subtitle">TV downloads, players and tools.</p></div></section><section class="section"><div class="container"><div id="tv"><h2>TV apps</h2><p>App stores, players and tools from the supplied collection. These are historical builds, not a latest-version feed.</p>'+cards+apk+'<p class="app-source">Collection: '+link(catalog.source,'Let’s Crack On downloads')+'. Existing APK Time and older files remain available.</p></div></div></section>'+guide;
 const start=template.indexOf('        <!-- Page Header -->'),end=template.indexOf('        <!-- Safety Warning -->');
 if(start<0||end<0)throw Error('Template markers missing');
 return (template.slice(0,start)+content+'\n'+template.slice(end)).replace('class="site-atmosphere"','class="site-atmosphere apk-directory"').replace('</head>','<link rel="stylesheet" href="/assets/apk-directory.css?v=1"></head>');
}
function main(){const html=render(fs.readFileSync(path.join(root,'scripts/templates/apk-page.html'),'utf8'),JSON.parse(fs.readFileSync(path.join(root,'docs/apk-app-catalog.json'))));fs.writeFileSync(path.join(root,'pages/apk.html'),require('./search-page-output.cjs').finish('pages/apk.html',html));console.log('Updated TV APK Apps.');}
module.exports={render,appCard};if(require.main===module)main();
