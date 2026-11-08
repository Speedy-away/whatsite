const fs=require('node:fs');
const {page:renderPage,section,grid,resource,note,steps,videoEmbed:video,ext,link,sourceList,guideLink,esc}=require('./build-console-guides.cjs');
// A catalogue review must not regenerate unrelated console or archived pages.
const gtaOnly=process.argv.includes('--gta5-only');
const rdr2Only=process.argv.includes('--rdr2-only');
const scoped=gtaOnly||rdr2Only;
const page=(file,...args)=>{if((!scoped)||(gtaOnly&&['console/mods/ps4/gta5/index.html','console/mods/ps4/gta5/install.html'].includes(file))||(rdr2Only&&file==='console/mods/ps4/rdr2/index.html'))renderPage(file,...args);};
const imported=require('./build-ps4-ps5-game-imports.cjs').createGameImports();
const catalog=require('./console-mod-catalog.cjs');
const {resourceTags}=require('./console-resource-tags.cjs');
const files=JSON.parse(fs.readFileSync('downloads/ps4/GTA5/manifest.json','utf8')).files;
// Render each catalogue resource once; older download lists only fill missing entries.
const gtaItems=imported.forGame('gta5');
function gtaSection(item){
 if(item.category==='client')return 'servers';
 if(['script','cfg'].includes(item.category)||['gta5-script-loader-pack','gta5-random-scripts-pack'].includes(item.id))return 'scripts';
 if(item.gameVersions?.includes('1.57'))return 'v157';
 if(item.gameVersions?.includes('1.56'))return 'v156';
 return item.gameVersions?.length ? 'older' : 'unconfirmed';
}
const gtaCards=group=>gtaItems.filter(item=>gtaSection(item)===group).map(item=>imported.renderer.card(item));
const unmatchedFiles=files.filter(file=>!gtaItems.some(item=>imported.matches(item,file)));
function guideDownloads(ids,wrap=true){
 const buttons=ids.map(id=>{
  const item=gtaItems.find(item=>item.id===id);
  if(!item)throw Error('Missing guide download: '+id);
  return item.downloads.filter(file=>file.distribution==='include').map(file=>imported.renderer.downloadButton({...file,label:'Download '+item.name+' · '+file.label},item)).join('');
 }).join('');
 return wrap?'<div class="guide-links">'+buttons+'</div>':buttons;
}

