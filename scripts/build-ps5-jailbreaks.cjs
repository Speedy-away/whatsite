const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const selector = '/console/ps5/jailbreaks.html';
const firmware = require('../docs/ps5-jailbreak-firmware.json');
const relapseVersions = firmware.routes.find(route => route.id === 'relapse').supportedVersions.join(', ');
const jailbreakNav = [
  ['/console/ps5/', 'PS5 Hub'], [selector, 'Jailbreak'],
  [selector + '#firmware-downloads', 'Firmware'],
  ['/console/ps5/umtx2.html', '1.00–5.50 · UMTX2'],
  ['/console/ps5/bdj.html', '6.00–7.61 · Blu-ray'],
  ['/console/ps5/relapse.html', '7.00–13.60 · Relapse'],
  ['/console/ps5/y2jb.html', 'Y2JB Setup'],
  ['/console/ps5/downloads.html', 'Console Downloads']
];

function buildSelector() {
  const {page, section, steps, note, ext, link, sourceList, esc, ps5nav} = require('./build-console-guides.cjs');
  const umtx = firmware.routes.find(route => route.id === 'umtx2');
  const bdj = firmware.routes.find(route => route.id === 'bdj');
  const relapse = firmware.routes.find(route => route.id === 'relapse');
  const files = require('../docs/ps5-bdj-download-jobs.json');
  const figure = (name, alt, caption) => `<figure class="ps5-jb-figure"><img src="/assets/images/ps5-jailbreak-guide/${name}.svg" width="1120" height="360" alt="${esc(alt)}" loading="lazy"><figcaption>${esc(caption)}</figcaption></figure>`;
  const versions = route => `<details class="guide-version-details ps5-jb-versions"><summary>Exact supported firmware</summary><p dir="ltr" translate="no">${esc(route.supportedVersions.join(', '))}</p></details>`;
  const outline = [['#firmware', 'Check your firmware'], ['#before', 'Prepare your console'], ['#umtx2', 'UMTX2 browser guide'], ['#bdj', 'Blu-ray guide'], ['#relapse', 'Relapse browser guide'], ['#after', 'After the jailbreak'], ['#help', 'Troubleshooting']];
  const methodRow = (id, title, range, text) => `<a class="ps5-jb-route" href="#${id}"><span><strong translate="no">${title}</strong><span class="ps5-jb-range" dir="ltr" translate="no">${range}</span></span><span>${esc(text)}</span><span aria-hidden="true">↗</span></a>`;
  const downloadLinks = files.jobs.map(job => ext(job.url, job.filename)).join('');
  const body = section('outline', 'On this page', `<nav class="ps5-jb-outline" aria-label="Guide outline">${outline.map(([url, label], index) => `<a href="${url}"><span aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>${esc(label)}</a>`).join('')}</nav>`) +
    section('firmware', '1. Check your installed firmware',
      '<p>On the PS5 home screen, open the following menu and write down the system software version:</p>' +
      '<ol class="ps5-jb-menu-path"><li>Settings</li><li>System</li><li>System Software</li><li>Console Information</li></ol>' +
      figure('firmware-check', 'Illustration of a settings menu, system software and console information', 'Menu illustration. Read the version on your own console before choosing a method.') +
      '<p>Keep your current firmware. Match the complete version to one of the exact lists below; a range does not include every possible version inside it.</p>' +
      '<div class="ps5-jb-routes">' +
      methodRow('umtx2', 'UMTX2', '1.00–5.50', 'Browser route. No Blu-ray drive required.') +
      methodRow('bdj', 'BD-J + UMTX', '6.00–7.61', 'Disc route. Requires a working Blu-ray drive, writer and recordable disc.') +
      methodRow('relapse', 'Relapse', '7.00–13.60', 'Browser route on the listed versions. Excludes 9.05, 10.60 and 11.40.') + '</div>' +
      note('<p>On listed 7.xx firmware, the Blu-ray and Relapse routes overlap. Choose one entry method. Firmware absent from all three lists has no confirmed route in this guide.</p>')) +
    section('before', '2. Prepare your console',
      '<ul class="ps5-jb-checklist"><li>Keep a backup of important saves before starting. Do not select an update, reinstall or factory reset as a jailbreak step.</li><li>Use a stable Wi-Fi or wired connection. A computer sending a JAR or ELF needs to reach the PS5 on the same local network.</li><li>Browser methods need a working browser entry or User’s Guide redirect. A shortcut PKG cannot bootstrap a stock console because installing it already requires homebrew access.</li><li>For the disc method, prepare the matching JAR Loader v4.1.1 files, a Blu-ray writer and BD-R or BD-RE media.</li></ul>' +
      '<h3>Browser access and DNS</h3><p>Open your existing browser entry, or use the instructions supplied by your chosen User’s Guide DNS host. On PS5, connection settings are under Settings → Network → Settings → Set Up Internet Connection; select your connection and open Advanced Settings to change DNS.</p>' +
      '<h3>One documented User’s Guide entry</h3><p>For the public entry documented by the project below, use Manual DNS with primary 62.210.38.117 and leave secondary DNS blank. Open Settings → User’s Guide, Health &amp; Safety, and Other Information → User’s Guide. Some system versions label this menu Guide &amp; Tips.</p>' +
      '<p>If the redirected host shows a Type URL control, enter https://speedy-away.github.io/hosts/ps5/ there, then select your exact firmware. This is a browser-entry option, not a firmware unlock. The DNS service and its menu can change; if the redirect or Type URL control is absent, use your host provider’s documented browser entry instead.</p>' +
      sourceList([['https://github.com/MasterPS0/SIMPLE-WEBKIT-USERLAND-FOR-PS4-PS5', 'Public User’s Guide DNS and Type URL instructions']]) +
      note('<p>DNS changes alone do not jailbreak the console or guarantee update blocking. Restoring DNS to Automatic can allow update connections again. PSN sign-in has its own firmware requirements; using a modified console online can risk account or console suspension.</p>') +
      `<div class="guide-links">${ext('https://speedy-away.github.io/hosts/ps5/', 'Open PS5 host')}${ext('https://www.playstation.com/en-gb/support/connectivity/internet-connect-playstation/', 'PS5 network settings')}${ext('https://www.playstation.com/en-gb/support/account/suspensions/', 'PlayStation suspensions')}</div>`) +
    section('umtx2', '3. UMTX2 · browser walkthrough',
      '<p>Use this route only on the following UMTX2 builds. The browser chain stops at 5.50, even though the underlying UMTX vulnerability has a wider range.</p>' + versions(umtx) +
      figure('browser-flow', 'Illustration of a browser entry leading to an exploit chain and a payload menu', 'Browser entry → matching exploit → payload menu. A menu or loader result is the checkpoint before sending a payload.') +
      steps([
        ['Open the matching UMTX2 entry', 'Open the PS5 host, select your exact installed firmware and choose UMTX2. Check the firmware reported by the page before continuing. Stop if it reports an unsupported version.'],
        ['Start the normal Jailbreak option', 'Choose Jailbreak for initial kernel access. Webkit-only (sender) mode is for a loader that is already running; it does not start the kernel chain.'],
        ['Wait for the payload screen', 'Let the page finish its progress and any automatic retry. A browser error, freeze or restart is not a successful result.'],
        ['Read the listening address', 'The build attempts to start the ELF loader on TCP port 9021. Its older-payload loader uses port 9020 and is unavailable in Webkit-only mode. Read the displayed address and any loader errors.'],
        ['Load one supported payload', 'Choose a payload from the menu, or use a compatible sender with the displayed address and port. Check the payload’s exact firmware support, then wait for its own completion message.']
      ]) + `<div class="guide-links">${ext('https://speedy-away.github.io/hosts/ps5/', 'Open PS5 host')}${link('/console/ps5/umtx2.html', 'UMTX2 references & details')}</div>` +
      sourceList([['https://github.com/idlesauce/umtx2/blob/main/README.md', 'UMTX2 project instructions'], ['https://github.com/idlesauce/umtx2/blob/main/document/en/ps5/main.js', 'Firmware allowlist, sender mode and loader ports']])) +
    section('bdj', '4. Blu-ray · JAR Loader walkthrough',
      '<p>This route uses BD-J and UMTX on the following firmware. It needs a working, enabled PS5 Blu-ray drive, a computer with Java 11, a Blu-ray writer and recordable media.</p>' + versions(bdj) +
      figure('disc-flow', 'Illustration of a computer preparing a Blu-ray disc, a PS5 reading it and a computer sending a JAR over the local network', 'Burn the matching ISO, start its Remote Loader on PS5, then send the updated JAR files from the computer.') +
      `<div class="guide-links ps5-jb-files">${downloadLinks}</div>` +
      steps([
        ['Prepare the v4.1.1 files', 'Use ps5-jar-loader-4.1.1.iso, umtx1-1.0-SNAPSHOT.jar and jailbreak-1.0-SNAPSHOT.jar from the same official release. The Full ISO contains an older UMTX copy; v4.1.1 requires sending the updated UMTX through Remote Loader.'],
        ['Burn the ISO as a disc image', 'Use your Blu-ray writing software’s image-writing option, select the ISO and a BD-R or BD-RE disc, then finish disc verification. Copying the ISO file onto a data disc is not the same operation.'],
        ['Start the loader on PS5', 'Insert the disc, open Media and launch Disc Player / PS5 JAR Loader. Start its Remote Loader and wait for the listening screen. The default JAR port is 9025.'],
        ['Find the PS5’s local IP', 'Open Settings → Network → Connection Status → View Connection Status and note the IPv4 address. Keep the computer and PS5 on the same local network.'],
        ['Send the updated UMTX1 JAR', 'On the computer, run the first command below, replacing &lt;PS5_IP&gt; with the console’s local address. Wait for UMTX completion before sending another JAR.'],
        ['Send the process-jailbreak JAR', 'Run the second command after UMTX succeeds. This grants the BD-J process root privileges and escapes its /app0 filesystem jail. Check the console output before continuing.']
      ]) +
      '<div class="ps5-jb-commands"><code dir="ltr" translate="no">java -jar umtx1-1.0-SNAPSHOT.jar &lt;PS5_IP&gt;</code><code dir="ltr" translate="no">java -jar jailbreak-1.0-SNAPSHOT.jar &lt;PS5_IP&gt;</code></div>' +
      note('<p>This workflow establishes kernel read/write and a privileged BD-J process. Kernel-data writes are restricted on 6.00 and later. Check the exact ELF loader, HEN and app requirements separately before loading anything else.</p>') +
      `<div class="guide-links">${link('/console/ps5/bdj.html', 'BD-J file hashes & detailed references')}${ext(files.release, 'Official JAR Loader v4.1.1 release')}</div>`) +
    section('relapse', '5. Relapse · browser walkthrough',
      '<p>Relapse covers the exact versions below on retail consoles and testkits. Devkits use a separate upstream build. Firmware 9.05, 10.60 and 11.40 is not supported by this build.</p>' + versions(relapse) +
      `<figure class="ps5-jb-figure ps5-jb-screen"><img src="/assets/images/consoles/ps5-relapse.jpg" alt="Relapse PS5 jailbreak video thumbnail" width="1280" height="720" loading="lazy"><figcaption>Relapse viewing companion. Use the exact firmware list above for compatibility.</figcaption></figure>` +
      steps([
        ['Open the Relapse entry', 'Use your browser entry or User’s Guide redirect, open the PS5 host and select the Relapse option for your exact firmware.'],
        ['Let the run page complete', 'Leave the page open while the exploit runs. A successful run displays its payload menu in the same page. If it fails or restarts, follow the recovery guidance below before retrying.'],
        ['Use the run page’s payload menu', 'Select one payload whose release explicitly supports your firmware. The menu sends ELF files to the console’s own loader on 127.0.0.1:9021.'],
        ['Check the payload result', 'Wait for the payload’s own completion or listening message. Exploit support does not guarantee that etaHEN, an installer or every other homebrew payload supports the same firmware.']
      ]) +
      note('<p>On static hosts, use the payload menu on the run page. The separate elf.html menu expects an already jailbroken console and a network-reachable backend; it does not work by itself on GitHub Pages.</p>') +
      `<div class="guide-links">${ext('https://speedy-away.github.io/hosts/ps5/', 'Open PS5 host')}${link('/console/ps5/relapse.html', 'Relapse video & detailed references')}</div>` +
      sourceList([['https://github.com/soniciso1/relapse/blob/main/README.md', 'Relapse firmware list and payload-menu behavior']])) +
    section('after', '6. After your first successful run',
      '<p>Confirm the exploit result and the selected payload result separately. If you plan to use homebrew, first check its firmware and loader requirements. Start with one working payload before adding plugins, stores or other apps.</p>' +
      '<p>Y2JB is an optional later setup. The installer guide here starts with existing homebrew access and requires the matching YouTube app version and an autoloader. It is not a shortcut around the initial firmware checks.</p>' +
      `<div class="guide-links">${link('/console/ps5/payloads.html', 'Browse PS5 payloads')}${link('/console/ps5/apps.html', 'Browse PS5 apps')}${link('/console/ps5/y2jb.html', 'Y2JB installer setup')}${link('/console/ps5/transfer-tools.html', 'FTP & USB file transfer')}</div>`) +
    section('help', '7. Troubleshooting',
      '<dl class="ps5-jb-help"><div><dt>Unsupported firmware</dt><dd>Read the full version again and check the exact list for your chosen method. Changing DNS, changing a selector or loading a different payload does not add missing firmware support.</dd></div><div><dt>Browser error, freeze or restart</dt><dd>Do not count the attempt as successful. Let the console complete any normal recovery, then retry the matching entry instructions. Avoid interrupting a storage check or powering off while data is being written.</dd></div><div><dt>Computer cannot send a payload</dt><dd>Check the displayed console IP, the required port, the local network and the running loader. JAR Loader uses 9025; UMTX2’s ELF loader uses 9021, with 9020 for its older loader. These are different services.</dd></div><div><dt>Exploit succeeds but an app does not</dt><dd>Check that app’s release notes and firmware support. A working exploit or loader is only the first requirement. Confirm the expected HEN, plugin and package format before retrying.</dd></div></dl>') +
    section('firmware-downloads', 'PS5 firmware downloads',
      `<div class="ps5-jb-firmware-strip"><p>Update and recovery files are separate from jailbreak payloads. Keep your installed firmware while checking compatibility. Reinstallation deletes console data.</p>${ext('https://darthsternie.net/ps5-firmwares/', 'PS5 firmware archive')}</div>`) +
    section('sources', 'Sources & compatibility references', sourceList([
      ['https://github.com/idlesauce/umtx2', 'UMTX2 browser support and loader'],
      ['https://github.com/hammer-83/ps5-jar-loader/blob/v4.1.1/README.md', 'JAR Loader instructions · pinned v4.1.1'],
      ['https://github.com/hammer-83/ps5-jar-loader/blob/v4.1.1/sdk/src/main/java/org/ps5jb/sdk/core/kernel/KernelOffsets.java', 'Exact BD-J firmware offsets'],
      ['https://github.com/soniciso1/relapse', 'Relapse exact firmware list and exclusions'],
      ['https://github.com/jamesst20/ps5-y2jb-installer', 'Y2JB installer requirements'],
      ['https://www.playstation.com/en-gb/support/hardware/ps5/system-software/', 'PlayStation system software and reinstallation reference']
    ]));
  page('console/ps5/jailbreaks.html', 'PS5 jailbreak guide',
    'Check your firmware and follow the full PS5 guide on this page: UMTX2, Blu-ray / BD-J or Relapse, with illustrated steps, exact compatibility and troubleshooting.',
    '/assets/images/consoles/ps5-featured-image.avif', ps5nav, body, '#firmware', 'Start the PS5 guide');
  const target = path.join(root, 'console/ps5/jailbreaks.html');
  let html = fs.readFileSync(target, 'utf8');
  html = html.replace('</head>', '<link rel="stylesheet" href="/assets/ps5-jailbreak-guide.css?v=20261111">\n</head>')
    .replace('<body class="console-guide', '<body class="ps5-jb-guide console-guide');
  html = html.replace(/<script\b[^>]*src="\/assets\/console-setup-popups\.js[^"]*"[^>]*><\/script>/g, '');
  fs.writeFileSync(target, html);
}

