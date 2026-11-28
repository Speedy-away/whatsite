const {catalog} = require('./console-mod-catalog.cjs');
const {gameAliases, unique} = require('./console-resource-tags.cjs');
const gameCopy = {
  'rainbow-six-siege': ['Rainbow Six Siege PS4 Mods & Mod Menus', 'Find LazyUI and Nware downloads and the upcoming Scooby R6 mod menu for Rainbow Six Siege PS4. LazyUI targets CUSA01800 game version 03.71.', ['LazyUI PS4', 'R6 LazyUI', 'LazyUI PS4 download', 'LazyUI CUSA01800', 'Rainbow Six Siege PS4 aimbot', 'Rainbow Six Siege PS4 ESP', 'Scooby R6', 'Scooby Rainbow Six Siege', 'Scooby R6 PS4', 'Nware R6 PS4', 'Nware Rainbow Six Siege', 'Nware R6 SPRX', 'CUSA01788', 'CUSA-01800', 'Rainbow Six Siege PS4', 'R6 PS4', 'R6S PS4', 'R6 Siege PS4', 'Rainbow 6 Siege PS4', 'Rainbow Six Siege PlayStation 4', 'Rainbow Six Siege PS4 mods', 'Rainbow Six Siege PS4 game mods', 'Rainbow Six Siege PS4 mod menu', 'Rainbow Six Siege PS4 mod menus', 'R6 PS4 mod menu', 'R6 Siege PS4 mods', 'R6 Siege PS4 mod menus', 'Tom Clancy Rainbow Six Siege PS4']],
  'modern-warfare-2019': ['MW 2019 PS4 MAG Host Menu & GSC Injector', 'Download the MAG host menu and GSC injector for Modern Warfare 2019 on PS4 update 1.67, CUSA08829 USA. Includes setup and compatibility notes.'],
  'modern-warfare-ii-2022': ['MWII 2022 PS4 MAG Host Menu & GSC Injector', 'Find the MAG host menu and GSC injector for Modern Warfare II (2022) on PS4 update 1.08, CUSA34029, with game-specific setup and compatibility notes.'],
  'vanguard': ['Vanguard PS4 MAG Menus & GSC Injector', 'Browse MAG host menus and GSC injection for Vanguard Multiplayer and Zombies on PS4 update 1.26, CUSA24041 USA, with setup and compatibility notes.'],
  'apex-legends': ['Apex Legends PS4 v3.25: Spectrum_Apex & Nware', 'Download both Spectrum_Apex_ImGui.sprx and Spectrum_Apex.sprx for Apex Legends PS4 v3.25 and load both files. Browse Nware, Mags Apex and older menus.',
    ['Spectrum Apex v3.25 download', 'Spectrum Apex two required files', 'Spectrum Apex ImGui download', 'Spectrum Apex main SPRX download', 'Spectrum Apex PlayStation 4', 'Spectrum Apex PS4 setup', 'Spectrum_Apex', 'Spectrum Apex PS4 v3.25', 'Spectrum_Apex_ImGui.sprx', 'Spectrum_Apex.sprx', 'Spectrum Apex load both files', 'Spectrum Apex', 'Spectrum Apex download', 'Spectrum Apex SPRX', 'apex.sprx',
      'Mags Apex PS4', 'MAG Menu Apex', 'Mags Apex v1.0.1', 'Mags Apex PS4 download', 'Apex Legends PS4 triggerbot', 'Apex Legends PS4 aimbot', 'Apex Legends PS4 ESP', 'Apex Legends PS4 mods', 'Apex Legends PS4 mod menu', 'Apex Legends PS4 mod menus', 'Apex Legends PS4 mod menu download',
      'Apex PS4 mod menu', 'Apex Legends PlayStation 4 mods', 'PlayStation 4 Apex Legends mod menu', 'Apex Legends SPRX',
      'Apex Legends PS4 SPRX', 'Apex Legends SPRX download', 'Apex Legends nware', 'Apex Legends nware download',
      'nware PS4', 'nware Apex Legends', 'Nware Apex Legends v3.25', 'nware mod menu', 'nware PS4 mod menu', 'nware download', 'nware SPRX', 'Nware Apex PS4 download', 'Nware_Apex.sprx', 'nware screenshot']],
  'fortnite': ['Fortnite PS4 Cheats & Mod Menus', 'Browse Fortnite PS4 mod menus for 5.28 and 5.27, including Spectrum FN 43.10 ImGui Only, Spectrum FN Beta and Infinity FN, with GoldHEN setup.',
    ['OLE8 FN PS4 download', 'O1E8 FN PRX', 'crack_o1e8_v120.prx', 'Infinity Mod Menu PS4 download', 'Fortnite PS4 PRX download', 'Fortnite Pirate Token', 'Pirate Token hack', 'auto farmer Pirate Token', 'Pirate Token auto farmer',
      'Fortnite Pirate Token farm', 'Fortnite PS4 Pirate Token', 'Fortnite Pirate Tokens', 'Fortnite chest auto farmer',
      'Fortnite PS4 cheat', 'Fortnite PS4 hacks', 'Fortnite PS4 cheat menu', 'Fortnite cheats PS4', 'Fortnite hacks PS4', 'PlayStation 4 Fortnite cheats',
      'Fortnite PS4 mods', 'Fortnite PS4 mod menus', 'Fortnite PS4 mod menu download', 'Fortnite PS4 SPRX download', 'Fortnite PS4 GoldHEN plugin',
      'Fortnite PS4 aimbot', 'Fortnite PS4 silent aim', 'Fortnite PS4 ESP', 'Fortnite PS4 player ESP', 'Fortnite PS4 loot ESP', 'Fortnite PS4 container ESP',
      'Fortnite PS4 skin changer', 'Fortnite PS4 no recoil', 'Fortnite PS4 vehicle flying', 'Fortnite skins database', 'Fortnite outfit catalogue',
      'Fortnite PS4 5.28 mod menus', 'Fortnite PS4 5.27 mod menus', 'Spectrum FN 43.10 ImGui Only', 'Spectrum FN Beta download', 'Infinity FN 5.28 download',
      'Spectrum FN v43.10', 'Spectrum FN PS4', 'Spectrum FN download', 'Spectrum FN mod menu', 'Spectrum_FN.sprx', 'Dev-Phobia Spectrum FN',
      'Fortnite PS4 SPRX', 'Fortnite PS4 cheats', 'Fortnite silent aim', 'Fortnite player ESP', 'Fortnite loot ESP', 'Fortnite client-side skin changer',
      'Fortnite PS4 mod menu', 'Fortnite aimbot', 'Fortnite ESP', 'Fortnite skin changer', 'Unlock all skins', 'Free skins', 'Fortnite PS4 hack',
      'fn.sprx', 'GoldHEN plugin setup', 'plugins.ini', 'CUSA07669', 'CUSA07022 title ID reference',
      'Fortnite PS4 HWID unban', 'PS4 Fortnite ban file cleanup', '/user/download/CUSAxxxxx/', 'download0.dat', 'download0_infomation.dat']],
  'overwatch': ['Overwatch PS4 Mod Menu · Scooby', 'Browse Scooby for Overwatch PS4: aimbot, triggerbot and ESP, with a supplied menu screenshot and the official download page.',
    ['Scooby Overwatch PS4', 'Scooby Overwatch', 'Overwatch PlayStation 4', 'Overwatch PS4 mod menu', 'Overwatch PS4 aimbot', 'Overwatch PS4 triggerbot', 'Overwatch PS4 ESP', 'Scooby Console Overwatch', 'Scooby Overwatch download']],
  'dayz': ['DayZ Mod Menu Download · Spectrum DayZ v2', 'Download the Spectrum DayZ v2 SPRX mod menu.',
    ['Spectrum DayZ v2', 'DayZ SPRX download', 'Spectrum_DayZ_v2_all_features.sprx']],
  'black-ops-1': ['Black Ops 1 Console Menus, CFG & RTM Tools', 'Browse EnCoReV8, Discarded, Purple Kush, the BO1/BO2 GSC injector, CFG resources and RTM tools, with supplied previews and guide popups.'],
  'black-ops-2': ['Black Ops 2 PS4 Menus: Exliation, Baguette & FPKG Fix', 'Download Exliation offhost - C and Baguette for Black Ops 2 PS4. Browse SPRX menus, GSC injectors, RTM tools and the separate FPKG 1.11 crash fix.',
    ['Exliation PS4', 'Exliation BO2', 'Exliation offhost - C', 'Exliation off-host SPRX download', 'Exliation Black Ops II', 'bo2_visuals.sprx', 'PS4 FPKG fixes', 'BO2 1.11 crash fix', 'BO2 01.11 PKG', 'CUSA57548', 'Black Ops 2 Multiplayer crash fix', 'Black Ops 2 Zombies crash fix', 'BO2_ZMMP_CrashFix.pkg']],
  'black-ops-3': ['BO3 PS4 Mod Menus: DayBreak Engine & MatrixMods', 'Download DayBreak Engine Off-Host for BO3 PS4 1.33 Multiplayer, CUSA02290. Browse MatrixMods, Zombies menus and GSC injectors with screenshots and setup guides.', ['DayBreak Engine Off-Host', 'DayBreak Engine BO3 PS4', 'DayBreak Engine Beta 0.9', 'BO3 1.33 off-host menu', 'Black Ops 3 PS4 off-host mod menu', 'DayBreak.sprx', 'BO3PS4_1.33_DayBreakEngine_MP.rar', 'DayBreak Engine Off Host', 'DayBreak Engine Offhost', 'DayBreak Black Ops III PS4', 'DayBreak Engine CUSA02290', 'DayBreak Engine GoldHEN plugin', 'DayBreak Engine SPRX download', 'DayBreak Engine BO3 1.33 download', 'DayBreak Engine aimbot', 'DayBreak Engine triggerbot', 'DayBreak Engine anti-aim', 'XeXPoiiison DayBreak Engine', 'How to open DayBreak Engine BO3', 'How to install DayBreak.sprx']],
  'black-ops-4': ['Black Ops 4 PS4 Menus: B33, Atian & Lucy', 'Browse Mags, B33, Atian and Lucy menus for Black Ops 4 on PS4, with screenshots and downloads.'],
  'ghosts': ['Ghosts PS4 Menus: MatrixMods, SilentShadow & HYDRA', 'Find Ghosts MatrixMods, SilentShadow v2/v3 and the separate HYDRA 2.2.0 resource, with previews, release details and DLC title-ID references.'],
  'advanced-warfare': ['Advanced Warfare PS4 Menus: MatrixMods & Appendum', 'Browse Advanced Warfare MatrixMods and Appendum PS4 resources, supplied previews, downloads and the captured CUSA00851 DLC reference.'],
  'modern-warfare-remastered': ['MWR PS4 Menus: MatrixMods & MAG Injector', 'Browse Modern Warfare Remastered PS4 MatrixMods and MAG Menu resources, injector details, previews and the CUSA05379 v1.15 DLC reference.'],
  'modern-warfare-2-remastered': ['MW2 Campaign Remastered PS4: TER152 Menu', 'Find the TER152 resource for Modern Warfare 2 Campaign Remastered on PS4, with its supplied download and preview. Check the resource details.'],
  'cold-war': ['Cold War Console Resources & DLC References', 'View the supplied Black Ops Cold War menu demonstration and the captured CUSA15010 v1.41 DLC reference, with media and compatibility details.'],
  'infinite-warfare': ['Infinite Warfare PS4 MAG Menu + GSC Injector', 'Download MAG Menu + GSC Injector for Infinite Warfare Multiplayer and Zombies in Spaceland on PS4 CUSA04762 v1.25. Browse screenshots and DLC references.'],
  'wwii': ['WWII PS4 Menus: HYDRA & DLC References', 'Find HYDRA 2.2.0 PS4 WWII Multiplayer and Zombies menu notes, Windows portable download, opening controls and captured DLC title-ID references.'],
  'gta5': ['GTA 5 PS4 Mod Menus by Game Update', 'Download Orbital, Lester SPRX V2, Synapse and Cyprus for GTA V on PS4. Match 1.57, 1.56 or older game builds, title IDs and plugin setup requirements.', ['No PS Plus GTA V Online', 'No PS Plus PS4 PRX download', 'no-ps-plus.prx', 'GTA V Online plugins PS4', 'Orbital PS4', 'Orbitale PS4', 'Orbital GTA V 1.57', 'Orbitale v1.3.0 package', 'orbitale.prx', 'orbitale-coop.prx', 'Orbital CUSA00411', 'Lester SPRX', 'LesterSPRX', 'XlesterX', 'Synapse PS4', 'Cyprus PS4', 'Cyprus Lite', 'GTA V 1.57 PS4 mod menus', 'GTA V 1.56 PS4 mod menus', 'Cyprus GTA V 1.57', 'Cyprus GTA V 1.56', 'CUSA00411', 'CUSA00419', 'GTA V CSC menus', 'CSC script packs', 'RK MODZ', 'RKMODZ manager']],
  'rdr2': ['Best RDR2 Online PS4 Mod Menu: Scooby & More', 'Scooby: Best RDR2 Online PS4 mod menu for RDR2 Online 1.32 with Gold, Money, XP and more. Browse ACE-HIGH, North, Sheriff, Havana and Oyster too.']
};
function metadataByPage() {
  const {games, entries} = catalog();
  const {load, gameUrl} = require('./console-multicod.cjs');
  const multi = load();
  const familyKeywords = family => [family.title, ...(family.tags || []), ...(family.keywords || [])];
  const result = new Map();
  for (const game of games) {
    const matching = entries.filter(entry => entry.gameId === game.id);
    const goldHenBuild = /^GoldHEN JSON cheats · (CUSA\d{5}) · game (\d+\.\d+)\.$/.exec(game.summary || '');
    const defaultCopy = [game.title + ' Resources', game.description || game.summary || 'Browse game-specific menus, tools and supplied guides.'];
    if (goldHenBuild) {
      const [, titleId, update] = goldHenBuild;
      defaultCopy[0] = game.title + ' PS4 GoldHEN Cheats';
      defaultCopy[1] = `Download the GoldHEN JSON cheat file for ${game.title} on PS4, ${titleId}, game update ${update}.`;
      defaultCopy[2] = [`${game.title} PS4 cheat file download`, `${game.title} GoldHEN JSON`, `${titleId} ${update} GoldHEN cheats`];
    }
    const [title, description, discoveryTerms = []] = gameCopy[game.id] || defaultCopy;
    const matchHeading = game.id === 'fortnite';
    const pageTitle = matchHeading ? `${game.title} · ${game.platformLabel}` : `${title} | whatwhatboy`;
    const searchable = matching.filter(entry => entry.keywords.length);
    const sharedKeywords = multi.data.families
      .filter(family => family.games.some(mapping => mapping.gameId === game.id &&
        matching.some(entry => (mapping.legacy ? 'bo3-' + entry.id : entry.id) === mapping.resourceId)))
      .flatMap(family => family.keywords || []);
    const searchKeywords = unique([
      ...sharedKeywords,
      ...searchable.map(entry => entry.name),
      ...searchable.flatMap(entry => entry.keywords.filter(term => term.startsWith(game.title + ' '))),
      ...searchable.flatMap(entry => entry.keywords.filter(term => /\.rar$/i.test(term))),
      ...searchable.flatMap(entry => entry.keywords.filter(term => / (?:download|guide|setup|controls)$/.test(term)))
    ]);
    const items = searchable.length ? matching.map(({name, url, keywords}) => ({name, url, keywords})) : undefined;
    result.set(game.url.slice(1) + 'index.html', {title: pageTitle, brandTitle: !matchHeading, description,
      keywords: unique([...(gameAliases[game.id] || []), game.title, ...(matchHeading ? [title] : []), ...discoveryTerms, ...matching.map(entry => entry.name),
        ...matching.flatMap(entry => entry.tags), ...matching.flatMap(entry => entry.versions.match(/\bCUSA\d{5}\b/g) || [])]), searchKeywords, type: 'CollectionPage', items,
      ...(game.id === 'rainbow-six-siege' ? {breadcrumbs: [{name:'Home',url:'/'},{name:'Mods / Mod Menus',url:'/console/mods/'},{name:'PS4/PS5 Games',url:'/console/mods/ps4/'},{name:'Rainbow Six Siege',url:game.url}]} : {})});
  }
  const gtaOnlineEntries = entries.filter(entry => entry.gameId === 'gta5' && entry.category === 'plugin');
  result.set('console/mods/ps4/gta5/online.html', {
    title: 'GTA V Online PS4: No PS Plus Plugin & Server Guides | whatwhatboy',
    description: 'Download the user-supplied No PS Plus PRX for GTA V Online on PS4. Functionality and compatibility are unverified. Includes private-server setup guides.',
    keywords: unique(['GTA V Online PS4', 'GTA 5 Online plugins', 'No PS Plus', 'no-ps-plus.prx', 'Los Santos Online', 'GTA V private server setup', 'Los Santos Online guide', ...gtaOnlineEntries.flatMap(entry => [...entry.keywords, ...entry.tags])]),
    searchKeywords: unique(gtaOnlineEntries.flatMap(entry => entry.keywords)),
    type: 'CollectionPage',
    items: gtaOnlineEntries.map(entry => ({name: entry.name, url: '/console/mods/ps4/gta5/online.html#resource-' + entry.id, keywords: entry.keywords}))
  });
  const directory = {title: 'PS4 Mod Menu Downloads & PS5 Game Tools | whatwhatboy',
    description: `Search ${entries.length} PS4/PS5 game-resource entries across ${games.length} games by menu name, game alias, update or type. Open downloads, previews and guide popups.`,
    keywords: unique(['PS4 mod menu downloads', 'where to download PS4 mod menus', 'PlayStation 4 mod menus', 'PS4 SPRX mod menus', 'PS4 PRX mod menus', 'Fortnite PS4 mod menus', 'Apex Legends PS4 mod menus', 'PS4 mod menu guides', 'MultiCOD', 'MAG GSC Injector', 'MAG host menus', 'BO4 Multiplayer Zombies source code', 'PS4 host mod menus', 'PS4 off-host mod menus', 'GTA 5 mod menu downloads', 'RDR2 mod menu downloads', 'Call of Duty mod menu downloads', ...games.map(game => game.title), 'PS4 PS5 menu directory', 'console game resources', 'mod menu search', 'injectors', 'RTM tools', 'CFG', 'scripts', 'DLC references', ...games.flatMap(game => gameAliases[game.id] || [])]),
    type: 'CollectionPage', items: entries.map(entry => ({name: entry.game + ' · ' + entry.name, url: entry.url, keywords: entry.keywords}))};
  result.set('console/mods/ps4/menus.html', directory);
  result.set('console/mods/ps4/index.html', {title: 'PS4/PS5 Mods / Mod Menus | whatwhatboy',
    description: `Browse ${games.length} game collections, including GTA V, RDR2, Call of Duty, Fortnite, DayZ and Apex Legends. Find mod menus, downloads and game-specific requirements.`,
    keywords: unique(['Scooby Console', 'Scooby PS4 mod menus', 'Overwatch PS4 coming soon', ...directory.keywords]), type: 'CollectionPage'});
  const codGames = games.filter(game => game.url.includes('/call-of-duty/'));
  result.set('console/mods/ps4/call-of-duty/index.html', {title: 'Call of Duty Console Menus, Injectors & Guides | whatwhatboy',
    description: `Browse ${codGames.length} Call of Duty collections, from Black Ops to WWII, with game-specific menus, GSC injectors, RTM tools, previews and DLC references.`,
    keywords: unique(['Call of Duty console resources', 'COD mod menus', 'Call of Duty mod menu downloads', 'Call of Duty mod menu guides', 'PS4 Call of Duty mod menus', 'Black Ops mod menus', 'GSC injector downloads', 'GSC injector guides', 'MultiCOD', 'MAG GSC Injector', 'MAG host menus', 'PS4 off-host menus', 'BO4 Multiplayer Zombies source code', ...codGames.map(game => game.title), 'GSC injectors', 'RTM tools', 'DLC references', ...codGames.flatMap(game => gameAliases[game.id] || [])]), type: 'CollectionPage',
    items: [{name: 'MultiCOD', url: '/console/mods/ps4/call-of-duty/multicod/'}, ...codGames.map(game => ({name: game.title, url: game.url, keywords: gameAliases[game.id] || []}))]});
  result.set('console/mods/ps4/call-of-duty/multicod/index.html', {
    title: 'MultiCOD PS4 Host Menus, GSC Injectors & Supported Games | whatwhatboy',
    description: 'Find MatrixMods PS4 ELF downloads and MAG GSC injectors by Call of Duty game and update, with compatibility and setup notes.',
    type: 'CollectionPage', keywords: unique(['MultiCOD', 'Multi COD PS4', 'MultiCOD PS4 downloads', 'MAG GSC Injector', 'MAG host menus', 'PS4 GSC injector', ...multi.data.families.flatMap(familyKeywords), ...multi.data.families.flatMap(f => f.games.flatMap(g => [multi.games.get(g.gameId).title, ...(gameAliases[g.gameId] || []), g.support]))]),
    items: multi.data.families.flatMap(f => f.games.map(g => ({name: f.title + ' · ' + multi.games.get(g.gameId).title, url: gameUrl(g, multi), keywords: unique([...familyKeywords(f), g.support, ...(gameAliases[g.gameId] || [])])})))
  });
  const vault = require('../docs/console-vault-resources.json');
  result.set('console/vault.html', {title: 'The Vault: Console Apps, Updates & Reference Sites | whatwhatboy',
    description: 'Find PKG-Zone, OrbisPatches, Garlicsaves, PlayStation firmware archives, SuperPSX and Vimm’s Lair, with usage notes and link-check status.',
    keywords: unique(['The Vault', 'console reference websites', ...vault.resources.map(item => item.name), ...vault.resources.flatMap(item => item.tags)]),
    type: 'CollectionPage', items: vault.resources.map(item => ({name: item.name, url: item.url}))});
  return result;
}
function pageSchema({canonical, title, description, keywords, image, metadata}) {
  const origin = 'https://whatwhatboy.com';
  const website = {'@type': 'WebSite', '@id': origin + '/#website', url: origin + '/', name: 'whatwhatboy'};
  const page = {'@type': metadata?.type || 'WebPage', '@id': canonical + '#webpage', url: canonical,
    name: title, description, inLanguage: 'en', isPartOf: {'@id': website['@id']}, keywords};
  if (image) page.image = image;
  if (metadata?.items) page.mainEntity = {'@type': 'ItemList', numberOfItems: metadata.items.length,
    itemListElement: metadata.items.map((item, i) => ({'@type': 'ListItem', position: i + 1, name: item.name, url: new URL(item.url, origin).href,
      ...(item.keywords?.length ? {item: {'@type': 'CreativeWork', name: item.name, url: new URL(item.url, origin).href, keywords: item.keywords.join(', ')}} : {})}))};
  return {'@context': 'https://schema.org', '@graph': [website, page]};
}
module.exports = {metadataByPage, pageSchema};
