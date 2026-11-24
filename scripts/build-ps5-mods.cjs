function buildPs5Mods() {
  const {page, section, grid, resource, link, ps5ModPreview, ps5nav} = require('./build-console-guides.cjs');
  const {collect, gameCard, featuredGameSlug, otherGamesURL} = require('./build-ps5-game-cheats.cjs');
  const featured = collect().find(game => game.slug === featuredGameSlug);
  if (!featured) throw Error('Missing verified native PS5 GTA V downloads');

  page(
    'console/ps5/mods.html',
    'PS5 Mods / Mod Menus',
    'Browse native PS5 cheat downloads for GTA V and other games. Find links to PS4 mod collections and the menu directory.',
    ps5ModPreview,
    ps5nav,
    section('native-cheats', 'Available games', grid(
      gameCard(featured),
      resource('Other Games', 'Native PS5 cheat downloads by game and update.',
        link(otherGamesURL, 'Browse other games'), '/assets/images/consoles/ps5-featured-image.avif', 'PlayStation 5 console artwork')
    )) +
    section('games', 'PS4 game mod collections', `<div class="guide-links">
      ${link('/console/mods/ps4/', 'All PS4/PS5 game mods')}
      ${link('/console/mods/ps4/call-of-duty/', 'Call of Duty · PS4/PS5')}
      ${link('/console/mods/ps4/gta5/', 'GTA V · PS4')}
      ${link('/console/mods/ps4/rdr2/', 'Red Dead Redemption 2 · PS4')}
    </div>`) +
    section('menu-directory', 'Find a specific menu', `<p>Search menus, injectors, scripts and tools. Check the platform and game update on the resource’s page.</p><div class="guide-links">${link('/console/mods/ps4/menus.html', 'Search the menu directory')}</div>`) +
    section('more-mods', 'More console mods', `<div class="guide-links">${link('/console/mods/', 'Console Mods')}${link('/console/ps5/', 'Back to PS5 Hub')}</div>`),
    '#native-cheats',
    'Browse games',
    '<a class="btn btn-outline" href="#games">Browse PS4 mod collections</a>'
  );

  console.log('Built PS5 Game Mods.');
}

module.exports = {buildPs5Mods};
if (require.main === module) buildPs5Mods();
