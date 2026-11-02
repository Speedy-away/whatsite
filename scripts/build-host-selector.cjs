const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const catalogFile = path.join(root, 'docs/console-exploit-hosts.json');
const brand = "whatwhatboy's";
const image = platform => `/assets/images/host-selector/whatwhatboy-${platform}.jpg`;

function hostActions(platform) {
  const rows = [];
  const downloads = fs.existsSync(path.join(root,'docs/console-download-catalog.json')) ? JSON.parse(fs.readFileSync(path.join(root,'docs/console-download-catalog.json'),'utf8')).items : [];
  for (const name of [`host-actions-${platform}.json`, 'host-modern-plugin-actions.json', 'host-current-cheat-actions.json', 'host-game-actions.json', 'host-legacy-menu-actions.json', 'host-extra-game-actions.json', 'host-native-payload-actions.json', 'host-web-utility-actions.json', 'host-repository-menu-actions.json']) {
    const filename = path.join(root, 'docs', name);
    if (!fs.existsSync(filename)) continue;
    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    for (const action of data.actions || []) {
      if ((action.platform || data.platform) !== platform) continue;
      const normalized = {...action, platform};
      if (platform === 'ps4' && action.game === 'GTA V' && /^1\.\d+$/.test(action.gameVersion || '') && Number(action.gameVersion) < 1.56) normalized.legacy = true;
      if (!normalized.run && normalized.transport === 'goldhen-http') normalized.run = {type: 'goldhen-http'};
      if (!normalized.downloadURL && normalized.local) normalized.downloadURL = normalized.local;
      const consoleFile = downloads.find(file => file.platforms.includes(platform) && file.sha256 === action.sha256 && file.filename === path.basename(normalized.downloadURL || ''));
      if (consoleFile) normalized.consoleFileId = consoleFile.id;
      if (action.category !== 'mods' && /^(?:ELF|BIN)$/i.test(action.format || '') && normalized.downloadURL) {
        normalized.categories = [...new Set([action.category, ...(action.categories || []), 'payloads'])];
        if (!new RegExp('\\b'+platform+'\\b|^'+platform+'[A-Z0-9]','i').test(normalized.label)) normalized.label = platform.toUpperCase() + ' ' + normalized.label;
        if (consoleFile && !normalized.image) normalized.image = consoleFile.image;
      }
      if (!normalized.image && action.id === 'ps5-payload-manager') normalized.image = '/assets/images/expansion-ps4-ps5/payload-manager.png';
      if (!normalized.image && action.category === 'mods') {
        const artwork = action.game === 'GTA V' ? 'gta52.png' : /Miles Morales/.test(action.game || '') ? 'ps4-ps5/spider-man-miles-morales.jpg' : action.game === 'Sonic Frontiers' ? 'ps4-ps5/sonic-frontiers.jpg' : null;
        if (artwork) { normalized.image = '/assets/images/' + artwork; normalized.imageRole = 'Game artwork'; }
      }
      if (normalized.image && !fs.existsSync(path.join(root,normalized.image))) delete normalized.image;
      rows.push(normalized);
    }
  }
  const runtimeFile = path.join(root,'docs/host-runtime-builds.json');
  const runtimeDownloads = fs.existsSync(path.join(root,'docs/host-runtime-downloads.json')) ? JSON.parse(fs.readFileSync(path.join(root,'docs/host-runtime-downloads.json'),'utf8')).runtimes : [];
  if (fs.existsSync(runtimeFile)) for (const runtime of JSON.parse(fs.readFileSync(runtimeFile,'utf8')).runtimes || []) {
    if (runtime.console !== platform || !runtime.verified?.staticDependencies) continue;
    const correspondingSource = runtimeDownloads.find(item=>item.runtimeId===runtime.id)?.archives.find(item=>item.role==='Source Code');
    rows.unshift({id:'built-in-'+runtime.id,platform,label:runtime.title,category:'loaders',runtimeId:runtime.id,
      launchURL:runtime.entry,format:'Built-in browser loader',firmwares:runtime.firmwares,
      image:image(platform),imageRole:'Project preview',license:runtime.license,
      source:runtime.source.repository+'/tree/'+runtime.source.commit,
      instructionsURL:runtime.entry+'README.md',sourceArchiveURL:correspondingSource?.url || runtime.source.repository+'/tree/'+runtime.source.commit,
      requirements:[
        'Open on the matching console browser and choose Start on the built-in loader page. Nothing runs when viewing the dashboard.',
        'Native '+runtime.listener.format.toUpperCase()+' listener: '+runtime.listener.transport.toUpperCase()+' '+runtime.listener.port+'. Match this loader’s ABI; other payload transports are separate.',
        runtime.console === 'ps4' ? 'This PS4 bootstrap does not automatically load GoldHEN. Its raw BIN port 9020 is separate from GoldHEN HTTP port 9090 and ELF port 9021.' : 'The bundled PS5 ELF loader is limited to the listed versions below 5.00; the upstream source reports its loader broken on 5.xx.',
        'Static dependencies and file checksums verified. Console hardware execution has not been tested.'
      ]});
  }
  return [...new Map(rows.map(action => [action.id, action])).values()];
}

