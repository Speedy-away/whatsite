const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const {page,section,note,steps,sourceList,link,ext,ps4nav}=require('./build-console-guides.cjs');
const data=()=>JSON.parse(fs.readFileSync(path.join(root,'docs/ps4-ps5-game-patches.json'),'utf8'));
const standalone=require('../docs/ps4-ps5-standalone-game-patches.json');
const patchImages=require('../docs/ps4-ps5-game-patch-images.json').images;
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const unique=rows=>[...new Set(rows)];
const fpsOption=/fps|frame.?rate|frame.?pacing/i;
const patchLabels={fps:'FPS / frame pacing','60fps':'60 FPS','120fps':'120 FPS target','120hz':'120 Hz output','4k':'4K / 2160p rendering',graphics:'Graphics',gameplay:'Gameplay / fixes'};
function gameCard(game,platform,d){
  game={...game,options:game.catalogueOptions||game.options};
  const kinds=unique(game.options.flatMap(option=>[/fps|frame.?rate|frame.?pacing/i.test(option.Name)?'fps':'',/resolution|blur|chromatic|vsync|v-sync|render|\b(?:720p|1080p|1440p|2160p|4k)\b/i.test(option.Name)?'graphics':'',!/fps|frame.?rate|frame.?pacing|resolution|blur|chromatic|vsync|v-sync|render/i.test(option.Name)?'gameplay':''].filter(Boolean)));
  const updates=unique(game.options.map(o=>o.AppVer));
  if(game.options.some(option=>/\b60\s*fps\b/i.test(option.Name))) kinds.push('60fps');
  if(game.arch==='prospero'){
    if(game.options.some(option=>/\b120\s*fps\b/i.test(option.Name))) kinds.push('120fps');
    if(game.options.some(option=>/\b120\s*hz\b/i.test(option.Note||''))) kinds.push('120hz');
    if(game.options.some(option=>/\b(?:4k(?:120)?|2160p|3840\s*[x×]\s*2160)\b/i.test(option.Name))) kinds.push('4k');
  }
  const labels=Object.keys(patchLabels).filter(kind=>kinds.includes(kind)).map(kind=>patchLabels[kind]);
  if(game.arch==='prospero'&&updates.includes('mask')) labels.push('Pattern scan');
  const targets=game.arch==='prospero'?['native']:game.platforms;
  const scope=game.arch==='prospero'?'Native PS5':game.platforms.includes('ps4')?'PS4 / Pro':'PS5 backward compatibility';
  if(game.arch==='orbis'&&targets.includes('ps4')&&targets.includes('ps5')) labels.unshift('PS5 backward compatibility');
  const tags=patchTags([scope,...labels]);
  const aliases=game.id==='red-dead-redemption-2'?['RDR2','RDR 2']:[];
  const discovery=[...labels,...updates.filter(Boolean).map(v=>v.replace(/^0(?=\d)/,'')),...game.files.map(file=>file.filename),...aliases];
  if(game.arch==='prospero') discovery.push('native PS5 PPSA');
  if(kinds.includes('4k')) discovery.push('4K UHD 3840x2160 3840×2160 internal resolution');
  if(kinds.includes('120hz')) discovery.push('120Hz display refresh rate');
  const search=[game.title,scope,...game.titleIds,...updates,...game.options.map(o=>o.Name),...discovery].join(' ').toLowerCase();
  const edition=game.arch==='prospero'?'Native PS5 · PPSA XML':game.platforms.includes('ps4')?'PS4 · CUSA XML':'PS4 game on PS5 · backward compatibility';
  const storagePlatforms=game.platforms;
  const variant=d.games.some(other=>other.id!==game.id&&other.title===game.title&&other.arch===game.arch)?'<p class="patch-source-variant">Source definition: '+esc(game.sourceFile)+'</p>':'';
  const nativeRdr=game.arch==='prospero'&&game.titleIds.includes('PPSA30523');
  const summary=nativeRdr?'2160p internal resolution and a graphics preset for 120 Hz output':unique(game.options.filter(o=>fpsOption.test(o.Name)).map(o=>o.Name)).join(' · ')||'Gameplay, fixes and graphics options';
  const special=game.title==='Bloodborne'?'The delta-time patch targets 60 FPS. The source warns about the Laurence DLC cinematic; disable that option to progress if affected. The separate 30 FPS pacing option and 720p option serve different goals.':game.title==='Red Dead Redemption 2'?'The files provide cap removal for 1.29 and 1.32. The separate 1.32 “120fps” option asks for VideoOut 120Hz; that is not evidence of stable 120 FPS.':game.title==='The Last Guardian'?'The author marks both the CPU-limited FPS unlock and GPU-limited 4K option for use on PS5. This card is therefore shown on the PS5 page.':'Select an option by its exact game update and hardware note. FPS targets and unlocked caps are not measured performance guarantees.';
  return `<article class="patch-card" id="${esc(game.id)}" data-patch-card data-platforms="${targets.join(' ')}" data-kinds="${kinds.join(' ')}" data-search="${esc(search)}"><img src="${esc(game.image)}" alt="${esc(game.title)} patch-catalogue artwork" width="960" height="540" loading="lazy"><div class="patch-card-body"><span class="patch-edition">${edition}</span><h3>${esc(game.title)}</h3>${variant}${tags}<p class="patch-summary">${esc(summary)}</p><p class="patch-versions"><strong>Game updates:</strong> ${updates.map(v=>v==='mask'?'pattern scan (mask)':esc(v)).join(', ')}<br><strong>Title IDs:</strong> ${game.titleIds.map(esc).join(', ')}</p><p>${esc(special)}</p><div class="patch-file-picker" data-patch-file-picker data-download-page="/console/${platform}/downloads.html"><label for="patch-${esc(game.id)}-${platform}">Choose your installed title ID</label><select id="patch-${esc(game.id)}-${platform}"><option value="">Choose title ID…</option>${game.files.map(file=>`<option value="${file.titleId}" data-id="${file.downloadId}" data-url="${file.downloadLocal}">${file.titleId}.xml</option>`).join('')}</select><div class="guide-links"><a data-patch-download aria-disabled="true">Download selected XML</a>${storagePlatforms.map(target=>`<a data-patch-storage="/console/${target}/downloads.html" aria-disabled="true">Choose ${target.toUpperCase()} storage</a>`).join('')}</div></div><details><summary>Patch options, updates and source notes</summary><ul class="patch-options">${game.options.map(o=>`<li><strong>${esc(o.Name)}</strong> · game ${o.AppVer==='mask'?'pattern scan (mask)':esc(o.AppVer)}${o.Note?`<small>${esc(o.Note)}</small>`:''}<small>Author: ${esc(o.Author)} · patch ${esc(o.PatchVer)}</small></li>`).join('')}</ul></details><noscript><details><summary>Download by title ID</summary><ul>${game.files.map(f=>`<li><a href="${f.downloadLocal}" download>${f.filename}</a></li>`).join('')}</ul></details></noscript></div></article>`;
}
function patchTags(labels){
  return `<ul class="patch-tags" aria-label="Patch types">${labels.map(label=>`<li class="feature-tag">${esc(label)}</li>`).join('')}</ul>`;
}
function standaloneCard(files,platform){
  const {game,title,author,patchVersion}=files[0];
  const targets=game==='persona-3-reload'?[platform]:['native'];
  const persona=game==='persona-3-reload';
  const kinds=files[0].kinds||(persona?['fps','60fps','graphics']:['fps','graphics']);
  const labels=kinds.map(kind=>patchLabels[kind]);
  const edition=persona?(platform==='ps4'?'PS4 · GoldHEN SHN':'PS4 game on PS5 · etaHEN and Itemzflow'):'Native PS5 · PPSA '+(files[0].filename.endsWith('.json')?'JSON':'XML');
  const summary=files[0].summary||(persona?'60 FPS and Disable Motion Blur':'FPS unlock and graphics profile switches');
  const setup=files[0].setup||(persona?(platform==='ps4'
    ?'Place the matching SHN in /data/GoldHEN/cheats/shn/ and enable Auto-Apply on Game Start in GoldHEN.'
    :'Enable the itemzflow_xml_patches plugin in etaHEN, copy the XML to /data/etaHEN/patches/xml/, enable Trainers in Itemzflow and launch the game there.')
    :'Use PS Patch System and place the XML in /data/user/patches/xml_prospero/. The author targets up to 60 FPS, with a separate 120 Hz setup on supported displays. Actual FPS varies. Select at most one graphics profile option.');
  const credit=author?`<p>Patch${patchVersion?' '+esc(patchVersion):''} by ${esc(author)}</p>`:'';
  const search=[title,summary,edition,author,setup,...labels,...(kinds.includes('120hz')?['120Hz display refresh rate']:[]),...files.flatMap(file=>[file.id,file.update,file.update.replace(/^0/,''),file.filename])].join(' ').toLowerCase();
  if(!persona){
    const image=patchImages[game]?.image;
    return `<article class="patch-card" id="${esc(game)}-standalone" data-patch-card data-platforms="${targets.join(' ')}" data-kinds="${kinds.join(' ')}" data-search="${esc(search)}">${image?`<img src="${esc(image)}" alt="" width="960" height="540" loading="lazy">`:''}<div class="patch-card-body"><span class="patch-edition">${edition}</span><h3>${esc(title)}</h3>${patchTags([persona?(platform==='ps5'?'PS5 backward compatibility':'PS4 / Pro'):'Native PS5',...labels])}<p class="patch-summary">${esc(summary)}</p><ul class="patch-direct-downloads">${files.map(file=>`<li><strong>${esc(file.id)} · ${esc(file.update)}</strong><a class="patch-download-button" href="${esc(file.local)}" download="${esc(file.filename)}" aria-label="Download ${esc(file.filename)}">Download</a></li>`).join('')}</ul></div></article>`;
  }
  return `<article class="patch-card" id="${game}-standalone${platform==='ps5'?'-ps5':''}" data-patch-card data-platforms="${targets.join(' ')}" data-kinds="${kinds.join(' ')}" data-search="${esc(search)}">${persona?'<img src="/assets/images/game-patches/persona-3-reload-official.jpg" alt="Persona 3 Reload artwork" width="960" height="540" loading="lazy">':''}<div class="patch-card-body"><span class="patch-edition">${edition}</span><h3>${esc(title)}</h3>${patchTags([persona?(platform==='ps5'?'PS5 backward compatibility':'PS4 / Pro'):'Native PS5',...labels])}<p class="patch-summary">${esc(summary)}</p><p>${esc(setup)}</p>${credit}<ul class="patch-options">${files.map(file=>`<li><strong>${file.id} · ${file.update}</strong><br><a href="${file.local}" download>Download ${file.filename}</a> · ${ext(file.source,'Pinned original')}</li>`).join('')}</ul></div></article>`;
}
function nativePatchGuide(){
  return `<aside class="patch-runtime patch-use-guide" aria-labelledby="native-patch-guide">
    <h4 id="native-patch-guide">How to use PS5 patches</h4>
    <p>Match your installed PPSA title ID and game update to the card before downloading.</p>
    <ul>
      <li><strong>JSON with CheatRunner.</strong> Copy the file to <code>/data/cheatrunner/cheats/json/</code>, rescan, and enable the FPS option shown on the card. For Black Flag Resynced, select <strong>Fidelity 60 FPS Target</strong>. Some files also include separate gameplay cheats.</li>
      <li><strong>Green Hell and The Medium XMLs with CheatRunner.</strong> Copy the file to <code>/data/cheatrunner/patches/xml_prospero/</code> and rescan. Disable overlapping patches for Green Hell. Set The Medium’s patch to apply at game boot.</li>
      <li><strong>Other native XMLs with PS Patch System.</strong> Copy the file to <code>/data/user/patches/xml_prospero/</code> and enable the matching option in the patch manager. For MindsEye’s 120 FPS target, use a compatible display with 120 Hz enabled and the game’s HFR flag or a compatible SceShellCore override. Select at most one graphics profile.</li>
    </ul>
    <p>${link('#ps5-setup','PS Patch System setup')}</p>
  </aside>`;
}
function engineSetup(platform,d){
  const engine=d.resources.find(r=>r.id===`fps-${platform}-patch-system-${d.engine.release}`);
  const buttons=`<div class="guide-links"><a href="${engine.local}" download>Download ${platform==='ps4'?'Orbis':'Prospero'} loader ELF</a>${link(`/console/${platform}/downloads.html?file=${engine.id}#files`,'Choose console storage')}</div>`;
  const goldhen=platform==='ps4'?section('goldhen','PS4 option: GoldHEN game-patch plugin',note('<p>Use GoldHEN <strong>2.3 or newer</strong> on a firmware supported by that exact GoldHEN release. This route uses a native PS4 PRX plugin and PS4 Cheats Manager. It is separate from the ELF patch-system route below.</p>')+steps([
    ['Install PS4 Cheats Manager 1.2.2','Use its ready PS4 PKG with your existing supported package installer. Downloading the PKG does not install the app.'],
    ['Configure the game-patch plugin','Put <code>game_patch.prx</code> in <code>/data/GoldHEN/plugins/</code>. Merge its line into the matching game’s section in your existing <code>/data/GoldHEN/plugins.ini</code>, and enable plugin loading in GoldHEN. Preserve every existing entry.'],
    ['Transfer the exact title file','For example, place the selected <code>CUSA00900.xml</code> at <code>/user/data/GoldHEN/patches/xml/CUSA00900.xml</code>. Create missing folders with your console file manager. A copy in a general downloads folder is not yet installed as patch data.'],
    ['Choose the exact option','Open the game’s patch list in PS4 Cheats Manager. Enable only the option matching your title ID, game update and hardware. Fully close and relaunch the game so the patch engine can apply it.']
  ])+`<pre><code>; Example only — merge into your existing configuration\n[CUSA00900]\n/data/GoldHEN/plugins/game_patch.prx</code></pre><div class="guide-links"><a href="${d.resources.find(r=>r.id==='fps-ps4-cheats-manager-1-2-2').local}" download>Download PS4 Cheats Manager PKG</a><a href="${d.resources.find(r=>r.id==='fps-goldhen-game-patch-1-188').local}" download>Download game_patch.prx</a>${link('/console/ps4/apps.html','File managers & apps')}</div>`):'';
  return goldhen+section(platform==='ps4'?'setup':'ps5-setup',`${platform.toUpperCase()} option: PS Patch System`,note(`<p>The project reports a confirmed working firmware range of <strong>${d.engine.confirmedFirmware[platform]} on ${platform.toUpperCase()}</strong>. This is the engine’s published tested range, not a guarantee for every game or firmware build. ${platform==='ps5'?'The cited range does not establish 13.xx support.':'Other PS4 firmware can use the GoldHEN route only when that exact environment supports the plugin.'}</p>`)+buttons+steps([
    ['Start the matching ELF loader','Use a firmware-compatible homebrew environment and elfldr listening on TCP <code>9021</code>. Select the '+(platform==='ps4'?'Orbis (PS4)':'Prospero (PS5)')+' build. '+(platform==='ps4'?'This ELF is not a BIN; renaming it does not convert the payload.':'Use your supported loader or Payload Manager to explicitly load the ELF.')],
    ['Place title-specific XML files',platform==='ps4'?'Put the chosen CUSA XML at <code>/data/user/patches/xml_orbis/CUSAxxxxx.xml</code>. Create and verify the folder with your file manager.':'Put PS4 CUSA XMLs in <code>/data/user/patches/xml_orbis/</code>. Put native PS5 PPSA XMLs in <code>/data/user/patches/xml_prospero/</code>. Keep the exact selected title-ID filename.'],
    ['Open the running patch manager','Use the address form below after loading the engine. The project hosts its patch dashboard on port <code>23900</code>. Opening a URL alone does not load the engine.'],
    ['Apply a matching option, then launch','Review the title ID, game update, hardware restriction and patch note. Enable only the intended options in the manager and launch the game. Restart the game when changing its patch selection.']
  ])+`<form class="console-service-opener" data-console-service-opener data-platform="${platform}"><div><label for="patch-console-ip-${platform}">${platform.toUpperCase()} IP address</label><input id="patch-console-ip-${platform}" inputmode="decimal" autocomplete="off" spellcheck="false" placeholder="192.168.1.50"></div><button type="button" data-use-loopback>Use this console · 127.0.0.1</button><div class="guide-links"><a data-console-service="patches" aria-disabled="true" target="_blank" rel="noopener noreferrer">Open patch manager</a></div><p>Use 127.0.0.1 only in the browser on the console. On another device, enter the console’s private LAN address.</p><p role="status" aria-live="polite"></p></form><noscript><p>Open <code>http://127.0.0.1:23900/</code> on the console, or replace 127.0.0.1 with the console’s LAN IP on another device.</p></noscript><div class="guide-links">${link(`/console/${platform}/downloads.html`,'Console downloads')}${link(`/console/${platform}/${platform==='ps4'?'apps':'transfer-tools'}.html`,'Transfer & file management')}${platform==='ps5'?link('/console/ps5/payload-manager.html','Open payload manager'):''}${ext(`https://github.com/illusionyy/ps-patch-system/releases/tag/${d.engine.release}`,'Pinned engine release')}</div>`);
}
function buildConsoleGamePatches(){
  const d=data();
  const ps4Games=d.games.filter(game=>game.arch==='orbis');
  const ps5Games=d.games.filter(game=>game.arch==='prospero');
  const nativeFiles=standalone.files.filter(file=>/^PPSA\d{5}$/.test(file.id));
  const otherFiles=standalone.files.filter(file=>!nativeFiles.includes(file));
  const renderExtras=files=>unique(files.map(file=>file.game+' '+file.platform)).map(key=>{
    const group=files.filter(file=>file.game+' '+file.platform===key);
    return standaloneCard(group,group[0].platform);
  }).join('');
  const entryCount=d.games.length+unique(standalone.files.map(file=>file.game+' '+file.platform)).length;
  const featured=`<div class="guide-links patch-quick-links">${link('#ps4-patches','PS4 patches')}${link('#native-ps5-patches','Native PS5 patches')}${link('#bloodborne','Bloodborne 60 FPS')}${link('#red-dead-redemption-2','RDR2 FPS unlocks')}${link('#mindseye-standalone','MindsEye 120 FPS target')}${link('#red-dead-redemption-reddeadredemption','Red Dead Redemption 4K')}${link('#standalone-patches','Additional patches')}<a href="${d.archive.local}" download>Download catalogue XMLs (ZIP)</a></div>`;
  const controls=`<div class="patch-controls"><div><label for="patch-search">Search game, title ID, update or patch</label><input id="patch-search" type="search" data-patch-search placeholder="Bloodborne, PPSA28209, 60 FPS…"></div><div><label for="patch-platform">Game platform</label><select id="patch-platform" data-patch-platform><option value="">All platforms</option><option value="ps4">PS4 / Pro</option><option value="ps5">PS4 games on PS5</option><option value="native">Native PS5</option></select></div><div><label for="patch-kind">Patch type</label><select id="patch-kind" data-patch-filter><option value="">All patch types</option><option value="fps">FPS / frame pacing</option><option value="60fps">60 FPS options</option><option value="120fps">Native PS5 120 FPS targets</option><option value="120hz">Native PS5 120 Hz output</option><option value="4k">Native PS5 4K graphics</option><option value="graphics">Graphics / rendering</option><option value="gameplay">Gameplay / fixes / other</option></select></div><p data-patch-count role="status" aria-live="polite">${entryCount} patch entries</p></div>`;
  const catalogue=`<div data-patch-catalogue>${featured}${controls}<p class="patch-catalogue-note">Match your title ID and game update before downloading. FPS labels describe patch targets or settings. Actual performance varies. A <code>mask</code> option uses pattern matching.</p>
    <div data-patch-group><h3 id="ps4-patches" class="patch-catalogue-heading">PS4 games</h3><p class="patch-catalogue-note">CUSA files target PS4 builds. Use the platform filter to find patches also listed for PS5 backward compatibility.</p><div class="patch-card-grid">${ps4Games.map(game=>gameCard(game,game.platforms.includes('ps4')?'ps4':'ps5',d)).join('')}</div></div>
    <div data-patch-group><h3 id="native-ps5-patches" class="patch-catalogue-heading">Native PS5 games</h3><p class="patch-catalogue-note">PPSA files target native PS5 builds. Match the update and loader for your game.</p>${nativePatchGuide()}<div class="patch-card-grid">${renderExtras(nativeFiles)}${ps5Games.map(game=>gameCard(game,'ps5',d)).join('')}</div></div>
    <div data-patch-group><h3 id="standalone-patches" class="patch-catalogue-heading">Additional PS4 game patches</h3><p class="patch-catalogue-note">Match the exact title ID, update and loader shown on each card.</p><div class="patch-card-grid">${renderExtras(otherFiles)}</div></div></div>`;
  const content=section('start','Choose your game and patch',`<div class="patch-intro"><p>Browse ${entryCount} PlayStation patch entries, including PS4 and PS4 Pro games, PS4 games running on PS5, and native PS5 games.</p><div class="guide-links">${link('#catalogue','Browse game patches')}${link('#goldhen','GoldHEN setup')}${link('#setup','PS4 patch engine')}${link('#ps5-setup','PS5 patch engine')}</div></div>`)+
      section('catalogue','Game patch catalogue',catalogue)+
      section('hardware','Understand the hardware target',`<table class="patch-hardware"><tbody><tr><th>PS4 base</th><td>An unlocked cap can still hit CPU or GPU limits. Some files offer a separate lower-resolution option. Follow each option’s hardware note.</td></tr><tr><th>PS4 Pro</th><td>Pro-specific resolution and display options are labelled in the source metadata. Choose the one intended for your hardware and game mode.</td></tr><tr><th>PS5</th><td>PS4 CUSA patches use backward compatibility; native PS5 PPSA patches use the PS5 executable and update. Engine firmware support and game support are separate checks.</td></tr></tbody></table><p class="patch-intro">A 120Hz output option also needs a compatible display/output mode and a suitable patch engine. It does not prove that a game renders a stable 120 FPS. No physical-console performance measurements were made for this catalogue.</p>`)+
      engineSetup('ps4',d)+engineSetup('ps5',d)+
      section('archive','Original patch archive',`<p>The original upstream <code>patch1.zip</code> remains available with every title XML unchanged. Check the title-ID prefix rather than relying on the archive folder: CUSA identifies PS4 files and PPSA identifies native PS5 files. PS Patch System expects the CUSA files in <code>/data/user/patches/xml_orbis/</code>; place the contents in that destination instead of copying the archive folder name blindly.</p><div class="guide-links"><a href="${d.archive.local}" download>Download original patch1.zip</a>${ext(`https://github.com/illusionyy/PS-Game-Patch/releases/tag/${d.release}`,'Pinned patch release')}</div>`)+
      section('sources','Compatibility and source records',sourceList([
        [`https://github.com/illusionyy/PS-Game-Patch/tree/${d.revision}`,'Maintained patch data at pinned commit'],
        ['https://github.com/illusionyy/ps-patch-system','Current patch-engine paths, port and confirmed firmware ranges'],
        ['https://github.com/GoldHEN/GoldHEN_Plugins_Repository','GoldHEN plugin requirements and per-title configuration'],
        ['https://github.com/bucanero/PS4CheatsManager/releases/tag/v1.2.2','PS4 Cheats Manager 1.2.2'],
        ['https://github.com/illusionyy/libhijacker-game-patch','Archived legacy libhijacker reference — separate firmware and loader requirements']
      ])+note('<p>The old GoldHEN patch repository points to the maintained patch repository used here. Legacy libhijacker is archived and unmaintained; its 3.xx–4.51-era instructions and port 9020 are not the current PS Patch System setup.</p>'));
  const file='console/ps4/game-patches.html';
  page(file,'PS4 Game Patches','Find PS4, PS4 Pro and native PS5 game patches for FPS, graphics and gameplay. Search by CUSA, PPSA or game update and download the matching XML, JSON or SHN.','/assets/images/game-patches/bloodborne-official.jpg',ps4nav,content,'#catalogue','Browse game patches');
  const target=path.join(root,file);
  const html=fs.readFileSync(target,'utf8').replace('</head>','<link rel="stylesheet" href="/assets/console-launcher.css?v=1"><link rel="stylesheet" href="/assets/console-game-patches.css?v=4"></head>').replace('</body>','<script defer src="/assets/console-service-opener.js?v=4"></script><script defer src="/assets/console-game-patches.js?v=3"></script></body>');
  fs.writeFileSync(target,html);
  fs.writeFileSync(path.join(root,'console/ps5/game-patches.html'), '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PS4 Game Patches</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://whatwhatboy.com/console/ps4/game-patches.html"><script defer src="/assets/ps5-game-patches-redirect.js"></script></head><body><p>The PS5 patch catalogue moved to <a href="/console/ps4/game-patches.html#native-ps5-patches">PS4 Game Patches</a>.</p></body></html>\n');
  console.log('Built the shared PS4 and PS5 game patch catalogue.');
}
if(require.main===module)buildConsoleGamePatches();
module.exports={buildConsoleGamePatches,gameCard};
