'use strict';

function card() {
  const {resource, ext} = require('./build-console-guides.cjs');
  const release = 'https://github.com/NotHGM/save-garage/releases/tag/v1.32.0';
  return resource('(GTA6) Save Garage Tool · v1.32.0',
    'Edit GTA VI story saves on PS5: money, ammo, stats and completion. This desktop tool uses PS5 Data Transfer over your local network and requires GarlicSaves sign-in. No jailbreak required. Windows 10/11: extract the ZIP and open Start Save Garage.bat. Back up your save first; character levels and some advanced edits are experimental.',
    ext('https://github.com/NotHGM/save-garage/releases/download/v1.32.0/SaveGarage-1.32.0-windows-x64.zip', 'Download v1.32.0 · Windows x64') +
    ext(release, 'Release notes · macOS / Linux') +
    ext('https://github.com/NotHGM/save-garage/blob/be272cbf4d99fd399bd4a9342287bd05514ff5a5/README.md', 'Setup guide'),
    '/assets/images/ps5-game-saves/save-garage-v1.32.0-banner.png', 'Save Garage GTA VI save editor artwork')
    .replace('<article class="guide-resource"', '<article id="save-garage" class="guide-resource"')
    .replace('<div class="guide-links">', '<ul class="guide-resource-tags" aria-label="Tool tags"><li class="feature-tag">PS5</li><li class="feature-tag">GTA VI / GTA6</li><li class="feature-tag">Save editor</li><li class="feature-tag">Windows</li><li class="feature-tag">v1.32.0</li></ul><div class="guide-links">');
}

module.exports = {card};