function refreshExistingGuides() {
  const {section, note, sourceList, link, videoEmbed, esc} = require('./build-console-guides.cjs');
  const relapseFile = path.join(root, 'console/ps5/relapse.html');
  let relapse = fs.readFileSync(relapseFile, 'utf8');
  const description = 'Use Relapse on its listed PS5 firmware versions, with manual DNS, browser access and payload-loader instructions. Excludes 9.05, 10.60 and 11.40.';
  relapse = relapse.replace(/<h1>[\s\S]*?<\/h1>/, '<h1>PS5 Jailbreak · 7.00–13.60</h1>');
  relapse = relapse.replace(/(<h1>[\s\S]*?<\/h1>)<p>[\s\S]*?<\/p>/, '$1<p>' + description + '</p>');
  const compatibility = section('compatibility', 'Check your exact Relapse firmware',
    note('<p><strong>Listed firmware only: 7.00–13.60.</strong> This build does not list 9.05, 10.60 or 11.40. Versions below 7.00 need another entry point.</p><p>Find your version under Settings → System → System Software → Console Information. Keep it unchanged while checking compatibility. DNS changes alone do not jailbreak the console.</p>') +
    `<details class="guide-version-details"><summary>Show the supported firmware list</summary><p>${esc(relapseVersions)}</p></details>` +
    sourceList([['https://github.com/soniciso1/relapse', 'Check Relapse’s exact firmware list']]) +
    `<div class="guide-links">${link(selector, 'Choose a different firmware')}</div>`);
  relapse = relapse.replace(/<section\b(?=[^>]*id="compatibility")[^>]*>[\s\S]*?<\/section>/, compatibility);
  relapse = relapse.replace(/<a class="guide-video" href="https:\/\/www.youtube.com\/watch\?v=HqF1rmvA2iE"[\s\S]*?<\/a>/, videoEmbed('HqF1rmvA2iE', 'How to Jailbreak the PS5 with Relapse (13.60 or lower)'));
  fs.writeFileSync(relapseFile, require('./playstation-nonmod-card-images.cjs').decorate('console/ps5/relapse.html',relapse));

  const y2jbFile = path.join(root, 'console/ps5/y2jb.html');
  let y2jb = fs.readFileSync(y2jbFile, 'utf8');
  y2jb = y2jb.replace('Use the installer’s update-blocking step, then launch the prepared YouTube app. Keep its PSN and update-blocking requirements in place. Use the project instructions for errors.', 'Complete the installer’s update-blocking step and reboot when prompted. Disconnect Internet access before launching the prepared YouTube app: an online launch can replace download0.dat. Keep the local Wi-Fi or Ethernet connection active when the selected exploit needs LAN access; Internet access itself is unnecessary.');
  y2jb = y2jb.replace('<strong>Block the YouTube update and test</strong>', '<strong>Block updates, reboot and disconnect Internet</strong>');
  y2jb = y2jb.replace('Use itsPLK’s release and matching setup instructions. With no autoload.txt configuration, its payload-manager interface is the default route.', 'Use itsPLK’s release and matching setup instructions. Its YouTube versions are <code>01.000.003</code> on 4.03–12.40, <code>01.000.030</code> on 12.60–13.20, and <code>01.009.253</code> on 13.40–13.60. These differ from Maj0r’s table above. With no autoload.txt configuration, its payload-manager interface is the default route.');
  const installerScope = note('<p><strong>This is the installer route after initial jailbreak access.</strong> Choose a firmware page first if you have not yet obtained kernel access. Maj0r also documents a separate backup-restore method for an unmodified console; that method resets console data and is outside this installer walkthrough.</p>');
  if (!y2jb.includes('This is the installer route after initial jailbreak access.')) y2jb = y2jb.replace(/(<section\b(?=[^>]*id="requirements")[^>]*>[\s\S]*?<\/h2><\/div>)/, '$1' + installerScope);
  y2jb = y2jb.replace(/<a class="guide-video" href="https:\/\/www.youtube.com\/watch\?v=9ciuKNY7T7w"[\s\S]*?<\/a>/, videoEmbed('9ciuKNY7T7w', 'Fastest PS5 Jailbreak method yet with New Y2JB!'));
  fs.writeFileSync(y2jbFile, require('./playstation-nonmod-card-images.cjs').decorate('console/ps5/y2jb.html',y2jb));
}

