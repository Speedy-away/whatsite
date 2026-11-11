// Exact subjects taught by these guides; avoid unrelated protocol or platform aliases.
const source=require('../i18n-tools/transfer-guide-source.json');
const overrides={};
const shared=['FTP setup guide','FileZilla Client','phone FTP client','FTPManager','Solid Explorer','electerm','iPhone FTP','iPad FTP','Android FTP','HarmonyOS FTP','App Store FTP app','Google Play FTP app','Huawei AppGallery FTP app','USB file transfer','exFAT USB drive','FAT32 4 GiB file limit','local IPv4 address','copy and paste files','USB mount /mnt/usb0','FTP upload troubleshooting'];
function keywords(platform){
 const name=platform.toUpperCase();
 const specific=platform==='ps4'?['GoldHEN FTP server','GoldHEN FTP port 2121','PS4-Xplorer 2.07','PS4 file manager']:['ftpsrv PS5 port 2121','etaHEN FTP port 1337','ezRemote Client 2.18','ezRemote loader 1.01','PS5 file manager','PS5 elfldr setup'];
 return [name+' file transfer guide','FileZilla '+name,name+' FTP setup',name+' USB transfer',name+' IP address',name+' phone file transfer',name+' file management',...shared,...specific];
}
for(const platform of ['ps4','ps5']){
 const name=platform.toUpperCase(),file='console/'+platform+'/file-transfer-guide.html';
 overrides[file]={
  title:source[platform+'Title']+' | whatwhatboy',
  description:source[platform+'Summary'],
  keywords:keywords(platform),exactKeywords:true,
  breadcrumbs:[{name:'Home',url:'/'},{name:'Console',url:'/console/'},{name:name,url:'/console/'+platform+'/'},{name:source[platform+'Title'],url:'/'+file}],
  article:{dateModified:'2026-11-11'}
 };
}
overrides['console/download-center/index.html']={
 title:source.downloads+' | whatwhatboy',description:source.centerIntro,type:'CollectionPage',exactKeywords:true,
 keywords:['PS4 download center','PS5 download center','PlayStation console downloads','PS4 transfer guide','PS5 transfer guide','FileZilla FTP guides','USB transfer guides','console homebrew files','PS4-Xplorer','PS5 ezRemote Client','phone FTP apps'],
 breadcrumbs:[{name:'Home',url:'/'},{name:'Console',url:'/console/'},{name:source.downloads,url:'/console/download-center/'}],
 items:[{name:source.ps4Files,url:'/console/ps4/downloads.html'},{name:source.ps5Files,url:'/console/ps5/downloads.html'},{name:source.ps4Title,url:'/console/ps4/file-transfer-guide.html'},{name:source.ps5Title,url:'/console/ps5/file-transfer-guide.html'},{name:source.allFiles,url:'/downloads/'}]
};
const escape=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
function decorate(file,html){
 if(!overrides[file])return html;
 const platform=/console\/(ps[45])\//.exec(file)?.[1];
 const brands=platform?[platform.toUpperCase(),'FTP','USB','iOS','Android','HarmonyOS',platform==='ps4'?'PS4-Xplorer':'ezRemote Client']:['PS4','PS5','FTP','USB'];
 const visible='<ul class="tg-tags" aria-label="Tags">'+brands.map(name=>'<li class="feature-tag" translate="no">'+escape(name)+'</li>').join('')+'</ul>';
 html=html.replace('<div class="hero-buttons">',visible+'<div class="hero-buttons">');
 function searchable(tag,terms){return tag.replace(/\sdata-search="[^"]*"/g,'').replace(/>$/,' data-search="'+escape(terms.join(' ').toLowerCase())+'">');}
 html=html.replace(/<a\b[^>]*data-choose-method="(ftp|usb)"[^>]*>/g,(tag,method)=>searchable(tag,[platform.toUpperCase(),method,source[method==='ftp'?'computer':'manager'],...keywords(platform).filter(term=>method==='ftp'?/FTP|FileZilla|phone|IP/i.test(term):/USB|file manager|Xplorer|ezRemote/i.test(term))]));
 html=html.replace(/<article\b[^>]*data-phone-platform="(ios|android|harmony)"[^>]*>/g,(tag,os)=>searchable(tag,[platform.toUpperCase(),'FTP',source[os+'Title'],{ios:'FTPManager iPhone iPad App Store',android:'Solid Explorer Google Play',harmony:'electerm Huawei AppGallery HarmonyOS NEXT'}[os]]));
 html=html.replace(/<article class="guide-resource"><h3 translate="no">(PS[45])<\/h3>/g,(tag,name)=>searchable('<article class="guide-resource">',keywords(name.toLowerCase()))+'<h3 translate="no">'+name+'</h3>');
 return require('./page-search-tags.cjs').apply(file,html);
}
module.exports={overrides,keywords,decorate};
