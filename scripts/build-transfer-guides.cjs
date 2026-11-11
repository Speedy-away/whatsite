// Dedicated, reproducible PS4 and PS5 guides. No downloads or console actions.
const fs = require('node:fs');
const path = require('node:path');
const {page, section, steps, note, esc} = require('./build-console-guides.cjs');
const text = require('../i18n-tools/transfer-guide-source.json');
const root = path.resolve(__dirname, '..');
const guidePath = platform => `console/${platform}/file-transfer-guide.html`;
const p = key => `<p>${esc(text[key])}</p>`;
const a = (url, key, external = false) => `<a class="btn btn-outline" href="${esc(url)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(text[key])}</a>`;
const downloads = links => `<div class="guide-links tg-downloads">${links}</div>`;
const screenshotPath = '/assets/images/transfer-guides/screenshots/';
const photos = {
  ps4Ip: ['ps4-connection-status.webp', 500, 278, 'ipAddress', 'Rachel Bauer / SetupRouter', 'https://setuprouter.com/find-ps4-ip-address/'],
  ps5Ip: ['ps5-connection-status.jpg', 1200, 675, 'ipv4Address', 'Solvetic · Español', 'https://www.solvetic.com/tutoriales/article/9370-como-poner-ip-estatica-ps5-ip-fija/'],
  goldhen: ['ps4-goldhen-settings.jpg', 2048, 1152, 'enableFtp', 'GoldHEN · yyoossk (2021)', 'https://yyoossk.blogspot.com/2021/11/ps4goldhen.html'],
  usb: ['usb-flash-drive.jpg', 1500, 1000, 'usb', 'Kaldari / Wikimedia Commons · CC0', 'https://commons.wikimedia.org/wiki/File:USB-thumb-drive-16-GB.jpg'],
  ps4Manager: ['ps4-xplorer.png', 640, 360, 'ps4ManagerTitle', 'Lapy · PS4-Xplorer 2.0 / GameBrew · CC BY-SA 4.0', 'https://www.gamebrew.org/wiki/PS4-Xplorer#Screenshots'],
  ps5Manager: ['/assets/images/expansion-ps4-ps5/ps5-ezremote.jpg', 1920, 1080, 'ps5ManagerTitle', 'cy33hc · ezRemote Client 2.18', 'https://raw.githubusercontent.com/cy33hc/ps5-ezremote-client/2.18/screenshot.jpg'],
  filezilla: ['filezilla-main.png', 937, 747, 'fz2Title', 'FileZilla Project', 'https://filezilla-project.org/screenshots.php'],
  iosConnect: ['ftpmanager-ios.webp', 1200, 800, 'fz1Title', 'FTPManager Pro · Skyjos', 'https://www.skyjos.com/en/ftpmanager/'],
  iosFind: ['ftpmanager-ios-copy.webp', 1200, 800, 'fz3Title', 'FTPManager Pro · Skyjos', 'https://www.skyjos.com/en/ftpmanager/'],
  androidConnect: ['solid-explorer-android.png', 1080, 2248, 'plainFtp', 'Solid Explorer · Koofr', 'https://koofr.eu/blog/posts/set-up-a-connection-to-koofr-in-solid-explorer-for-android-and-huawei', true]
};
function photo(key) {
  const image = photos[key];
  if (!image) return '';
  const [file, width, height, alt, credit, source, narrow] = image;
  const src = file.startsWith('/') ? file : screenshotPath + file;
  return `<figure class="tg-figure${narrow ? ' tg-figure--narrow' : ''}">
    <a href="${esc(src)}" target="_blank" rel="noopener noreferrer"><img src="${esc(src)}" alt="${esc(text[alt])}" width="${width}" height="${height}" loading="lazy" decoding="async"></a>
    <figcaption class="tg-photo-credit"><a href="${esc(source)}" target="_blank" rel="noopener noreferrer" translate="no">${esc(credit)}</a><a href="${esc(src)}" target="_blank" rel="noopener noreferrer">${esc(text.enlarge)}</a></figcaption>
  </figure>`;
}
const part = (method, id, title, content) => section(id, text[title], content).replace('<section ', `<section data-transfer-method="${method}" `);
const list = ids => steps(ids.map(id => [esc(text[id+'Title']), esc(text[id])]));
const sources = platform => [
  ['https://wiki.filezilla-project.org/Site_Manager', 'FileZilla'],
  [platform === 'ps4' ? 'https://github.com/GoldHEN/GoldHEN' : 'https://github.com/etaHEN/etaHEN', platform === 'ps4' ? 'GoldHEN' : 'etaHEN'],
  ['https://github.com/ps5-payload-dev/ftpsrv', 'ftpsrv'],
  [platform === 'ps4' ? 'https://github.com/Lapy055/PS4-Xplorer' : 'https://github.com/cy33hc/ps5-ezremote-client', platform === 'ps4' ? 'PS4-Xplorer' : 'ezRemote · PS5'],
  ['https://www.skyjos.com/en/ftpmanager/guide/ios/setup-connection/', 'FTPManager · iOS'],
  ['https://www.skyjos.com/en/ftpmanager/guide/ios/file-transfer/', 'FTPManager · Copy to'],
  ['https://neatbytes.com/solidexplorer/index.php/2015/06/23/usage-basics-for-dummies/', 'Solid Explorer · Android'],
  ['https://github.com/electerm/electerm-harmony', 'electerm · HarmonyOS'],
  [platform === 'ps4' ? 'https://manuals.playstation.net/document/en/ps4/settings/nw_status.html' : 'https://www.playstation.com/en-us/support/connectivity/internet-connect-playstation/', 'PlayStation · Network'],
  ['https://www.playstation.com/en-us/support/error-codes/ps4/ce-36485-6/', 'PlayStation · USB']
];
function decorate(file) {
  const target = path.join(root, file);
  let html = fs.readFileSync(target, 'utf8');
  html = html.replace('</head>', '<link rel="stylesheet" href="/assets/transfer-guides.css?v=20261111-photos">\n<script defer src="/assets/transfer-guides.js?v=20261111-photos"></script>\n</head>');
  html = html.replace('<body class="', '<body class="transfer-guide ');
  html = html.replace(/(<div class="container guide-hero-grid)[^"]*"/, '$1 guide-hero-text"').replace(/<img[^>]*alt="(?:PS4 file transfer guide|PS5 file transfer guide|Download Center)"[^>]*>/g, '');
  for(const key of ['ps4Summary','ps5Summary'])html=html.replace('<p>'+esc(text[key])+'</p>','<p>'+esc(text.intro)+'</p>');
  // The purpose-built source list carries review details for this guide.
  html = html.replace(/<footer class="guide-footer">[\s\S]*?<\/footer>/, `<footer class="guide-footer"><div class="container">${esc(text.reviewed)}</div></footer>`);
  const platform=/^console\/(ps[45])\/file-transfer-guide\.html$/.exec(file)?.[1];
  if(platform)html=html.replace('<a href="/console/">Console</a></div>','<a href="/console/">Console</a> / <a href="/console/'+platform+'/">'+platform.toUpperCase()+'</a></div>');
  html = require('./transfer-guide-seo.cjs').decorate(file, html);
  fs.writeFileSync(target, html);
}
function buildGuide(platform) {
  const ps4 = platform === 'ps4';
  const ownTitle = platform+'Title';
  const chooser = section('choose', text.methodQuestion, `<div class="tg-methods" aria-label="${esc(text.choose)}"><a class="tg-method" data-choose-method="ftp" href="?method=ftp#ftp"><span aria-hidden="true">↗</span><strong>${esc(text.ftpChoice)}</strong><small>${esc(text.ftpHint)}</small></a><a class="tg-method" data-choose-method="usb" href="?method=usb#usb"><span aria-hidden="true">⇅</span><strong>${esc(text.usbChoice)}</strong><small>${esc(text.usbHint)}</small></a></div>`);
  const before = section('before', text.before, note(p('prerequisite')));
  const menuPath = ['settings','network',...(!ps4?['connectionStatus']:[]),'viewConnection',ps4?'ipAddress':'ipv4Address'];
  const ip = part('ftp', 'ftp', 'findIp', p('sameNetwork') + `<ol class="tg-menu-path">${menuPath.map(key=>`<li>${esc(text[key])}</li>`).join('')}</ol>` + photo(platform+'Ip') + p('ipStep'));
  const setup = part('ftp', 'ftp-server', platform+'SetupTitle', p(platform+'Setup') + (ps4 ? photo('goldhen') : '') + `<h3>${esc(text.ftpSettings)}</h3><dl class="tg-settings"><div><dt>${esc(text.host)}</dt><dd>${esc(text.hostValue)}</dd></div><div><dt>${esc(text.protocol)}</dt><dd>${esc(text.plainFtp)}</dd></div><div><dt>${esc(text.port)}</dt><dd><bdi>${ps4 ? 'GoldHEN: 2121' : 'ftpsrv: 2121 · etaHEN: 1337'}</bdi></dd></div><div><dt>${esc(text.login)}</dt><dd>${esc(text.loginValue)}</dd></div></dl>` + note(p('localOnly')));
  const devices = part('ftp','ftp-device','deviceQuestion', '<div class="tg-choice-row" aria-label="'+esc(text.chooseDevice)+'"><a class="btn btn-outline" data-choose-device="computer" href="?method=ftp&amp;device=computer#filezilla">'+esc(text.useComputer)+'</a><a class="btn btn-outline" data-choose-device="phone" href="?method=ftp&amp;device=phone#phone">'+esc(text.usePhone)+'</a></div>');
  const computer = part('ftp','filezilla','filezillaTitle', p('clientNote') + downloads(a('https://filezilla-project.org/download.php?show_all=1','filezillaDownload',true)) + photo('filezilla') + list(['fz1','fz2','fz3','fz4'])).replace('<section ', '<section data-ftp-device="computer" ');
  const phones = ['ios','android','harmony'].map(os=>'<a class="btn btn-outline" data-choose-phone="'+os+'" href="?method=ftp&amp;device=phone&amp;phone='+os+'#'+os+'">'+esc(text[os+'Choice'])+'</a>').join('');
  const phoneApps = [
    ['ios', 'FTPManager', 'https://apps.apple.com/app/id525959186'],
    ['android', 'Solid Explorer', 'https://play.google.com/store/apps/details?id=pl.solidexplorer2'],
    ['harmony', 'electerm', 'https://appgallery.huawei.com/app/detail?id=org.electerm.electerm']
  ];
  const phoneCards = phoneApps.map(([os, name, url]) => {
    const walkthrough = steps([['fz1Title', 'Connect'], ['fz2Title', 'Find'], ['fz3Title', 'Upload']].map(([title, action]) => {
      const id = os + action;
      return [esc(text[title]), p(id) + photo(id)];
    }));
    const help = os === 'harmony'
      ? note(p('harmonyNote')) + downloads(a('https://electerm.org/blogs/bookmark-quick-connect/', 'officialDocs', true))
      : '';
    return `<article class="tg-phone" data-phone-platform="${os}" id="${os}"><h3><span translate="no">${esc(name)} · </span>${esc(text[os+'Title'])}</h3>${downloads(a(url,os+'Download',true))}${walkthrough}${help}</article>`;
  }).join('');
  const phone = part('ftp','phone','phoneTitle', p('phoneIntro') + '<h3>'+esc(text.phoneQuestion)+'</h3><div class="tg-choice-row" aria-label="'+esc(text.choosePhone)+'">'+phones+'</div>' + phoneCards + p('phoneFinish') + downloads(a('/guides/phone-downloads/','phoneSaving'))).replace('<section ', '<section data-ftp-device="phone" ');
  const usb = part('usb','usb','usbTitle', '<div class="tg-usb-prep">' + photo('usb') + list(['usb1','usb2','usb3','usb4']) + '</div>');
  const manager = part('usb','file-manager',platform+'ManagerTitle', p(platform+'ManagerIntro') + downloads(a(ps4?'/console/ps4/apps.html':'/console/ps5/transfer-tools.html',platform+'App')) + photo(platform+'Manager') + p(platform+'Controls') + p(platform+'ManagerSteps') + note(p('managerFinish')));
  const destination = section('destination',text.destinations,p('destinationNote')+p('pkgNote')).replace('<section ', '<section data-transfer-shared ');
  const help = section('help',text.helpTitle,`<details class="tg-help"><summary>${esc(text.helpTitle)}</summary>${p('helpConnect')}${p('helpLogin')}${p('helpLarge')}${p('helpFolder')}</details>`).replace('<section ', '<section data-transfer-shared ');
  const center = section('downloads',text.downloads,`<p class="tg-status">${esc(text.unfinished)}</p>${downloads(a('/console/download-center/','downloads')+a(`/console/${platform}/downloads.html`,platform+'Files'))}`);
  const refs = section('sources',text.sources,`<details class="tg-help"><summary>${esc(text.officialDocs)}</summary><ul class="guide-source-list">${sources(platform).map(([url,label])=>`<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer" translate="no">${esc(label)}</a></li>`).join('')}</ul></details>`);
  const existing=fs.readFileSync(path.join(root,'console',platform,'transfer-tools.html'),'utf8');
  const social=existing.match(/<meta property="og:image" content="https:\/\/whatwhatboy\.com([^"]+)"/)?.[1]||'/assets/images/logo.png';
  page(guidePath(platform), text[ownTitle], text[platform+'Summary'], social, [
    ['/console/'+platform+'/',text.backHub], ['#choose',text.choose], ['#filezilla',text.computer], ['#phone',text.phone], ['#usb',text.usb], ['#file-manager',text.manager], ['/console/download-center/',text.downloads]
  ], chooser+before+ip+setup+devices+computer+phone+usb+manager+destination+help+center+refs, '#choose',text.choose);
  decorate(guidePath(platform));
}
function buildCenter() {
  const body = section('downloads',text.downloads,`<p class="tg-status">${esc(text.unfinished)}</p>${p('centerIntro')}<div class="tg-center-grid">${['ps4','ps5'].map(platform=>`<article class="guide-resource"><h3 translate="no">${platform.toUpperCase()}</h3>${downloads(a(`/console/${platform}/downloads.html`,platform+'Files')+a('/'+guidePath(platform),platform+'Title'))}</article>`).join('')}</div>${downloads(a('/downloads/','allFiles'))}${p('centerNote')}`);
  const file='console/download-center/index.html';
  page(file,text.downloads,text.centerIntro,'/assets/images/logo.png', [['/console/ps4/', 'PS4'],['/console/ps5/','PS5']], body,'/downloads/',text.allFiles);
  decorate(file);
}
function build() {
  for (const platform of ['ps4','ps5']) buildGuide(platform);
  buildCenter();
  const target=path.join(root,'sitemap.xml');
  let xml=fs.readFileSync(target,'utf8');
  const urls=[guidePath('ps4'),guidePath('ps5'),'console/download-center/index.html'].map(file=>'https://whatwhatboy.com/'+file.replace(/index\.html$/,''));
  const added=urls.filter(url=>!xml.includes('<loc>'+url+'</loc>'));
  if(added.length) fs.writeFileSync(target,xml.replace('</urlset>',added.map(url=>`  <url><loc>${url}</loc><lastmod>2026-11-11</lastmod></url>`).join('\n')+'\n</urlset>'));
  console.log('Built separate PS4 / PS5 transfer guides and unfinished Download Center.');
}
if(require.main===module)build();
module.exports={build,guidePath};
