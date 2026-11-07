const data = {
  reviewed: '2026-11-07',
  video: {id:'evdNQ1Vl2Bo', title:'PS4 14.00 Stable WebKit Jailbreak Released with GoldHEN Support! (Overview & Setup)', creator:'MODDED WARFARE', published:'2026-11-03'},
  image:'/assets/images/consoles/ps4-1400-webkit-20261107.jpg',
  goldhen:'2.4b18.13',
  hosts:['https://well0nez.github.io/afterglow-web/','http://ps4.sentrix.ac/'],
  dns:['45.56.67.85','62.210.38.117'],
  release:'https://ko-fi.com/s/e694c36022',
  chapters:[[0,'Overview'],[47,'Update blocker'],[147,'WebKit jailbreak'],[257,'Installing apps'],[280,'GoldHEN settings'],[373,'Loading apps'],[441,'Optional firmware-update discussion']]
};
function buildFourteenGuide(){
 const {page,section,note,steps,ext,link,videoEmbed,sourceList,goldhen14Download}=require('./build-console-guides.cjs');
 const {jailbreakNav}=require('./build-ps4-jailbreaks.cjs');
 const chapters=sourceList(data.chapters.map(([seconds,title])=>['https://www.youtube.com/watch?v='+data.video.id+'&t='+seconds,Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')+' · '+title]));
 const dns='<dl class="guide-dns"><div><dt>Primary DNS from the tutorial</dt><dd><code>'+data.dns[0]+'</code></dd></div><div><dt>Alternative primary DNS</dt><dd><code>'+data.dns[1]+'</code></dd></div></dl>';
 const content=section('requirements','PS4 14.00 · browser jailbreak',
  '<p>MODDED WARFARE’s 3 November 2026 tutorial demonstrates Afterglow in the PS4 Internet Browser with GoldHEN <strong>2.4b18.13</strong>. This browser method does not require a Blu-ray burner or exploit disc.</p>'+note('<p>Check <strong>Settings → System → System Information</strong> and use the route for your installed firmware. This guide covers <strong>14.00</strong>; it does not establish support for higher versions. GoldHEN 2.4b18.13 is a beta release.</p>')+
  '<div class="guide-links">'+link('/console/ps4/jailbreaks.html','Choose another firmware')+link('https://speedy-away.github.io/hosts/ps4/','Open our PS4 host')+ext(data.release,'GoldHEN 2.4b18.13 release notes')+'</div>')+
 section('video','14.00 WebKit walkthrough · MODDED WARFARE',videoEmbed(data.video.id,data.video.title)+chapters,'Written steps checked against the supplied video’s visible English captions and description. No exploit or payload was executed during this guide update.')+
 section('dns','Prepare the connection & update blocking',dns+steps([
  ['Turn off automatic downloads','In Settings → System → Automatic Downloads, untick the automatic-download options shown in the tutorial.'],
  ['Set up your connection','Choose Settings → Network → Set Up Internet Connection, select Wi-Fi or LAN, then Custom. A typical home network uses Automatic IP and Do Not Specify for DHCP.'],
  ['Enter a blocking DNS','Set DNS to Manual and use one of the primary DNS addresses above. The video presents them as alternatives; if one does not work, try the other. Keep MTU Automatic and do not use a proxy unless your network needs one.'],
  ['Check that blocking works','Open System Software Update to check for a connection/server error, then check that an ordinary website still loads. Do not accept an offered system update. Router or ISP DNS overrides can prevent the block from working.']
 ])+require('./console-dns-notice.cjs').notice())+
 section('browser','Load GoldHEN through the PS4 browser',
  sourceList(data.hosts.map((url,index)=>[url,index===0?'Afterglow · host demonstrated in the video':'Alternative host listed in the video']))+steps([
   ['Prepare the browser','Close existing browser pages with Options → Delete All. Clear Browsing History, then delete cookies and clear website data in browser Settings. Close and reopen the browser. This clears existing cached website data.'],
   ['Open Afterglow on the PS4','Use the PS4 Internet Browser to open the demonstrated host above. Select GoldHEN rather than the separate ps4-hen option. Follow its on-screen start controls and wait for completion.'],
   ['Confirm the result','The tutorial shows a GoldHEN 2.4b18.13 notification and GoldHEN settings after success. A loaded page alone is not confirmation that the jailbreak completed.'],
   ['Retry only after a failure','For the not-enough-free-system-memory message, dismiss it and allow the page to retry. For an ordinary stalled page, refresh or close and reopen the browser as shown. If the console shuts down, reboot before trying again. Follow any specific host recovery message; if handles are not defused, cold-start rather than closing the browser.']
  ]))+
 section('goldhen','Install apps & enable GoldHEN features',steps([
  ['Install your homebrew packages','Copy the required PS4 PKG files to the USB drive root. After GoldHEN loads, open its Debug Settings → Package Installer and select the package.'],
  ['Update cheats, patches and plugins','The tutorial updates the Cheat Archive, Patch Archive and Plugin Archive through GoldHEN. It notes that the plugin-archive update can fail; confirm the result before enabling the Plugins Loader and Game Patch Plugin.'],
  ['Choose the features you need','The video demonstrates the FPS overlay, FTP server, payload/bin-loader server and clock synchronization. Enable services when needed and use each service’s displayed connection details.'],
  ['Match each game build','Cheats, patches and menu plugins still need the correct game title ID and game update. The PT example in the video does not establish support for every game or plugin.'],
  ['Reload after restarting','Homebrew files stay installed, but a normal console reboot ends the active jailbreak session. Load the compatible browser route again before using homebrew.']
 ])+'<div class="guide-links">'+link('/console/ps4/apps.html','PS4 apps')+link('/console/ps4/goldhen.html','GoldHEN downloads')+link('/console/ps4/game-patches.html','Game patches')+'</div>')+
 section('firmware-update','If you are considering a firmware update',
  '<p>The video’s optional chapter at 7:21 discusses moving an older console to 14.00 and disabling an existing update blocker. That is separate from running this guide on a console already on 14.00. Its statement that 14.00 is the latest firmware refers to the recording date.</p><p>Use an exact <strong>14.00</strong> update file only if you have chosen to update; do not follow an automatic “latest” update prompt or substitute a higher firmware. Keep a working lower-firmware setup while checking your apps and payloads.</p><div class="guide-links">'+ext('https://www.youtube.com/watch?v='+data.video.id+'&t=441','Watch the optional update chapter')+link('/console/ps4/jailbreaks.html#firmware-downloads','Versioned firmware resources')+'</div>')+
 section('disc','Older Blu-ray method · preserved resources',note('<p>This is the earlier disc workflow, kept separately from the browser method above. It requires a working PS4 Blu-ray drive, a Blu-ray burner and blank BD-R/BD-RE media. The supplied ISO’s publisher and compatibility are not independently verified.</p>')+require('./ps4-disc-links.cjs').discSteps([
  ['Prepare the supplied ISO','Keep the exact downloaded disc image and its checksum. Extract an outer archive first if needed.'],
  ['Burn the image','In ImgBurn use Write image file to disc and verify the finished Blu-ray. Copying the ISO as an ordinary file is not equivalent.'],
  ['Start the disc','Open the Blu-ray tile on the PS4 and follow the image’s instructions. The documented disc waits for Cross (X) after validation.'],
  ['Check HEN success','Confirm the actual HEN features work. After a failed disc attempt, shut down fully and cold-boot before retrying.']
 ])+'<div class="guide-links">'+goldhen14Download()+ext('https://gofile.io/d/kg4BSziZ','Original supplied ISO link')+ext('https://www.imgburn.com/index.php?act=download','ImgBurn')+ext('https://github.com/OptiTronOffical/PS4-14.00-BD-JB','Original disc reference')+ext('https://www.youtube.com/watch?v=F7y-hk5qpxM','Earlier disc video')+'</div>')+
 section('older-browser','Earlier browser-host reference',sourceList([['https://aminegold0.github.io/silverps4hen/','SilverPS4HEN'],['https://aminegold0.github.io/silverps4hen/raw13/jb.html?log=1&hx1400=1&v=6','Preserved 14.00-specific link'],['https://github.com/aminegold0/silverps4hen','Original host source']]),'Kept as an alternative reference; it is not the Afterglow route demonstrated in the new tutorial.')+
 section('sources','Tutorial & project references',sourceList([['https://www.youtube.com/watch?v='+data.video.id,'MODDED WARFARE · 14.00 WebKit tutorial'],['https://github.com/well0nez/afterglow-web','Afterglow project requirements'],[data.release,'SiSTRo · GoldHEN 2.4b18.13 / firmware 14.00 support']]));
 page('console/ps4/jailbreak.html','PS4 14.00 WebKit Jailbreak & GoldHEN','Follow MODDED WARFARE’s PS4 14.00 browser tutorial: DNS checks, Afterglow, GoldHEN 2.4b18.13, packages, patches and plugins.',data.image,jailbreakNav,content,'#requirements','Start with your firmware');
}
module.exports={buildFourteenGuide,data};
if(require.main===module)buildFourteenGuide();