const {dashboard,workspaceDashboard} = require('./host-dashboard-markup.cjs');

function savePage(file, title, description, artwork, nav, content, primary, action, chooser = false) {
  const {page} = require('./build-console-guides.cjs');
  page(file, title, description, artwork, nav, content, primary, action);
  const filename = path.join(root, file);
  let html = fs.readFileSync(filename, 'utf8');
  // The shared shell's default PC active state does not apply to host routes.
  html = html.replace(/class="nav-link nav-sublink active" aria-current="page"/g, 'class="nav-link nav-sublink"');
  html = html.replace('</head>', '<link rel="stylesheet" href="/assets/host-selector.css?v=1">\n</head>');
  html = html.replace('<body class="console-guide">', '<body class="console-guide host-selector">');
  html = html.replace('<a class="btn btn-outline" href="/pc/">PC</a>', '');
  html = html.replace(/(<meta name="keywords" content=")[^"]*(")/, '$1whatwhatboy hosts, PS4 exploit hosts, PS5 exploit hosts, firmware selector, console IP, GTA V mod menus, RDR2 mods, ELF loader, BIN loader, offline trainer, file explorer, console downloads, payloads$2');
  if (chooser) {
    html = html.replace('class="container guide-hero-grid"', 'class="container guide-hero-grid guide-hero-text"');
    html = html.replace(/(<header class="guide-hero">[\s\S]*?<\/div>)<img[^>]*>/, '$1');
  }
  fs.writeFileSync(filename, require('./search-page-output.cjs').finish(file, html));
}

function buildHostSelector() {
  const {section, grid, resource, link, ext, esc} = require('./build-console-guides.cjs');
  const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
  for (const platform of ['ps4', 'ps5']) {
    const previous = catalog.platforms[platform].find(host => host.firstParty);
    const entry = {label: brand, url: '/hosts/', image: image(platform), firstParty: true,
      tags: [platform.toUpperCase(), 'Payload launcher']};
    catalog.platforms[platform] = [entry, ...catalog.platforms[platform].filter(host => host !== previous && host.url !== '/hosts/')];
    catalog.seo[platform].keywords = [...new Set([...catalog.seo[platform].keywords, brand, 'whatwhatboy hosts', 'PS4 PS5 host selector'])];
  }
  catalog.notes = catalog.notes.filter(note => !note.startsWith('The first-party whatwhatboy host directory links to platform guides'));
  catalog.notes = catalog.notes.filter(note=>!note.startsWith('The first-party whatwhatboy host pages provide firmware-filtered'));
  catalog.notes.push('The first-party whatwhatboy host pages provide pinned built-in PS4/PS5 browser runtimes, separate external hosts, curated downloads and service-dependent Load controls. Each runtime and payload retains its exact firmware and transport requirements; hardware execution remains untested.');
  fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 2) + '\n');

  const address = '<p id="host-auto-detect" class="host-note">Open this page in your console browser for automatic firmware detection.</p><a id="host-detected-link" class="host-service-link" hidden></a><p class="host-address"><span>Easy address</span><a href="/hosts/"><code translate="no" data-i18n-skip>whatwhatboy.com/hosts/</code></a></p>';
  const cards = ['ps4', 'ps5'].map(platform => {
    const name = platform.toUpperCase();
    return `<a class="guide-resource guide-firmware-card host-console-card" href="/hosts/${platform}/"><img src="${image(platform)}" width="1672" height="941" alt="${name} console and controller" loading="lazy"><h3 translate="no">${name}</h3><p>Launchers, payloads, game mods and console tools for ${name}.</p><span class="guide-firmware-open">Open ${name} <i class="fas fa-arrow-right" aria-hidden="true"></i></span></a>`;
  });
  savePage('hosts/index.html', brand,
    'Choose your console to launch payloads, mod menus and tools.', image('ps5'),
    [['/hosts/', brand], ['/hosts/ps4/', 'PS4'], ['/hosts/ps5/', 'PS5'], ['/guides/console-files/', 'Guides']],
    section('consoles', 'Choose your console', address + grid(...cards).replace('class="games-grid"', 'class="games-grid host-console-grid"')),
    '#consoles', 'Choose console', true);

  const chooserFile = path.join(root, 'hosts/index.html');
  fs.writeFileSync(chooserFile, require('./search-page-output.cjs').finish(chooserFile, fs.readFileSync(chooserFile, 'utf8').replace('</body>', '<script defer src="/assets/host-dashboard.js?v=13"></script></body>')));

  for (const platform of ['ps4', 'ps5']) {
    const name = platform.toUpperCase();
    const base = `/console/${platform}/`;
    const actions = hostActions(platform);
    if (!actions.length) throw Error('The verified action catalogue is not ready: ' + platform);
    savePage(`hosts/${platform}/index.html`, `${brand} · ${name}`,
      'Launch compatible payloads, game menus and console tools.', image(platform),
      [['/hosts/', 'Choose another console'], [`/hosts/${platform}/`, name], [base + 'downloads.html', 'Downloads'], [`/guides/console-files/${platform}.html`, 'Guides']],
      section('actions', 'Host controls', dashboard(platform, actions,{gamesLanding:true})), '#actions', 'Open host', true);
    const gamePages = [];
    for (const [scope,label] of [['gta5','GTA 5'],['rdr2','RDR2'],['other-games','Other games']]) {
      const relative = `hosts/${platform}/${scope}/index.html`;
      gamePages.push(relative);
      savePage(relative, `${label} · ${name} mods`,
        `Choose exact game updates and menu builds for ${label} on ${name}.`, image(platform),
        [[`/hosts/${platform}/`,`${name} host`],[`/hosts/${platform}/gta5/`,'GTA 5'],[`/hosts/${platform}/rdr2/`,'RDR2'],[`/hosts/${platform}/other-games/`,'Other games']],
        section('actions',`${label} mods`,dashboard(platform,actions,{gameScope:scope})), '#actions','Browse mods',true);
    }
    const managerFile = `hosts/${platform}/payload-manager/index.html`;
    savePage(managerFile, `${brand} · ${name} payload manager`,
      `Load, download and organise ${name} payloads with the matching native console tools.`, image(platform),
      [[`/hosts/${platform}/`,`${name} host`],[`/hosts/${platform}/payload-manager/`,'Payload manager'],[base+'downloads.html','Downloads'],['/docs/host-payload-management.md','Setup guide']],
      section('actions','Payload management',workspaceDashboard(platform,actions,'payloads')), '#actions','Manage payloads',true);
    const filesPage=`hosts/${platform}/files/index.html`;
    savePage(filesPage,`${name} file manager`,
      `Manage files on your ${name} through its installed native workspace.`,image(platform),
      [[`/hosts/${platform}/`,`${name} host`],[`/hosts/${platform}/files/`,'File manager'],[`/hosts/${platform}/payload-manager/`,'Payload manager'],[base+'downloads.html','Downloads']],
      section('actions','Console files',workspaceDashboard(platform,actions,'files')),'#actions','Open files',true);
    for (const relative of [`hosts/${platform}/index.html`,managerFile,filesPage,...gamePages]) {
      const hostFile = path.join(root,relative);
      let hostHtml = fs.readFileSync(hostFile, 'utf8').replace('console-guide host-selector', 'console-guide host-selector host-dashboard-page');
      hostHtml = hostHtml.replace('</head>', '<link rel="stylesheet" href="/assets/host-dashboard.css?v=12">\n</head>').replace('</body>', '<script defer src="/assets/host-console-client.js?v=12"></script><script defer src="/assets/host-dashboard.js?v=13"></script></body>');
      fs.writeFileSync(hostFile, require('./search-page-output.cjs').finish(relative, hostHtml));
    }
  }

  // Only replace the host grid section in existing hubs; preserve other chats' downloads work.
  delete require.cache[require.resolve('../docs/console-exploit-hosts.json')];
  for (const platform of ['ps4', 'ps5']) {
    const file = path.join(root, `console/${platform}/index.html`);
    const html = fs.readFileSync(file, 'utf8');
    const sectionMarkup = require('./build-console-guides.cjs').hostSection(platform);
    if (!/<section\b[^>]*id="exploit-hosts"/.test(html)) throw Error('Missing existing host section: ' + platform);
    let updated = html.replace(/<section\b(?=[^>]*id="exploit-hosts")[^>]*>[\s\S]*?<\/section>/, sectionMarkup);
    updated = updated.replace(/(<meta\b[^>]*name="keywords"[^>]*content=")([^"]*)(")/, (all, open, values, close) =>
      open + [...new Set([...values.split(',').map(value => value.trim()), brand, 'whatwhatboy hosts', 'PS4 PS5 host selector'])].join(', ') + close);
    fs.writeFileSync(file, require('./search-page-output.cjs').finish(file, updated));
  }

  const sitemapFile = path.join(root, 'sitemap.xml');
  let sitemap = fs.readFileSync(sitemapFile, 'utf8');
  for (const suffix of ['', 'ps4/', 'ps5/',...['ps4','ps5'].flatMap(platform=>['payload-manager','files','gta5','rdr2','other-games'].map(page=>platform+'/'+page+'/'))]) {
    const url = `https://whatwhatboy.com/hosts/${suffix}`;
    if (!sitemap.includes(`<loc>${url}</loc>`)) sitemap = sitemap.replace('</urlset>', `  <url><loc>${url}</loc><lastmod>2026-11-02</lastmod></url>\n</urlset>`);
  }
  fs.writeFileSync(sitemapFile, sitemap);
  console.log('Built /hosts/, /hosts/ps4/ and /hosts/ps5/; added first-party entries to both console host grids.');
}
if (require.main === module) buildHostSelector();
module.exports = {buildHostSelector,hostActions};
