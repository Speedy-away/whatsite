'use strict';

function buildPs5GameSaves() {
  const {page, section, grid, resource, note, steps, ext, link, esc, ps5nav, ps5SaveImage, ps5SaveImageAlt} = require('./build-console-guides.cjs');
  const garlic = require('../docs/expansion-ps4-ps5.json').platforms.ps5.apps.find(item => item.id === 'garlic');
  const apolloImage = '/assets/images/consoles/apollo-save-tool.png';
  const playstationSupport = 'https://www.playstation.com/en-gb/support/';
  const gta6Page = '/console/ps5/game-saves/gta-6/';
  const gta6Image = '/assets/images/ps5-game-saves/gta-6.avif';
  const garlicSaves = 'https://garlicsaves.com/';
  const playstationTitles = 'https://github.com/andshrew/PlayStation-Titles';
  const ps5TitleLookup = 'https://andshrew.github.io/PlayStation-Titles?platform=ps5';
  const garlicTransferVersion = '0.3.12';
  const garlicTransferRelease = `https://github.com/earthonion/GarlicTransfer/releases/tag/v${garlicTransferVersion}`;
  const garlicTransferDownload = ext(garlicTransferRelease, `Download GarlicTransfer v${garlicTransferVersion}`);
  const gta6PlatinumSave = 'https://cdn.discordapp.com/attachments/1574118029682417724/1574165882547081377/GTA6_Platinum_Save.zip?ex=6b05f938&is=6b04a7b8&hm=825b3f45bde9ab49bffa26dbae14e4e5736e0bcc3723bbd3fa4f5a8221d68696&';
  const gta6StorySave = 'https://cdn.discordapp.com/attachments/1574118029682417724/1574273523189424290/resign_23d04672.zip?ex=6b05b4b8&is=6b046338&hm=9c0a7cf9b1c72260db4a3b3dac8aa4c2f55244060df4e3f6de3462b3beb0d594&';
  const saveTags = (card, tags) => card.replace('<div class="guide-links">',
    `<ul class="guide-resource-tags" aria-label="Save tags">${tags.map(tag => `<li class="feature-tag">${esc(tag)}</li>`).join('')}</ul><div class="guide-links">`);

  page('console/ps5/save-tools.html', 'PS5 Game saves',
    'Find PS5 community save samples, back up and import saves with Garlic SaveMgr, or browse the PS4 save catalogue for PS4 games played on a PS5.',
    ps5SaveImage, ps5nav,
    section('saves', 'Browse game saves', grid(
      saveTags(resource('Grand Theft Auto VI (GTA 6)',
        'PS5 Platinum save, full story save with $99,999,999, and a GarlicTransfer upload guide for PPSA01547.',
        link(gta6Page, 'Browse GTA 6 saves'), gta6Image, 'Grand Theft Auto VI artwork'),
        ['PS5', 'PPSA01547', 'Platinum save', 'Story save']),
      resource('Native PS5 save samples',
        'Search the GarlicSaves community directory by game or PPSA title ID. Look for an entry marked PS5 with the same title ID as your game. Some entries are individual sample files rather than complete saves.',
        ext(garlicSaves + 'tools/sample-saves', 'Browse community save samples'),
        ps5SaveImage, ps5SaveImageAlt),
      resource('PS4 games played on PS5',
        'Playing the PS4 edition? Browse the PS4 catalogue by CUSA title ID for modded saves, completed saves and New Game Plus files. A native PS5 edition needs its own save or a transfer option supported by the game.',
        link('/console/ps4/save-tools.html#saves', 'Browse PS4 game saves'),
        apolloImage, 'Apollo Save Tool artwork')
    )) +
    section('tools', 'Tools', grid(
      resource('Garlic Save Manager (GarlicTransfer)',
        'Download and upload PS5 saves from a Windows PC over your local network.',
        garlicTransferDownload),
      resource('GarlicSaves',
        'Find community save samples and tools for resigning saves to your PSN account.',
        ext(garlicSaves, 'Open GarlicSaves')),
      resource('PlayStation-Titles',
        'Look up PS4 and PS5 game title IDs before choosing a compatible save.',
        ext(ps5TitleLookup, 'Browse PS5 title IDs') + ext(playstationTitles, 'View on GitHub'))
    )) +
    section('save-tools', 'Back up and import saves with Garlic SaveMgr', grid(
      resource(`Garlic SaveMgr · ${garlic.version}`,
        'Browse, export and import saves on a homebrew-enabled PS5 through a browser on your local network.',
        ext(garlic.downloads[0].url, 'Download Garlic SaveMgr ELF') +
        ext(garlic.release, 'Release notes') +
        ext(garlic.source, 'Project instructions'),
        garlic.image, 'Garlic SaveMgr project artwork')
    ) + steps([
      ['Open the save manager. ', 'Send the ELF to elfldr on your homebrew-enabled PS5. On a computer or phone on the same network, open <code>http://&lt;PS5 IP&gt;:8082</code>.'],
      ['Export your current save. ', 'Close the game, choose the correct user in Garlic SaveMgr and keep a separate backup before importing anything.'],
      ['Check the save before importing. ', 'Match the platform, title ID and save slot. Use Garlic SaveMgr’s import option for a complete save in a supported format, then launch the matching edition and confirm the expected progress.']
    ])) +
    section('official-backups', 'PlayStation backup options',
      note('<p>PlayStation Plus can sync individual saves. The built-in USB backup can include PS5 saved data as part of a console backup; restoring it erases the data currently on the console.</p>') +
      `<div class="guide-links">${ext(playstationSupport + 'subscriptions/ps5-ps-plus-cloud-storage/', 'PlayStation Plus cloud saves')}${ext(playstationSupport + 'hardware/back-up-ps5-data-USB/', 'USB console backup guide')}</div>`),
    '#saves', 'Browse game saves');

  page('console/ps5/game-saves/gta-6/index.html', 'Grand Theft Auto VI (GTA 6) PS5 Game Saves',
    'Download the Platinum save or full story save for PS5 title ID PPSA01547 and upload it with GarlicTransfer.',
    gta6Image, ps5nav,
    section('downloads', 'Downloads',
      note('<p><strong>Resign the save to your own PSN account before uploading.</strong> Use that same account on your PS5 and check that your game’s title ID is <code>PPSA01547</code>. Back up your existing GTA 6 saves before importing a community save.</p>' +
        `<div class="guide-links">${ext(garlicSaves, 'Open GarlicSaves')}</div>`) +
      grid(
        resource(`GarlicTransfer v${garlicTransferVersion}`, 'Open the release and choose the Windows installer under Assets.',
          garlicTransferDownload),
        saveTags(resource('GTA 6 Platinum Save', 'Community Platinum save for PS5. The Discord link expires on 24 November 2026.',
          ext(gta6PlatinumSave, 'Download GTA6_Platinum_Save.zip')), ['PS5', 'PPSA01547', 'Platinum trophy']),
        saveTags(resource('Full story save with $99,999,999', 'Community save with the story completed. The Discord link expires on 24 November 2026.',
          ext(gta6StorySave, 'Download resign_23d04672.zip')), ['PS5', 'PPSA01547', 'Story completed', '$99,999,999'])
      )) +
    section('pair-ps5', 'Pair your PS5', steps([
      ['Install GarlicTransfer. ', `Download version ${garlicTransferVersion} above and install it on your Windows PC. Connect your PC and PS5 to the same local network.`],
      ['Discover your console. ', 'In GarlicTransfer, click <strong>Discover</strong>, select your PS5 from the list, then click <strong>Pair this PS5</strong>.'],
      ['Select the pairing entry on your PS5. ', 'Go to <strong>Settings → System → System Software → Data Transfer</strong> and select <strong>GarlicTransfer Pairing</strong> when it appears.'],
      ['Wait for pairing to finish. ', 'During pairing, your PS5 may show “Can’t transfer data.” Leave that screen open and wait for GarlicTransfer to confirm pairing. Its pairing window closes automatically when pairing succeeds.']
    ])) +
    section('prepare-upload', 'Prepare your save upload', steps([
      ['Prepare the upload. ', 'In GarlicTransfer, go to <strong>Upload</strong> and click <strong>Prepare Upload</strong>. Select the PS5 user whose PSN account you resigned the save to.'],
      ['Add the save folder. ', 'Extract the ZIP, then click <strong>Add Save Folder</strong> and select the folder containing your resigned save.'],
      ['Enter the title ID. ', `Under <strong>Game Title ID for External Saves</strong>, enter <code>PPSA01547</code>. You can browse PS5 title IDs in ${ext(playstationTitles, 'PlayStation-Titles')}.`]
    ])) +
    section('upload-save', 'Upload your save', steps([
      ['Start the upload. ', 'Click <strong>Upload Saves</strong> and follow the on-screen instructions. Choose <strong>User Data</strong> when asked which data type to transfer.'],
      ['Wait for the upload to finish. ', 'Once the transfer completes, open GTA 6 on the PS5 account you selected and check that the save loads.']
    ]) + note('<p><strong>Account reminder.</strong> The save must be resigned to your own PSN account before it will work with your user profile.</p>')),
    '#downloads', 'View downloads', '<a class="btn btn-outline" href="/console/ps5/save-tools.html#saves">All PS5 game saves</a>');
}

if (require.main === module) buildPs5GameSaves();
module.exports = {buildPs5GameSaves};
