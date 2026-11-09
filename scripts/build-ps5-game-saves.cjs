'use strict';

function buildPs5GameSaves() {
  const {page, section, grid, resource, note, steps, ext, link, ps5nav, ps5SaveImage, ps5SaveImageAlt} = require('./build-console-guides.cjs');
  const garlic = require('../docs/expansion-ps4-ps5.json').platforms.ps5.apps.find(item => item.id === 'garlic');
  const apolloImage = '/assets/images/consoles/apollo-save-tool.png';
  const playstationSupport = 'https://www.playstation.com/en-gb/support/';

  page('console/ps5/save-tools.html', 'PS5 Game saves',
    'Find PS5 community save samples, back up and import saves with Garlic SaveMgr, or browse the PS4 save catalogue for PS4 games played on a PS5.',
    ps5SaveImage, ps5nav,
    section('saves', 'Browse game saves', grid(
      resource('Native PS5 save samples',
        'Search the GarlicSaves community directory by game or PPSA title ID. Look for an entry marked PS5 with the same title ID as your game. Some entries are individual sample files rather than complete saves.',
        ext('https://garlicsaves.com/tools/sample-saves', 'Browse community save samples'),
        ps5SaveImage, ps5SaveImageAlt),
      resource('PS4 games played on PS5',
        'Playing the PS4 edition? Browse the PS4 catalogue by CUSA title ID for modded saves, completed saves and New Game Plus files. A native PS5 edition needs its own save or a transfer option supported by the game.',
        link('/console/ps4/save-tools.html#saves', 'Browse PS4 game saves'),
        apolloImage, 'Apollo Save Tool artwork')
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
}

if (require.main === module) buildPs5GameSaves();
module.exports = {buildPs5GameSaves};
