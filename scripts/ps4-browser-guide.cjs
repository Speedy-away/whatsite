'use strict';
// One complete guide; historical guide URLs remain usable without a firmware split.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const route = '/console/ps4/jailbreaks.html';
const data = {
  reviewed: '2026-11-11', image: '/assets/images/consoles/playstation.jpg',
  host: 'https://gamerhack.github.io/g2all/', goldhen: '2.4b18.13',
  video: {id: 'jkN-EJPbh1Y', title: 'How to Jailbreak the PS4 in 2026 (14.00 or lower)', creator: 'MODDED WARFARE', published: '2026-11-10'},
  chapters: [[37, 'Disable automatic updates'], [63, 'Check your firmware'], [159, 'Optional USB firmware update'], [279, 'Set up the connection'], [393, 'Run the browser jailbreak'], [521, 'Update blocking'], [549, 'Use the cache offline'], [588, 'Install homebrew apps'], [673, 'Configure GoldHEN'], [817, 'Cheats and patches'], [920, 'Reload after a restart']]
};
const jailbreakNav = [['/console/ps4/', 'PS4 Hub'], [route, 'Jailbreak'], ['#walkthrough', 'Step-by-step guide'], ['#firmware-downloads', 'Firmware'], ['#help', 'Troubleshooting']];
function buildGuide() {
  const {page, section, note, steps, ext, link, videoEmbed, sourceList, esc} = require('./build-console-guides.cjs');
  const watch = (seconds, label) => ext(`https://www.youtube.com/watch?v=${data.video.id}&t=${seconds}`, label);
  const picture = (name, caption) => `<figure class="ps4-jb-figure"><a href="/assets/images/ps4-jailbreak-guide/${name}.svg" target="_blank" rel="noopener noreferrer"><img src="/assets/images/ps4-jailbreak-guide/${name}.svg" width="960" height="600" alt="${esc(caption)}" loading="lazy"></a><figcaption>${esc(caption)}</figcaption></figure>`;
  // The exact video host must survive the site's general host-link normalization.
  const originalHost = `<a data-tutorial-host href="${data.host}" target="_blank" rel="noopener noreferrer">${data.host}</a>`;
  const outline = `<nav class="ps4-jb-outline" aria-label="Guide outline">${[['before','Before you start'],['walkthrough','Browser setup'],['offline','Offline and restarts'],['apps','Install apps'],['settings','Optional settings'],['firmware-downloads','Firmware files'],['help','Troubleshooting'],['video','Video and chapters']].map(([id,label],i)=>`<a href="#${id}"><span aria-hidden="true">${String(i+1).padStart(2,'0')}</span>${label}</a>`).join('')}</nav>`;
  const before = section('before', 'Before you start',
    `<div class="ps4-jb-split"><div><p>This guide follows MODDED WARFARE’s 10 November 2026 PS4 tutorial. The demonstrated browser route covers <strong>7.00–14.00</strong> and loads GoldHEN through GamerHack. The host was checked with GoldHEN <strong>${data.goldhen}</strong>.</p><ul class="ps4-jb-checklist"><li>A PS4 with a supported installed firmware and its controller.</li><li>An internet connection for the first cache installation.</li><li>A computer and USB drive only if you choose a firmware update or USB app installation.</li></ul>${note('<p><strong>Keep your installed firmware while checking support.</strong> Open Settings → System → System Information. Firmware 14.00 is the upper limit of this guide. The host also offers a separate 5.05/5.07 route; unsupported older versions need their own matching method. “14.00 or lower” does not mean every older version uses this same chain.</p>')}</div>${picture('firmware', 'Menu illustration: check the installed PS4 system software before choosing a browser route.')}</div>`);
  const walkthrough = section('walkthrough', 'Run the browser jailbreak',
    `<p>Follow these steps in order. The browser host supplies the compatible payload, so this guide does not require a separate GoldHEN or HEN download.</p>` + steps([
      ['1. Disconnect and turn off automatic downloads', 'In Settings → Network, temporarily uncheck Connect to the Internet. Then open Settings → System → Automatic Downloads and turn off the automatic-download options. This gives you time to check the installed version before reconnecting.'],
      ['2. Confirm the firmware', 'Use Settings → System → System Information. If your version is supported, keep it and continue. Updating to 14.00 is optional; read the compact firmware section below before changing anything. A USB update is not a downgrade method.'],
      ['3. Set up the internet connection', 'Reconnect through Settings → Network → Set Up Internet Connection. Choose Wi-Fi or LAN, then Custom. For a typical home network choose Automatic IP and Do Not Specify for the DHCP host name.'],
      ['4. Choose the DNS setting', 'Choose Manual DNS. The video offers 62.210.38.117 and 45.56.67.85 as alternative primary DNS servers. Use one as the primary address; they are not instructions to put both in primary and secondary fields. Keep MTU Automatic and choose Do Not Use for proxy unless your own network needs different settings.'],
      ['5. Check the connection', 'Open the PS4 Internet Browser and check that an ordinary website loads. If the blocking DNS prevents all browsing, try the other address. The video also demonstrates Easy network setup as a fallback. Keep automatic downloads disabled; a working internet connection alone does not verify update blocking.'],
      ['6. Prepare the browser once', 'Before the first cache installation, clear frequently used pages and browsing history through Options. In browser Settings, delete cookies and clear website data. Close the browser with Circle and open it again. Skip this cleanup on later launches so you retain the offline cache.'],
      ['7. Install the host’s offline cache', `Enter the exact address below in the PS4 browser. Wait for the cache to finish and for the instruction to close and reopen the browser. Bookmark this address. ${originalHost}`],
      ['8. Close, reopen and wait', 'Close the browser, reopen the same host and allow the cached page to run. Wait for the successful GoldHEN notification and check that the GoldHEN settings menu appears. The video shows build 2.4b18.13; the live host may change later.'],
      ['9. Handle a failed attempt', 'If the console reports insufficient free system memory, dismiss the message and allow the host to retry. If the host requests a reboot or the console shuts off, restart it and reopen the cached host. Read the displayed failure message before retrying.'],
      ['10. Confirm the session is ready', 'Return to the PS4 function menu and open GoldHEN. A saved bookmark or downloaded file alone does not confirm success. Continue to app installation only after GoldHEN has loaded.']
    ]) + `<div class="guide-links">${watch(393, 'Watch the browser setup')}${ext('https://speedy-away.github.io/hosts/ps4/', 'Browse other PS4 hosts')}</div>` +
    note('<p><strong>DNS and update blocking:</strong> The two DNS addresses are intended to restrict update connections and may also restrict PlayStation services. GoldHEN has a built-in system-update blocker. Neither is a reason to accept an offered firmware update or assume that PSN requirements have changed.</p>') + picture('browser-cache', 'Workflow illustration: install the cache, close and reopen the browser, then confirm GoldHEN loaded.'));
  const offline = section('offline', 'Use it offline and reload after a restart',
    `<p>After the first successful cache installation, disconnect in Settings → Network and reopen the same bookmark to check offline access. Keep cookies and website data intact. Clearing the browser cache means you must reconnect and install the cache again.</p><p>A full shutdown or restart ends the active jailbreak session. Your installed apps and files stay on storage, but some apps show a padlock until you reopen the cached host and GoldHEN loads again. Rest Mode can retain a session; reliability depends on the firmware and payload build. A cold start followed by the browser route is the recovery path if it fails.</p><div class="guide-links">${watch(549, 'Watch offline use')}${watch(920, 'Watch reloading after a restart')}</div>`);
  const apps = section('apps', 'Install homebrew apps from USB',
    `<div class="ps4-jb-split"><div>${steps([
      ['Prepare the storage', 'Use an exFAT USB drive where possible, or FAT32 for files small enough for its 4 GB per-file limit. Back up the drive before any optional formatting.'],
      ['Copy the app package', 'Place a trusted PS4 homebrew .pkg file in the root of the USB drive, outside other folders. Safely eject the drive and connect it to the PS4.'],
      ['Install through GoldHEN', 'With GoldHEN running, open GoldHEN → Debug Settings → Package Installer. Select the app package, wait for installation and launch its new home-screen tile. Match the app’s own firmware requirements.']
    ])}<div class="guide-links">${link('/console/ps4/apps.html', 'Browse PS4 homebrew apps')}${watch(588, 'Watch package installation')}</div></div>${picture('usb-layout', 'USB illustration: firmware updates use PS4/UPDATE/PS4UPDATE.PUP; installable app packages go in the USB root.')}</div>`);
  const settings = section('settings', 'Optional GoldHEN settings',
    `<p>The core jailbreak is ready once GoldHEN loads. The video then demonstrates settings you can enable when you need them:</p><ul class="ps4-jb-checklist"><li><strong>Cheats and patches:</strong> update the cheat and patch archives from their GoldHEN menus. A patch must match the game, title ID and installed update.</li><li><strong>Plugins:</strong> update the plugin archive, then enable the plugin loader and game-patch plugin for compatible patches. The video uses PS4 Cheats Manager as a fallback if the built-in plugin update fails.</li><li><strong>Overlays:</strong> choose FPS or system-information displays and their position in Game Overlay Settings.</li><li><strong>File transfer:</strong> enable the FTP server only when you want to transfer files on your own local network.</li></ul><p>Launch a game after enabling its patches. Hold Share for the cheat menu, or use the game tile’s Options → GoldHEN Cheat Menu. Disable active cheats before switching between different cheat sets. Some features depend on the exact app, game update and GoldHEN build.</p><div class="guide-links">${watch(673, 'Watch the settings tour')}${watch(817, 'Watch cheats and patches')}${link('/console/ps4/transfer-tools.html', 'File-transfer tools')}</div>`);
  const firmware = section('firmware-downloads', 'PS4 firmware downloads',
    `<details class="ps4-jb-firmware"><summary><span>Update and recovery files by version</span><span>Optional</span></summary><div><p>You can stay on a supported older firmware. Updating may change exploit stability and compatibility, and this process cannot take a console back to an older version.</p><div class="guide-links">${ext('https://archive.midnightchannel.net/SonyPS/Firmware/?cat=ps4sys', 'Video’s firmware archive')}${ext('https://darthsternie.net/ps4-firmwares/', 'Alternative firmware archive')}</div>${steps([
      ['Select the exact file', 'For the video’s optional update, select the standard 14.00 update file, not a higher release or a recovery/reinstallation file. Check its version, size and published checksum. Recovery files serve a different installation process.'],
      ['Prepare the USB path', 'On exFAT or FAT32 storage create uppercase PS4, then UPDATE inside it. Copy the update file there as PS4UPDATE.PUP. Show filename extensions so you do not accidentally create a double extension.'],
      ['Update while disconnected', 'Keep Connect to the Internet unchecked. Insert the drive and open Settings → System Software Update. Confirm that the version displayed is exactly 14.00 before proceeding. If it offers a different version, stop.'],
      ['Recheck after reboot', 'Let the update finish without interrupting power. After the console restarts, confirm the installed version in System Information and return to the browser setup above.']
    ])}<div class="guide-links">${watch(159, 'Watch the optional 14.00 update')}</div></div></details>`);
  const help = section('help', 'Troubleshooting',
    `<div class="ps4-jb-help">${[
      ['The host says the firmware is unsupported', 'Recheck System Information and the exact host address. This tutorial covers the demonstrated 7.00–14.00 route; the host’s separate 5.05/5.07 option and older firmware require their own compatible chain. Do not install a random newer firmware to fix this message.'],
      ['The cache does not work offline', 'Reconnect and revisit the exact bookmark. Let caching finish before closing the browser. If the cache installation itself is broken, clear the browser data once and repeat the first setup. That cleanup removes the old cache.'],
      ['The browser reports a memory error', 'Dismiss the ordinary memory message and let the host retry. For a reboot request or console crash, restart first. Repeated failures can depend on the exploit build; check the host’s instructions.'],
      ['Apps show a padlock after restarting', 'Reload GoldHEN through the cached browser host. Installed apps remain on storage; reinstalling everything is not normally the first step.'],
      ['A USB app package is missing', 'Check the drive format, put the PS4 .pkg in the USB root and make sure GoldHEN is running. An archive must be extracted to its ready-to-install package first.'],
      ['I used the old 14.00 or 13.52 guide link', 'Both addresses now open this complete guide. Earlier downloads and their compatibility records remain preserved; the guide no longer asks you to choose between two separate pages.']
    ].map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>`);
  const video = section('video', 'Follow the original video',
    videoEmbed(data.video.id, data.video.title) + `<p>MODDED WARFARE · published 10 November 2026. The written guide above is a paraphrased companion to the supplied PS4 video.</p><div class="ps4-jb-chapters">${data.chapters.map(([s,t])=>watch(s, `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')} · ${t}`)).join('')}</div>`);
  const sources = section('sources', 'Sources and compatibility', sourceList([
    [`https://www.youtube.com/watch?v=${data.video.id}`, 'MODDED WARFARE: supplied video, chapters and English transcript'],
    ['https://github.com/GamerHack/GamerHack.github.io/tree/main/g2all', 'GamerHack: combined browser host and firmware routing'],
    ['https://raw.githubusercontent.com/GamerHack/GamerHack.github.io/main/g2all/index.html', 'GamerHack: exact firmware dispatch and payload build'],
    ['https://github.com/GoldHEN/GoldHEN', 'GoldHEN: package installer, update blocker and optional features'],
    ['https://manuals.playstation.net/document/en/ps4/settings/update.html', 'PlayStation: PS4 system software update settings']
  ]));
  page(route.slice(1), 'PS4 Jailbreak · 14.00 or Lower', 'Complete PS4 browser jailbreak guide for 14.00 or lower: firmware checks, DNS, offline cache, app installation and troubleshooting.', data.image, jailbreakNav,
    `<div class="ps4-jb-reading"><div class="ps4-jb-intro">${outline}</div>${before}${walkthrough}${offline}${apps}${settings}${firmware}${help}${video}${sources}</div>`, '#before', 'Start the guide');
  const file = path.join(root, route);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace('</head>', '<link rel="stylesheet" href="/assets/ps4-jailbreak-guide.css?v=20261111">\n</head>');
  html = html.replace('<body class="console-guide', '<body class="ps4-jailbreak-guide console-guide');
  html = html.replace(/<footer class="guide-footer">[\s\S]*?<\/footer>/, '<footer class="guide-footer"><div class="container">Reviewed 11 November 2026. Firmware and payload requirements remain specific to each build.</div></footer>');
  html = html.replace(/<script\b[^>]*src="\/assets\/console-setup-popups\.js[^"]*"[^>]*><\/script>/g, '');
  fs.writeFileSync(file, html);
}
function buildAlias(file) {
  const html = `<!DOCTYPE html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PS4 jailbreak guide moved | whatwhatboy</title><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://whatwhatboy.com${route}"><meta http-equiv="refresh" content="0;url=${route}"></head><body><main><h1>PS4 jailbreak guide</h1><p>The complete guide now covers 14.00 or lower on one page.</p><a href="${route}">Open the complete PS4 guide</a></main></body></html>\n`;
  fs.writeFileSync(path.join(root, 'console/ps4', file), html);
}
module.exports = {buildGuide, buildAlias, data, jailbreakNav};
if (require.main === module) buildGuide();