const base='/console/mods/ps4/gta5/';
const rdr2base='/console/mods/ps4/rdr2/';
const codbase='/console/mods/ps4/call-of-duty/';
const nav=[['/console/mods/','Mods / Mod Menus'],['/console/mods/ps4/','PS4/PS5 Games'],['/console/mods/ps4/menus.html','Menu Directory'],[base,'GTA V Downloads'],[rdr2base,'RDR2 Downloads'],[codbase,'Call of Duty'],[base+'install.html','Installation'],[base+'online.html','Los Santos Online']];
const image='/assets/images/ps4-gta5/oxagon.png';
const rdr2image='/assets/images/ps4-rdr2/north.png';
const rdr2menus=[
 {name:'North',image:'north.png',url:'https://www.mediafire.com/file/25tajv70j2bocmu/NorthBeta011.rar/file',downloadsRendered:true},
 {name:'Oyster',resourceId:'rdr2-oyster',url:imported.forGame('rdr2').find(item=>item.id==='rdr2-oyster').downloads[0].url,downloadsRendered:true},
 {name:'Sheriff 1.32',image:'sheriff.png',url:'https://www.mediafire.com/file/8gmxjkwhlofwvpi/RDR2-ModMenu.rar/file',downloadsRendered:true},
 {name:'Havana',image:'havana.png',url:'https://github.com/illusionyy/PS4-RDR2-Havana-Mod-Menu-Releases/releases/tag/v1.20',downloadsRendered:true}
];
function downloadCard(f){
 const extra=imported.legacyEnhancement('gta5',f);
 const preview=/^Ozark(?:$|\s)/i.test(f.name)?{src:'/assets/images/ps4-gta5/ozark-user-preview-2026-11-02.png',alt:'Ozark menu screenshot supplied by the user; menu-family preview'}:extra.image|| (f.image?{src:'/assets/images/ps4-gta5/'+f.image,alt:f.name+' supplied preview'}:{src:'/assets/images/gta52.png',alt:'Grand Theft Auto V artwork'});
 const version=extra.resource?.version||(f.group==='scripts'?'CSC / script resources':'GTA V 1.'+f.group.slice(1));
 const paired=imported.renderer.pluginDownloads(extra.resource,undefined,f);
 const description=f.name==='GTA Fucker'?'CSC menu requiring a compatible script loader.':'Script resource; check the installation notes and loader requirements.';
 const tags=resourceTags(extra.resource||{name:f.name,gameIds:['gta5'],category:f.group==='scripts'?'script':'menu',gameVersions:f.group==='scripts'?[]:['1.'+f.group.slice(1)]});
 return `<article class="guide-resource"${extra.resource?` id="resource-${esc(extra.resource.id)}-legacy"`:''} data-search="${esc([f.name,version,...(extra.resource?.keywords||[])].join(' ').toLowerCase())}">${preview?`<img src="${esc(preview.src)}" alt="${esc(preview.alt)}" loading="lazy">`:''}<h3>${esc(f.name)}</h3><p>${esc(version)}</p>${extra.resource?.description?`<p>${esc(extra.resource.description)}</p>`:f.group==='scripts'?`<p>${description}</p>`:''}${imported.renderer.requirementsMarkup(extra.resource)}${catalog.tagMarkup(tags.slice(0,6))}<div class="guide-links">${paired||`<a href="${esc(f.local || f.source)}" class="btn btn-primary" download><i class="fas fa-download" aria-hidden="true"></i> Download</a>`}${extra.guide}</div></article>`;
}
function rdr2Card(menu){
 if(menu.resourceId)return imported.renderer.card(imported.forGame('rdr2').find(item=>item.id===menu.resourceId));
 const extra=imported.legacyEnhancement('rdr2',menu);
 const preview=extra.image||{src:'/assets/images/ps4-rdr2/'+menu.image,alt:menu.name+' mod menu in Red Dead Redemption 2 on PS4'};
 return `<article class="guide-resource" data-search="${esc(menu.name.toLowerCase()+' rdr2 red dead redemption 2 ps4')}"><a href="${esc(preview.src)}" target="_blank" rel="noopener noreferrer" aria-label="View ${esc(menu.name)} screenshot"><img src="${esc(preview.src)}" alt="${esc(preview.alt)}" loading="lazy"></a><h3>${menu.name}</h3>${extra.resource?.compatibilityText ? `<p>${esc(extra.resource.compatibilityText)}</p>` : ''}${catalog.tagMarkup(resourceTags(extra.resource||{name:menu.name,gameIds:['rdr2'],category:'menu'}).slice(0,6))}<div class="guide-links">${extra.downloads || `<a href="${esc(menu.url)}" class="btn btn-primary" target="_blank" rel="noopener noreferrer"><i class="fas fa-download" aria-hidden="true"></i> Download</a>`}${extra.guide}</div></article>`;
}
if(!scoped)require('./build-mods-hub.cjs').buildModsHub();
page('console/mods/ps4/index.html','PS4/PS5 Mods / Mod Menus','Browse the PS4/PS5 collection of GTA V, Red Dead Redemption 2 and Call of Duty resources, with menu downloads, screenshots and setup guides.',image,nav,
require('./build-console-downloads.cjs').intro('ps4')+section('games','Available games',grid(resource('Grand Theft Auto V','Menus by game update, script resources, plugin setup and supplied guides.',ext(base,'Open GTA V mods'),'/assets/images/gta52.png'),resource('Red Dead Redemption 2','North, Sheriff, Havana and Oyster resources, with supplied screenshots and videos.',ext(rdr2base,'Open RDR2 mods'),'/assets/images/rdr2.png'),resource('Call of Duty','Game-specific menus, injectors, CFG and RTM tools, screenshots and supplied guides.',ext(codbase,'Browse Call of Duty mods'),'/assets/images/covers/cod-black-ops-3.jpg'),imported.extraGameCards()))+
section('menu-directory','Find a specific menu',`<p>Search every imported game, menu, script and tool, including older GTA V builds.</p><div class="guide-links">${link('/console/mods/ps4/menus.html','Search the menu directory')}</div>`)+
section('requirements','Before choosing a mod',note('<p>Match the console firmware, homebrew enabler, game title ID and game update separately. A menu built for GTA V 1.57 is not automatically compatible with 1.56, and the PS4 14.00 jailbreak does not establish GoldHEN plugin support.</p>')), '#games','Browse games');
page('console/mods/ps4/rdr2/index.html','RDR2 Mods for PS4','Browse North, Sheriff, Havana and Oyster resources for Red Dead Redemption 2, with supplied screenshots and videos.',rdr2image,nav.slice(0,5),
section('downloads','Red Dead Redemption 2 mod menus',grid(...rdr2menus.map(rdr2Card))), '#downloads','Browse downloads');
page('console/mods/ps4/gta5/index.html','GTA V Mods for PS4','Browse menus by GTA V game update, CSC scripts, screenshots and supplied setup guides.',image,nav,
require('./ps4-user-plugin-templates.cjs').sectionFor('gta5')+
section('versions','Choose your GTA V update',`<nav class="guide-nav" aria-label="Download versions"><a href="#v157">GTA V 1.57</a><a href="#v156">GTA V 1.56</a><a href="#older">Older GTA 5 versions</a><a href="#scripts">Scripts &amp; CSC</a><a href="#servers">Private servers</a></nav>`)+
section('v157','GTA V 1.57',grid(...unmatchedFiles.filter(f=>f.group==='157').map(downloadCard),...gtaCards('v157')))+
section('v156','GTA V 1.56',grid(...unmatchedFiles.filter(f=>f.group==='156').map(downloadCard),...gtaCards('v156')))+
section('older','Older GTA 5 versions',note('<p>Menus with confirmed older GTA V update requirements and no listed support for 1.56 or 1.57. Keep each download’s exact update pin.</p>')+grid(...gtaCards('older')))+
section('unconfirmed','Game update unspecified',note('<p>The source does not establish a game update for these entries. Confirm the requirement before choosing a build.</p>')+grid(...gtaCards('unconfirmed')))+
section('scripts','Script resources & CSC menus',note('<p><strong>Archive check:</strong> the supplied Script_Loader.zip contains CSC/CTD menu resources and text notes, but no PRX/SPRX plugin. FCLoader.csc is also a script. A separate compatible script-loading plugin or menu is required to use these files.</p>')+grid(...unmatchedFiles.filter(f=>f.group==='scripts').map(downloadCard),...gtaCards('scripts')))+
section('servers','GTA V private servers',note('<p>Private-server clients are grouped separately from mod menus. Match the client to your installed game update. Reborn’s supplied live-server announcement is for 1.57 only; its older 1.56 client remains available.</p>')+grid(resource('Los Santos Online','Independent premium GTA V private server advertised for PS4 and Xbox 360. The public site does not specify a GTA V update or firmware requirement.',ext('https://lossantosonline.com/','Official website')+link(base+'online.html','Server setup guide'),'/assets/images/gta52.png'),...gtaCards('servers'))),'#versions','Choose game version');

