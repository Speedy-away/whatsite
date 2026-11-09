const data = {
  reviewed: '2026-11-07',
  video: {id:'evdNQ1Vl2Bo', title:'PS4 14.00 Stable WebKit Jailbreak Released with GoldHEN Support! (Overview & Setup)', creator:'MODDED WARFARE', published:'2026-11-03'},
  image:'/assets/images/consoles/playstation.jpg',
  goldhen:'2.4b18.13',
  host:'https://well0nez.github.io/afterglow-web/',
  dns:['45.56.67.85','62.210.38.117'],
  release:'https://ko-fi.com/s/e694c36022',
  chapters:[[47,'Update blocker'],[147,'WebKit jailbreak']]
};
function buildFourteenGuide(){
 const {page,section,note,steps,ext,link,videoEmbed,sourceList,goldhen14Download}=require('./build-console-guides.cjs');
 const {jailbreakNav}=require('./build-ps4-jailbreaks.cjs');
 const chapters=sourceList(data.chapters.map(([seconds,title])=>['https://www.youtube.com/watch?v='+data.video.id+'&t='+seconds,Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')+' · '+title]));
 const dns='<dl class="guide-dns"><div><dt>Primary DNS from the tutorial</dt><dd><code>'+data.dns[0]+'</code></dd></div><div><dt>Alternative primary DNS</dt><dd><code>'+data.dns[1]+'</code></dd></div></dl>';
 const content=section('requirements','WebKit exploit',
  '<p>MODDED WARFARE’s tutorial demonstrates Afterglow in the PS4 Internet Browser with GoldHEN <strong>'+data.goldhen+'</strong>. Check <strong>Settings → System → System Information</strong> for firmware <strong>14.00</strong>.</p>'+
  '<div class="guide-links">'+ext(data.host,'Open Afterglow on PS4')+link('#disc','Blu-ray disc (for offline use)')+'</div>')+
 section('video','14.00 WebKit walkthrough · MODDED WARFARE',videoEmbed(data.video.id,data.video.title)+chapters)+
 section('dns','Prepare the connection & update blocking',dns+steps([
  ['Turn off automatic downloads','In Settings → System → Automatic Downloads, untick the automatic-download options shown in the tutorial.'],
  ['Set up your connection','Choose Settings → Network → Set Up Internet Connection, select Wi-Fi or LAN, then Custom. A typical home network uses Automatic IP and Do Not Specify for DHCP.'],
  ['Enter a blocking DNS','Set DNS to Manual and use one of the primary DNS addresses above. The video presents them as alternatives; if one does not work, try the other. Keep MTU Automatic and do not use a proxy unless your network needs one.'],
  ['Check that blocking works','Open System Software Update to check for a connection/server error, then check that an ordinary website still loads. Do not accept an offered system update. Router or ISP DNS overrides can prevent the block from working.']
 ])+require('./console-dns-notice.cjs').notice())+
 section('browser','Load GoldHEN through the PS4 browser',
  '<div class="guide-links">'+ext(data.host,data.host)+'</div>'+steps([
   ['Open Afterglow on the PS4','Use the console’s Internet Browser while connected to the internet. Bookmark the landing page, select GoldHEN and wait while the host downloads its files.'],
   ['Start the exploit','Choose Start after the host finishes loading its files. Check for the GoldHEN notification and settings menu.'],
   ['Follow the host’s retry message','If it reports an ordinary exploit failure, reopen the browser and try again. If the host reports that handles were not defused, fully power off the console before retrying.']
  ])+note('<p><strong>WebKit can be cached for offline use.</strong> Let Afterglow finish downloading its cache on the first connected visit. Later, reopen the same bookmarked address on the PS4 to run it offline. Clearing browser website data removes the cache, so reconnect to download it again if needed.</p>')+
  '<div class="guide-links">'+ext('https://github.com/well0nez/afterglow-web','Afterglow documentation')+ext(data.release,'GoldHEN '+data.goldhen+' release notes')+'</div>')+
 section('disc','Blu-ray disc (for offline use)',note('<p>The disc method uses a working PS4 Blu-ray drive with disc playback already enabled. Preparing the disc requires a Blu-ray burner and blank BD-R or BD-RE media. The supplied ISO’s publisher and compatibility have not been independently verified.</p>')+steps([
  ['Prepare the supplied ISO','Keep the exact downloaded disc image and its checksum. Extract an outer archive first if needed.'],
  ['Burn the image','In ImgBurn use Write image file to disc and verify the finished Blu-ray. Copying the ISO as an ordinary file is not equivalent.'],
  ['Start the disc','Open the Blu-ray tile on the PS4 and follow the image’s instructions. The documented disc waits for Cross (X) after validation.'],
  ['Check HEN success','Confirm the actual HEN features work. After a failed disc attempt, shut down fully and cold-boot before retrying.']
 ])+'<div class="guide-links">'+goldhen14Download()+ext('https://gofile.io/d/kg4BSziZ','Original supplied ISO link')+ext('https://www.imgburn.com/index.php?act=download','ImgBurn')+ext('https://github.com/OptiTronOffical/PS4-14.00-BD-JB','Original disc reference')+ext('https://www.youtube.com/watch?v=F7y-hk5qpxM','Blu-ray walkthrough')+'</div>');
 page('console/ps4/jailbreak.html','PS4 14.00 WebKit Jailbreak & GoldHEN','Set up Afterglow on PS4 firmware 14.00, cache the WebKit exploit for offline use, or use the Blu-ray disc method.',data.image,jailbreakNav,content,'#requirements','Open WebKit guide');
}
module.exports={buildFourteenGuide,data};
if(require.main===module)buildFourteenGuide();
