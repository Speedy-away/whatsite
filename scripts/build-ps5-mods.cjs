function buildPs5Mods() {
const {page, section, grid, resource, link, ps5ModPreview, ps5nav: nav} = require('./build-console-guides.cjs');

page(
  'console/ps5/mods.html',
  'PS5 Mods / Mod Menus',
  'Native PS5 cheat downloads and separately labelled PS4 mod collections.',
  ps5ModPreview,
  nav,
  section('native-cheats','Native PS5 cheats',require('./build-ps5-game-cheats.cjs').cards()) + section('games', 'PS4 game mod collections', grid(
    resource(
      'Call of Duty · PS4/PS5',
      'Call of Duty game collections with mod menus, tools, previews, supplied guides and DLC title-ID references.',
      link('/console/mods/ps4/call-of-duty/', 'Browse Call of Duty'),
      '/assets/images/ps4-bo3/encore-zombies.png',
      'Encore Zombies menu in Call of Duty: Black Ops III on PS4'
    ),
    resource(
      'GTA V · PS4',
      'PS4 menus for current and older GTA V game updates, plus scripts and installation guides.',
      link('/console/mods/ps4/gta5/', 'Browse GTA V mods'),
      ps5ModPreview,
      'Oxagon mod menu open in the PS4 version of GTA V'
    ),
    resource(
      'Red Dead Redemption 2 · PS4',
      'North, Sheriff 1.32, Havana and Oyster Free resources with previews and supplied setup details.',
      link('/console/mods/ps4/rdr2/', 'Browse RDR2 mods'),
      '/assets/images/ps4-rdr2/sheriff.png',
      'Sheriff mod menu open in the PS4 version of Red Dead Redemption 2'
    )
  )) +
  section('menu-directory', 'Find a specific menu', `<p>Search menus, injectors, scripts and tools across the imported games. Check the platform and game update on the resource’s own page.</p><div class="guide-links">${link('/console/mods/ps4/menus.html', 'Search the menu directory')}</div>`)+
  section('more-mods', 'More console mods', `<div class="guide-links">${link('/console/mods/ps4/', 'All PS4/PS5 game mods')}${link('/console/mods/', 'Console Mods')}${link('/console/ps5/', 'Back to PS5 Hub')}</div>`),
  '#native-cheats',
  'Browse native PS5 cheats',
  '<a class="btn btn-outline" href="#games">Browse PS4 mod collections</a>'
);

console.log('Built PS5 Game Mods.');
}

module.exports = {buildPs5Mods};
if (require.main === module) buildPs5Mods();
