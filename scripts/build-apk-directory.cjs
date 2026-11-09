'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const names={'file-synced':'FileSynced','unlinked':'UnLinked','applinked':'AppLinked','aptoide-tv':'Aptoide TV','aurora-store':'Aurora Store','launcher-manager':'Launcher Manager','mouse-toggle-firestick':'Mouse Toggle for Fire TV','kodi':'Kodi (32-bit)','kodi-64bit':'Kodi (64-bit)','mx-player':'MX Player Pro (MOD snapshot)','vlc-player':'VLC','9now':'9Now','filmrise':'FilmRise','peacock-tv':'Peacock TV','pluto-tv':'Pluto TV','tubi-tv':'Tubi (ad-free snapshot)','xumo':'Xumo','downloader':'Downloader','tv-launcher':'TV Launcher','wolf-launcher':'Wolf Launcher','atv-launcher':'ATV Launcher'};
const groups=[['App stores',['file-synced','unlinked','applinked','aptoide-tv']],['Media players',['kodi','kodi-64bit','mx-player','vlc-player']],['TV apps',['9now','filmrise','pluto-tv','tubi-tv']],['Tools & launchers',['downloader','launcher-manager','mouse-toggle-firestick','tv-launcher','wolf-launcher']]];
function link(url,label,cls=''){return '<a class="'+cls+'" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>';}
function appCard(app){
 let {version, description, url, label} = app.delivery || {};
 if (!app.delivery && app.status === 'archived' && app.file) {
  version = app.file.version.replace(/\.apk$/i, '');
  if (app.repair?.mutable) version = 'Publisher stable channel; local '+app.file.version+' snapshot';
  description = app.repair?.description || 'Archived build. Check device requirements before installing.';
  if (app.id === 'downloader' && !app.repair) {
   version = 'Publisher link (unversioned)';
   description = 'Publisher URL may change. A dated local snapshot is retained.';
  }
  url = app.downloadURL;
  label = 'Download APK';
 }
 const action = url ? '<div class="app-links">'+link(url,label,'app-download')+'</div>' : '';
 return '<article class="app-card" id="app-'+app.id+'"><h4>'+esc(names[app.id]||app.name)+'</h4><p class="app-version">'+esc(version || 'Historical listing')+'</p><p>'+esc(description || 'Original APK unavailable when checked.')+'</p>'+action+'</article>';
}
function render(template,catalog){
 const apk=template.slice(template.indexOf('        <!-- APK Time Section -->'),template.indexOf('        <!-- Installation Guides -->'));
 let guide=template.slice(template.indexOf('        <!-- Installation Guides -->'),template.indexOf('        <!-- Safety Warning -->'));
 guide=guide.replace(/\s*<li>On Home Page of Downloader, type:[\s\S]*?<\/li>\s*<li>Scroll down until you find[\s\S]*?<\/li>\s*<li>Click APK Time, then scroll down to the[\s\S]*?<\/li>/,'\n                            <li>Use the <a href="#apk-time">APK Time download on this page</a> to get the APK.</li>');
 guide=guide.replace('<strong>Note:</strong> Downloader is for Firestick Only! For Android phones and tablets, simply download the APK using your browser, then open the file to install.','For Android phones and tablets, download the APK using your browser, then open the file to install.');
 const cards=groups.map(([name,ids])=>'<section class="app-group"><h3>'+name.replaceAll('&','&amp;')+'</h3><div class="app-grid">'+ids.map(id=>appCard(catalog.apps.find(a=>a.id===id))).join('')+'</div></section>').join('');
 const content='<section class="page-header"><div class="container"><h1 class="page-title">Tv/Movies apps</h1><p class="page-subtitle">Streaming apps, media players and tools for Fire TV and Android.</p>'+apk+'</div></section><section class="section"><div class="container"><div id="tv"><h2>Browse apps</h2><p>Browse archived builds from the collection below.</p>'+cards+'<p class="app-source">Collection: '+link(catalog.source,'Let’s Crack On downloads')+'</p></div></div></section>'+guide;
 const start=template.indexOf('        <!-- Page Header -->'),end=template.indexOf('        <!-- Safety Warning -->');
 if(start<0||end<0)throw Error('Template markers missing');
 return (template.slice(0,start)+content+'\n'+template.slice(end)).replace('class="site-atmosphere"','class="site-atmosphere apk-directory"').replace('</head>','<link rel="stylesheet" href="/assets/apk-directory.css?v=2"></head>');
}
function main(){const html=render(fs.readFileSync(path.join(root,'scripts/templates/apk-page.html'),'utf8'),JSON.parse(fs.readFileSync(path.join(root,'docs/apk-app-catalog.json'))));fs.writeFileSync(path.join(root,'pages/apk.html'),require('./search-page-output.cjs').finish('pages/apk.html',html));console.log('Updated Tv/Movies apps.');}
module.exports={render,appCard};if(require.main===module)main();