function refreshPs5Hub() {
  const {ps5HubSections, ps5HubNav, esc} = require('./build-console-guides.cjs');
  const file = 'console/ps5/index.html', hubFile = path.join(root, file);
  let hub = fs.readFileSync(hubFile, 'utf8');
  if (!/<section\b[^>]*id="start"/.test(hub)) throw Error('PS5 hub guide section is missing.');
  hub = hub.replace(/<section\b(?=[^>]*id="console-hub-(?:setup|tools)")[^>]*>[\s\S]*?<\/section>/g, '');
  hub = hub.replace(/<section\b(?=[^>]*id="start")[^>]*>[\s\S]*?<\/section>/,
    ps5HubSections());
  const markup = '<a href="#exploit-hosts">Exploit &amp; Redirect Hosts</a>' +
    ps5HubNav.map(([url, title]) => `<a href="${url}"${url === '/console/ps5/' ? ' aria-current="page"' : ''}>${esc(title)}</a>`).join('');
  hub = hub.replace(/(<nav class="guide-nav" aria-label="Console pages">)[\s\S]*?(<\/nav>)/, (_, open, close) => open + markup + close);
  hub = require('./console-hubs.cjs').improveHub(file, hub);
  fs.writeFileSync(hubFile, require('./search-page-output.cjs').finish(file, hub));
}