page('console/mods/ps4/gta5/install.html','Install GTA V Mods on PS4','Set up one matching plugin at a time, preserve your configuration and distinguish PRX plugins from CSC script resources.','/assets/images/ps4-gta5/velora.png',nav,
section('requirements','Check the four compatibility details',note('<p>You need a homebrew-enabled PS4 with <strong>GoldHEN plugin support</strong>, a supported GTA V update, the correct regional title ID and the menu’s required files. These instructions do not establish compatibility with the experimental PS4 14.00 HEN.</p><p>The supplied video is titled “PS4 - How To Install Velora Mod Menu For 1.57 (13.52 Or Lower)”. It is linked below. No transcript was available, so the written steps use GoldHEN documentation and the downloaded archive notes.</p>'))+
section('plugin','General GoldHEN plugin setup',steps([
['Confirm your installed GTA V update','Use Options &gt; Information on the game tile. Choose either the 1.56 or 1.57 download group and check the menu’s supported title IDs.'],
['Back up configuration and saves','Copy your existing <code>/data/GoldHEN/plugins.ini</code> before editing it. Keep unrelated game entries intact.'],
['Enable GoldHEN plugins','GoldHEN’s plugin documentation calls for version 2.3 or newer and enabling plugin loading in its Plugins Menu. Use a release supported by your firmware.'],
['Transfer the files','For a matching PRX plugin, use FTP or your console file manager to place it in <code>/data/GoldHEN/plugins/</code>. Transfer any accompanying data folders to the location specified by that menu’s README. Do not rename a SPRX or CSC file to PRX to force it to load.'],
['Register the plugin for the game','Add its exact file path under the matching GTA V CUSA section in <code>/data/GoldHEN/plugins.ini</code>. Use the menu’s regional configuration; avoid a default entry that loads it into every game.'],
['Test one menu','Fully close and restart GTA V, enter story mode and use the menu’s documented opening controls. If it crashes, remove that entry and restart the game before trying a different menu.']
])+sourceList([['https://github.com/GoldHEN/GoldHEN_Plugins_Repository','GoldHEN plugin setup reference']]))+
section('velora','Velora 1.4: GTA V 1.57 installation',guideDownloads(['gta5-velora-1-57'])+steps([
['Extract the full package','Download and extract <code>Velora_1.4.zip</code>. This full GTA V 1.57 package includes <code>Velora.sprx</code> and the <code>Velora</code> data folder; the separate older Velora 1.5 module is a different download.'],
['Transfer the supporting data','Keep the complete Velora folder at <code>/data/Velora</code>, including its Lua compatibility files and speedometer DDS resources. Back up existing settings before merging folders.'],
['Install the plugin','With GTA V closed, copy <code>Velora.sprx</code> to <code>/data/GoldHEN/plugins/Velora.sprx</code>. Keep the SPRX filename and extension.'],
['Merge your game’s configuration','Add the path below under your installed GTA V title-ID section in <code>/data/GoldHEN/plugins.ini</code>. Retain unrelated entries and enable one menu at a time. The source supplies no confirmed regional mapping; the main download page provides separately labelled EU/USA configuration templates.']
])+`<pre class="guide-code"><code>/data/GoldHEN/plugins/Velora.sprx</code></pre>`+note('<p>Velora 1.4 is the menu release; 1.57 is the GTA V game update. The supplied archive does not establish a fixed opening shortcut or a title-ID compatibility matrix.</p>'))+
section('oxagon','Oxagon / Oxagon Lite: GTA V 1.56',guideDownloads(['gta5-oxagon-1-56','gta5-oxagon-lite-v1-4'])+steps([
['Select the 156 plugin','The archives contain separate 153 and 156 PRX files. For this page’s 1.56 group, use <code>Oxagon_156.prx</code> or <code>OxagonLite_156.prx</code>.'],
['Transfer plugin and data','Place the matching 1.53 or 1.56 PRX in <code>/data/GoldHEN/plugins/</code> and the archive’s Oxagon folder under <code>/data</code>. The Lite README also requires <code>/data/Oxagon.key</code>, but the preserved Lite v1.4 ZIP does not contain that file. Obtain the required matching key from the source before treating the Lite installation as complete.'],
['Merge the correct game entry','Use your installed GTA V title ID and the selected plugin’s exact path in plugins.ini. The archive’s region examples are examples; confirm your own game rather than inferring title ID from update number.'],
['Open the menu','The archive’s info.txt lists D-pad Left + Cross (X). Use one Oxagon build at a time.']
]))+
section('scripts','Using CSC script resources',guideDownloads(['gta5-script-loader-pack','gta5-fcloader-csc','gta5-gta-fucker-csc','gta5-random-scripts-pack','gta5-rkmodz-csc-pack'])+steps([
['Install a compatible loader first','The supplied Script_Loader.zip is a resource pack, not a standalone PRX loader. Use a menu or script-loader plugin that documents support for your game update.'],
['Copy CSC/CTD files to its documented directory','Use the location required by that specific loader. Preserve accompanying CTD and text files; do not place CSC scripts in plugins.ini.'],
['Load one script','Select it through the loader’s interface. Read that script’s opening controls and stack-size notes before starting it. The supplied pack contains different requirements for different menus.']
])+note('<p>Back up and merge your existing configuration using the menu’s own example. Get Los Santos Online setup files and instructions from its website.</p>'))+
section('video','Velora 1.57 video companion',video('jUlSB1gEHtQ','PS4: Install Velora Mod Menu for GTA V 1.57')),'#plugin','Read setup steps');

