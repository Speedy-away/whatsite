const fs = require('node:fs');
const path = require('node:path');

function buildPs4Software() {
  const {intro} = require('./build-console-downloads.cjs');
  const {page, section, grid, resource, note, steps, sourceList, ext, link, esc, ps4nav: nav} = require('./build-console-guides.cjs');
  const expansion = require('../docs/expansion-ps4-ps5.json').platforms.ps4;
  const extraCards = cards => cards.map(item => resource(
    esc(item.title), item.description,
    item.downloads.map(download => ext(download.url, esc(download.label))).join('') + ext(item.source, 'Setup & requirements'),
    item.image
  ));
  const imageFile = path.join(__dirname, '..', 'docs', 'console-software-images.json');
  const images = fs.existsSync(imageFile) ? JSON.parse(fs.readFileSync(imageFile, 'utf8')) : {};
  const image = (id, fallback) => images[id]?.image || fallback;
  const ps4Image = '/assets/images/consoles/playstation.jpg';
  const goldhenImage = image('goldhen', ps4Image);
  const apolloImage = '/assets/images/consoles/apollo-save-tool.png';

  page(
    'console/ps4/payloads.html',
    'PS4 Payloads & HEN Resources',
    'PS4 GoldHEN and HEN resources, FTP servers, debugging payloads and kernel-log tools with release-specific setup information.',
    '/assets/images/expansion-ps4-ps5/payload-guest.png',
    nav,
    intro('ps4') + section('payloads', 'PS4 payloads & homebrew enablers', grid(
      resource(
        'GoldHEN',
        'The dedicated GoldHEN page contains official release resources and the separately supplied 14.00 HEN ISO.',
        link('/console/ps4/goldhen.html', 'Open GoldHEN page'),
        goldhenImage
      ),
      resource(
        'Jailbreak by firmware',
        'Choose the 14.00 guide or the 13.52-or-lower browser tutorial before selecting a payload.',
        link('/console/ps4/jailbreaks.html', 'Choose firmware'),
        '/assets/images/consoles/playstation.jpg'
      ),
      ...extraCards(expansion.payloads)
    )) +
    section('compatibility', 'Match your payload and firmware', note('<p>The supplied PS4 14.00 route is experimental. GoldHEN is a separate project; its inclusion here does not establish support for 14.00. Read the exact build’s release notes and the firmware guide before choosing a payload.</p>') + `<div class="guide-links">${link('/console/ps4/#exploit-hosts', 'Browse PS4 exploit hosts')}${link('/console/ps4/apps.html', 'Browse PS4 apps')}</div>`) +
    section('load-saved-payloads', 'Load a saved BIN with Payload Guest', steps([
      ['Start your supported homebrew environment','Payload Guest requires an already working compatible PS4 HEN or GoldHEN environment. It does not supply the initial exploit or establish support for every firmware.'],
      ['Install the existing Payload Guest package','Use the pinned v0.98 package on the Apps page with your compatible console package installer. Downloading its PKG does not install it.'],
      ['Place the compatible BIN file','Transfer your payload to <code>/data/payloads/</code>, or put it in the <code>payloads</code> folder on an actually mounted USB filesystem. Downloading a ZIP/RAR does not extract its BIN.'],
      ['Open Payload Guest and choose the payload','Launch Payload Guest on the PS4 and explicitly select the compatible BIN. Square refreshes the list after USB insertion or removal. A <code>meta.json</code> catalogue in a folder overrides that folder’s automatic BIN scan.']
    ]) + `<div class="guide-links">${link('/console/ps4/apps.html', 'Get Payload Guest')}${link('/console/ps4/downloads.html', 'Save PS4 payload files')}</div>` + sourceList([['https://github.com/Al-Azif/ps4-payload-guest', 'Payload Guest scan paths and on-console controls']])),
    '#payloads',
    'Browse payloads'
  );

  page(
    'console/ps4/apps.html',
    'PS4 Apps & Homebrew Tools',
    'Browse PS4 save tools, file managers, Homebrew Store, package installers, Payload Guest and emulator resources with downloads and setup links.',
    apolloImage,
    nav,
    require('./console-store-cards.cjs').storeIntro('ps4') + intro('ps4') + section('apps', 'PS4 apps & homebrew tools', grid(
      resource(
        'trophy_unlockers',
        'PS4 trophy unlocker collection with game-specific PKG files, a guide, TrophyUnlocker for Windows and PS4PKGViewer. Match each package to its game title ID and region.',
        ext('https://www.mediafire.com/folder/5m9vrii984nbi/trophy_unlockers', 'Download trophy_unlockers'),
        ps4Image
      ).replace('<article ', '<article id="trophy-unlockers" ').replace('<div class="guide-links">', '<ul class="guide-resource-tags" aria-label="Tags"><li class="feature-tag">PS4</li><li class="feature-tag">Trophy unlocker</li><li class="feature-tag">PKG</li><li class="feature-tag">Windows tools</li></ul><div class="guide-links">'),
      resource(
        'Apollo Save Tool · PS4',
        'Manage, export, import, patch and resign PS4 saves directly on your homebrew-enabled console.',
        '<a href="/downloads/archive/86923843b6f3/IV0000-APOL00004_00-APOLLO0000000PS4.pkg" data-original-href="https://github.com/bucanero/apollo-ps4/releases" download>Download for PS4 <i class="fas fa-download" aria-hidden="true"></i></a>' + ext('https://github.com/bucanero/apollo-ps4', 'Project & setup'),
        apolloImage
      ),
      resource(
        'PS4-Xplorer',
        'PS4 file-manager project with documentation and setup information.',
        '<a class="btn btn-primary" href="https://pkg-zone.com/download/ps4/LAPY20009/2.07" download="PS4-Xplorer-2.07.pkg">Download PKG <i class="fas fa-download" aria-hidden="true"></i></a>' + ext('https://github.com/Lapy055/PS4-Xplorer', 'Project & setup'),
        image('ps4xplorer', ps4Image)
      ),
      resource(
        'Emulator apps on PS4',
        'Browse the existing PS2, PS3, GameCube, Wii, Wii U and Dreamcast console-port collection with project-specific installation requirements.',
        link('/console/ps4/emulators.html', 'Browse PS4 emulators'),
        '/assets/images/emulators/retroarch.png'
      ),
      ...extraCards(expansion.apps)
    )) + require('./console-store-cards.cjs').storeCards('ps4') +
    section('more-tools', 'More PS4 resources', `<div class="guide-links">${link('/console/ps4/payloads.html', 'PS4 payloads')}${link('/console/ps4/site-launcher.html', 'Open site from PS4 Home')}${link('/console/mods/ps4/', 'Browse game mods')}${link('/console/ps4/', 'Back to PS4 Hub')}</div>`),
    '#selected-apps',
    'Browse apps'
  );

  page('console/ps4/avatars.html','PS4 Avatars','PS4 avatar tools and a pack of more than 500 avatar images.','/assets/images/console-software/ps4-avatars.png',nav,
    section('downloads','PS4 avatars',grid(
      resource('Avatar Changer','Install the PS4 Avatar Changer package, then follow its on-console instructions and firmware requirements.',ext('https://pkg-zone.com/download/ps4/LAPY20015/latest','Download Avatar Changer')),
      resource('Avatars pack 500+','A collection of more than 500 avatar images. Download the pack and review its included instructions before transferring files to your console.',ext('https://mega.nz/file/vYUizRzb#DwjEMLJIjuWGSGb2UVcn_Wa6kNcOxROK9oCxfE_ciaQ','Download avatars pack 500+')),
      resource('Extra Avatars - Anime','Additional anime-themed PS4 avatar package.',ext('https://dn721301.ca.archive.org/0/items/ps4-jb-avatars/Extra%20Avatars%20-%20Anime.pkg','Download Anime avatars')),
      resource('Extra Avatars - PSN','Additional PSN avatar package for PS4.',ext('https://ia800402.us.archive.org/2/items/ps4-jb-avatars/Extra%20Avatars%20-%20PSN.pkg','Download PSN avatars'))
    )+note('<p>These links are publisher or user-supplied downloads. Match the package and installation method to your existing PS4 homebrew environment. The avatar pack is separate from the Avatar Changer application.</p>')),'#downloads','Download avatars');

  require('./playstation-nonmod-card-images.cjs').repairFiles(['console/ps4/emulators.html']);
  console.log('Built separate PS4 Payloads and Apps pages.');
}

if (require.main === module) buildPs4Software();
module.exports = {buildPs4Software};