function refreshPs5NavigationAndHub() {
  const {ps5nav, esc} = require('./build-console-guides.cjs');
  refreshPs5Hub();
  for (const entry of fs.readdirSync(path.join(root, 'console/ps5'))) {
    if (!entry.endsWith('.html') || ['index.html', 'whatsite-ps5.html'].includes(entry)) continue;
    const file = path.join(root, 'console/ps5', entry);
    let body = fs.readFileSync(file, 'utf8');
    const nav = ['umtx2.html', 'bdj.html', 'relapse.html'].includes(entry) ? jailbreakNav : ps5nav;
    const markup = nav.map(([url, title]) => `<a href="${url}"${url === '/console/ps5/' + entry ? ' aria-current="page"' : ''}>${esc(title)}</a>`).join('');
    body = body.replace(/(<nav class="guide-nav" aria-label="Console pages">)[\s\S]*?(<\/nav>)/, '$1' + markup + '$2');
    body = body.replace(/\/assets\/console-guides\.css\?v=\d+/g, '/assets/console-guides.css?v=9');
    body = require('./guide-popup-policy.cjs').applyGuidePopupPolicy('console/ps5/' + entry, body);
    fs.writeFileSync(file, body);
  }
}

function buildPs5Jailbreaks() {
  require('./build-ps5-legacy-guides.cjs').buildPs5LegacyGuides();
  require('./build-ps5-bdj-guide.cjs').buildPs5BdjGuide();
  buildSelector();
  refreshExistingGuides();
  refreshPs5NavigationAndHub();
}

if (require.main === module) buildPs5Jailbreaks();
module.exports = {buildPs5Jailbreaks, buildSelector, refreshExistingGuides, refreshPs5Hub, refreshPs5NavigationAndHub, jailbreakNav};
