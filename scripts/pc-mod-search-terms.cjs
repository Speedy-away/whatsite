'use strict';
// The PC mod page supplies the game context; card prose never assigns another
// platform, edition, loader or supported game version.
const subjects = {
  'baldurs-gate-3': ["Baldur's Gate 3", 'BG3'],
  celeste: ['Celeste'],
  'cyberpunk-2077': ['Cyberpunk 2077', 'CP2077'],
  'elden-ring': ['Elden Ring'],
  'fallout-4': ['Fallout 4', 'FO4'],
  gta4: ['Grand Theft Auto IV', 'GTA 4'],
  gta5: ['Grand Theft Auto V', 'GTA 5'],
  'hollow-knight': ['Hollow Knight'],
  minecraft: ['Minecraft Java'],
  rdr2: ['Red Dead Redemption 2', 'RDR2'],
  skyrim: ['Skyrim'],
  'stardew-valley': ['Stardew Valley'],
  terraria: ['Terraria'],
  'witcher-3': ['The Witcher 3', 'Witcher 3']
};
function termsForCard(file, title) {
  const slug = /^mods\/([^/]+)\.html$/.exec(file)?.[1];
  const names = subjects[slug];
  return names && title ? ['PC game mods', ...names.flatMap(name => [name + ' mods', name + ' modding tools', name + ' ' + title])] : [];
}
module.exports = {subjects, termsForCard};
