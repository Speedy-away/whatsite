const fs = require('node:fs');
const path = require('node:path');
const {page, section, grid, resource, note, steps, link, ext, sourceList, esc} = require('./build-console-guides.cjs');
const {sourceKey} = require('./console-archived-mirrors.cjs');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'docs/ps4-ps5-customization.json'), 'utf8'));
const {themes: ps4Themes} = require('../docs/ps4-theme-link-catalog.json');
const image = '/assets/images/ps4-ps5/customization.svg';
const release = data.themeRelease;
const repo = 'https://github.com/Blaze414/ps5-theme';
function savedDownload(filename, label) {
  const descriptor = data.resources.find(item => item.filename === filename);
  const inventory = JSON.parse(fs.readFileSync(path.join(root, 'docs/download-audit.json'), 'utf8'));
  const item = inventory.items.find(item => sourceKey(item.url) === sourceKey(descriptor.source) && item.status === 'downloaded');
  const file = item?.files?.find(file => file.name === filename || file.filename === filename) || item?.files?.[0];
  const local = file?.sitePath || file?.local;
  const href = local && fs.existsSync(path.join(root, local.replace(/^\//, ''))) ? '/' + local.replace(/^\//, '') : descriptor.source;
  return `<a class="btn btn-primary" href="${esc(href)}"${href.startsWith('/') ? ' download' : ' target="_blank" rel="noopener noreferrer"'}>${esc(label)}</a>`;
}
function metadata(file, keywords, script = '') {
  const target = path.join(root, file);
  let html = fs.readFileSync(target, 'utf8').replace(/<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="${esc(keywords.join(', '))}">`);
  if (script) html = html.replace('</body>', `<script defer src="${script}"></script></body>`);
  fs.writeFileSync(target, html);
}
function ps4ThemeLibrary() {
  const themes = ps4Themes;
  const gallery = `<div class="themes-gallery" data-theme-catalog="/docs/ps4-theme-link-catalog.json"></div>
    <template data-theme-card-template><article class="themes-card" data-theme-card data-platform="ps4">
      <a class="themes-preview" target="_blank" rel="noopener noreferrer"><img width="640" height="360" loading="lazy" decoding="async" referrerpolicy="no-referrer"></a>
      <div class="themes-card-content"><div class="themes-badges"></div><h3 translate="no"></h3><div class="themes-actions"><a class="btn btn-primary" target="_blank" rel="noopener noreferrer">Download <i class="fas fa-download" aria-hidden="true"></i></a></div></div>
    </article></template>
    <p class="themes-empty" data-theme-error role="status" hidden>Could not load the PS4 theme library. Reload the page to try again.</p>
    <noscript><p>Enable JavaScript to browse the PS4 theme library.</p></noscript>`;
  return section('theme-library', 'PS4 theme library',
    note('<p>These entries link to external RAR archives. Check each source for the archive contents, license and console requirements before downloading or installing. The Dynamic and Static filters use labels from the published titles.</p>') +
    `<form class="themes-filter" role="search" data-themes-filter hidden><label class="themes-search">Search PS4 themes<input type="search" name="q" placeholder="Title, game or style" data-theme-search autocomplete="off"></label><select name="console" data-theme-platform hidden><option value="">PS4</option></select><label>Category<select name="category" data-theme-category><option value="">All categories</option></select></label><label>Type<select name="kind" data-theme-kind><option value="">All types</option><option>Dynamic</option><option>Static</option><option>Unspecified</option></select></label><button type="reset" class="themes-reset">Clear filters</button></form><p class="themes-count" data-theme-count role="status" aria-live="polite">${themes.length} themes</p>${gallery}<p class="themes-empty" data-theme-empty hidden>No PS4 themes match these filters.</p><nav class="themes-pagination" aria-label="Theme library pages" data-theme-pagination hidden></nav>`,
    `Browse ${themes.length} PlayStation 4 theme listings by title, game or type.`);
}

function buildPs4Themes() {
  const file = 'console/ps4/themes.html';
  const packageCard = (title, url, label) => {
    const button = ext(url, label).replace('<a ', '<a class="btn btn-primary" ');
    return resource(title, '', button).replace('<p></p>', '');
  };
  page(file, 'PS4 Themes & Customization', `Search ${ps4Themes.length} PS4 theme listings, including dynamic and static themes, and learn how to set a custom USB wallpaper on PlayStation 4.`, image,
    [['/console/ps4/', 'PS4 Hub'], ['/console/ps4/downloads.html', 'PS4 Downloads'], ['/console/ps4/apps.html', 'Apps'], ['/console/ps4/themes.html', 'Themes'], ['/console/ps5/themes.html', 'PS5 Customization']],
    section('choose', 'Choose your customization route', grid(
      resource('Custom wallpaper · stock PS4', 'An image from your USB drive becomes the background through the console’s own Themes settings. PS4 system software 5.50 introduced USB image import.', link('#wallpaper', 'Set a USB wallpaper')),
      resource('PS4 theme library', 'Find dynamic, static and other PS4 theme listings by title. Check the source requirements for each archive.', link('#theme-library', 'Browse PS4 themes')))) +
    ps4ThemeLibrary() +
    section('wallpaper', 'Use your own USB wallpaper', steps([
      ['Prepare the image', 'Use a JPG or PNG. The official guide supports up to 1920 × 1080 on PS4 or 3840 × 2160 on PS4 Pro. Place it inside an <code>IMAGES</code> folder at the root of a FAT32 or exFAT USB drive.'],
      ['Open the console’s image picker', 'Insert the drive, then open <strong>Settings &gt; Themes &gt; Select Theme &gt; Custom &gt; Select Image &gt; USB Storage Device</strong>. Select and crop the picture.'],
      ['Apply the background', 'Preview the result and select Apply. The wallpaper route uses an image; a RAR archive or a theme PKG is a different file type.']
    ]) + sourceList([['https://blog.playstation.com/archive/2018/03/08/how-to-create-your-own-ps4-custom-wallpapers-via-usb-in-8-easy-steps', 'PlayStation: official USB wallpaper instructions']])) +
    section('pkg-themes', 'Supplied PS4 PKG theme sources', grid(
      packageCard('PS4 PKG Themes folder', 'https://mega.nz/folder/aUwkma5Y#__-GrZjHvMnRzqmKEZgITQ', 'Open folder'),
      packageCard('PS2 Legacy Dynamic Theme', 'https://www.mediafire.com/file/yckqpfsklap7bn1/EP9000-CUSA07875_00-PSLEGACYTHEME001.pkg/file', 'Download')) +
    note('<p>PS4 extended storage cannot store themes according to PlayStation’s storage documentation. Use an ordinary supported USB drive for importing an image or staging a package, and apply or install it through the relevant console feature.</p>')) +
    section('related', 'Files, installation and storage', `<div class="guide-links">${link('/console/ps4/downloads.html', 'Choose a download destination')}${link('/console/ps4/archive-files.html', 'Extract and install supported files')}</div>` + sourceList([['https://www.playstation.com/en-us/support/hardware/ps4-external-hdd-support/', 'PlayStation: PS4 extended-storage limitations']])), '#theme-library', 'Browse PS4 themes');
  const target = path.join(root, file);
  const html = fs.readFileSync(target, 'utf8')
    .replace('<body class="console-guide', '<body class="console-guide console-themes')
    .replace(/<img src="\/assets\/images\/ps4-ps5\/customization\.svg"[^>]*>/, '')
    .replace('<a class="btn btn-outline" href="/pc/">PC</a>', '')
    .replace('</head>', '<link rel="stylesheet" href="/assets/console-themes.css?v=3"><script defer src="/assets/console-themes.js?v=4"></script></head>');
  fs.writeFileSync(target, html);
}

function build() {
  buildPs4Themes();
  const managerForm = `<form data-theme-manager class="guide-note"><label for="theme-console-ip"><strong>PS5 local IP address</strong></label><p>Start PS5 Themes first. Use the address shown in its notification, or enter the PS5’s local IPv4 address below. On the PS5 itself, <code>127.0.0.1</code> opens its own running service.</p><div class="guide-links"><input id="theme-console-ip" name="console-ip" inputmode="decimal" autocomplete="off" placeholder="192.168.1.50" required style="min-height:44px;padding:10px 14px;background:#101713;color:#fff;border:1px solid #466356;border-radius:8px"><button type="submit" class="btn btn-primary">Open theme manager</button></div><p role="status" aria-live="polite">The documented manager runs on HTTP port 8095. Opening it does not start a payload.</p></form>`;
  page('console/ps5/themes.html', 'PS5 Themes & Customization', 'Supported system appearance options and the PS5 Themes 1.80 homebrew plugin, with explicit firmware requirements and a working manager shortcut.', image,
    [['/console/ps5/', 'PS5 Hub'], ['/console/ps5/downloads.html', 'PS5 Downloads'], ['/console/ps5/apps.html', 'Apps'], ['/console/ps5/payloads.html', 'Payloads'], ['/console/ps5/themes.html', 'Customization'], ['/console/ps4/themes.html', 'PS4 Themes']],
    section('choose', 'Choose your PS5 setup', grid(
      resource('System appearance · stock PS5', 'Use the console’s supported Appearance settings and Welcome hub background picker. Available options depend on the installed system software and region.', link('#system', 'Use system customization'), image),
      resource('PS5 Themes 1.80 · homebrew', 'Read-only theme overlays for a jailbroken PS5. The author targets firmware 13.60 and below and reports hardware testing on 13.42.', link('#homebrew', 'Check requirements & files'), image))) +
    section('system', 'Use supported system options', steps([
      ['Customize the Welcome hub', 'Open Welcome hub and select <strong>Change Background</strong>. Choose an image from From PlayStation, Games or Media Gallery.'],
      ['Choose a console-generation design', 'Where your system software provides it, open <strong>Settings &gt; System &gt; Appearance &gt; Appearance and Sound</strong> and choose a generation design.'],
      ['Keep the formats separate', 'PS4 theme PKGs and PS5 homebrew payloads use different installation systems. Select the route intended for your console and its current firmware.']
    ]) + sourceList([['https://www.playstation.com/en-us/support/account/welcome-hub/', 'PlayStation: Welcome hub backgrounds and Appearance settings']])) +
    section('homebrew', 'PS5 Themes 1.80', note('<p><strong>Requirements:</strong> a jailbroken PS5 with etaHEN or a standard PS5 ELF loader. The author targets firmware up to 13.60, with testing on 13.42 using etaHEN 2.5B unified and PS5 Payload Manager. Other targeted firmware remains untested by this site. This does not establish a jailbreak for every firmware in that range.</p>') + grid(
      resource('etaHEN plugin', 'Copy ps5-theme.plugin to /data/etaHEN/plugins/, then start it in etaHEN Toolbox. Optional auto-start uses an empty ps5-theme.plugin.auto_start file beside it.', savedDownload('ps5-theme.plugin', 'Download .plugin · 1.80')),
      resource('Standalone ELF', 'Put ps5-theme.elf in its own folder under /data/pldmgr/payloads/, import from USB, or use Payload Manager’s repository settings. Launch explicitly from a compatible loader.', savedDownload('ps5-theme.elf', 'Download .elf · 1.80') + link('/console/ps5/payload-manager.html', 'Open payload manager guide')),
      resource('Recovery stop ELF', 'The author supplies ps5-theme-stop.elf for an unreachable manager. It stops the running program and leaves the applied look; it is not the Restore stock action.', savedDownload('ps5-theme-stop.elf', 'Download stop .elf · 1.80'))
    ) + `<h3>Payload Manager repository</h3><p>In Payload Manager, open Settings &gt; Manage Sources and add:</p><pre class="guide-code"><code>https://raw.githubusercontent.com/Blaze414/ps5-theme/main/pldmgr/repository.json</code></pre>`) +
    section('manager', 'Open the running theme manager', managerForm + steps([
      ['Create a theme', 'Use the generated Themes home-screen tile or open the manager at your PS5’s address on port 8095. Select New theme and give it a name.'],
      ['Add your artwork', 'Edit the theme, enable Background, and upload your picture. Save the theme, then choose Apply to console. The manager handles theme ZIP or folder imports; these are data for the running homebrew tool.'],
      ['Return to the system look', 'Choose <strong>No theme / Restore stock</strong> in the manager before stopping the plugin, especially when changing game icons or fonts. Follow the project’s recovery instructions if the manager is unavailable.']
    ])) +
    section('sources', 'Release, requirements and recovery', sourceList([[release, 'PS5 Themes 1.80 release and publisher SHA-256 checksums'], [repo, 'Project setup, firmware limits and recovery documentation'], ['/console/ps5/transfer-tools.html', 'PS5 file-transfer tools']])), '#choose', 'Choose a route');
  require('./playstation-nonmod-card-images.cjs').repairFiles(['console/ps5/themes.html']);
  metadata('console/ps5/themes.html', ['PS5 themes', 'PS5 customization', 'PS5 Themes 1.80', 'etaHEN plugin', 'PS5 ELF', 'Payload Manager', '13.42', '13.60', 'Welcome hub', 'Appearance', '8095'], '/assets/console-theme-manager.js');
}
module.exports = {build, buildPs4Themes};
if (require.main === module) build();