page('console/mods/ps4/gta5/online.html','GTA V PS4: Los Santos Online','Private-server resources for compatible PS4 setups, separate from Rockstar’s official GTA Online service.','/assets/images/ps4-gta5/ozark.png',nav,
section('routes','Choose the online service',note('<p><strong>Official GTA Online:</strong> a 14.00 jailbreak alone is not a guarantee of PSN or Rockstar service access. Official play depends on the required console/game software, account and service eligibility. This guide does not recommend updating a lower-firmware console solely to obtain online access.</p><p><strong>Los Santos Online:</strong> an independent private-server option advertised for PS4 and Xbox 360. Its website describes it as premium. Check supported firmware, GTA V update, access terms and current setup files with the server team before buying access or changing your console.</p>')+sourceList([['https://www.playstation.com/en-us/support/hardware/ps4-set-up/','PlayStation official online setup requirements'],['https://lossantosonline.com/','Los Santos Online service and support']]))+
section('setup','Private-server setup checklist',steps([
['Check the server’s current requirements','Open the official site and its linked community. Confirm your exact PS4 firmware, GTA V title ID and update are supported. Staying on lower firmware requires a server-compatible configuration, not just any jailbroken PS4.'],
['Obtain access and the current client files','Use Los Santos Online’s registration and support instructions. Get the correct current plugin and INI directly from the server team.'],
['Prepare the plugin environment','Back up plugins.ini and use a homebrew enabler with the plugin support required by that client. Close GTA V before transferring files.'],
['Install only the supplied server configuration','Use the current client files and installation instructions provided through the Los Santos Online website. Merge the configuration for your exact GTA V title ID.'],
['Launch using the server instructions','Start GTA V and follow the client’s connection flow. Check the server’s status and account access if it fails. Private-server characters and progression should not be assumed to transfer to official GTA Online.'],
['Add a menu only after connecting','Confirm the server’s rules and game-update compatibility before enabling another plugin. Test one menu at a time.']
])+`<div class="guide-links">${ext('https://lossantosonline.com/','Open Los Santos Online')}${link(base+'install.html','Plugin installation guide')}</div>`)+
section('video','Private-server video companion',video('P9SAjhA-lNU','How To Play GTA Online On A Jailbroken PS4 (Private server)')+note('<p>No transcript was available for this video. The steps above are a preparation checklist, not a verified reproduction of its server-specific installation sequence. Visit the Los Santos Online website for the current client package and setup instructions.</p>')),'#setup','Read server checklist');
if(!scoped)require('./build-ps4-ps5-cod.cjs');
imported.buildMods({gtaRendered:true,gtaFiles:files,rdrMenus:rdr2menus,...(gtaOnly?{gameIds:['gta5']}:rdr2Only?{gameIds:['rdr2']}:{})});
if(!rdr2Only){const file='console/mods/ps4/gta5/index.html';let html=fs.readFileSync(file,'utf8');html=html.replace('</head>','<link rel="stylesheet" href="/assets/gta5-plugin-downloads.css?v=3"></head>').replace('</body>','<script defer src="/assets/gta5-plugin-downloads.js?v=4"></script></body>');fs.writeFileSync(file,html);}
if(scoped)for(const file of rdr2Only?['console/mods/ps4/rdr2/index.html']:['console/mods/ps4/gta5/index.html','console/mods/ps4/gta5/install.html'])fs.writeFileSync(file,require('./search-page-output.cjs').finish(file,fs.readFileSync(file,'utf8')));
if(!rdr2Only)catalog.build();
console.log(rdr2Only?'Built RDR2 catalogue with Oyster next to North.':gtaOnly?'Built GTA V catalogue, installation guide and menu directory.':'Built Console Mods, PS4/PS5 Games, three GTA V pages and RDR2 with North, Sheriff and Havana downloads.');
