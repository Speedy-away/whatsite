// Search aliases for actual resource names and visible tags, never page-wide
// platform guesses or hidden compatibility prose.
const path = require('node:path');
const {createHash} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const decode = value => String(value)
  .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&(?:amp|quot|apos|lt|gt|nbsp|rsquo|lsquo|ndash|mdash);/g, entity => ({'&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&rsquo;': '’', '&lsquo;': '‘', '&ndash;': '–', '&mdash;': '—'}[entity]));
const plain = value => decode(String(value).replace(/<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const fold = value => String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’‘]/g, "'").replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
const unique = values => [...new Map(values.filter(Boolean).map(value => [fold(value), String(value).trim()])).values()];
const groups = [
  [/\b(?:free[ -]?shops?|freeshops?)\b/i, ['free shops', 'free shop', 'freeshop', 'free shops downloads', 'console free shops', 'PlayStation free shops', 'free store downloads']],
  [/\borbit(?:[ -]store|_store\.elf)\b/i, ['Orbit Store', 'orbit download', 'Orbit Store download', 'download Orbit Store', 'Orbit Store PS5', 'PS5 Orbit download', 'Orbit free shop', 'Orbit PS5 free shop', 'Orbit Store ELF', 'orbit_store.elf', 'Orbit Store installer', 'Orbit Store setup']],
  [/\b(?:infinitykkj(?:\s*store)?|infinity store)\b/i, ['Infinitykkj STORE', 'infinity store', 'infinity free shop', 'infinity download', 'infinity store download', 'Infinitykkj download', 'Infinitykkj STORE download', 'Infinitykkj STORE PS4', 'Infinitykkj PS4 download', 'Infinitykkj free shop', 'Infinitykkj STORE PKG', 'Infinitykkj STORE beta', 'Infinitykkj STORE installation', 'InfinitykkjSTORE']],
  [/\bnova store\b/i, ['Nova Store', 'Nova Store download', 'download Nova Store', 'Nova free shop', 'Nova Store free shop', 'Nova Store ZIP', 'Nova Store installer', 'Nova Store setup']],
  [/\b(?:universal[- ]updater|open shop channel)\b/i, ['free homebrew apps', 'homebrew app store', 'homebrew downloader', 'free store', 'free shop', 'freeshop']],
  [/\batmosph[eè]re\b/i, ['Atmosphere', 'Nintendo Switch custom firmware', 'Switch CFW']],
  [/\bhekate\b/i, ['Hekate', 'Switch bootloader', 'Switch boot menu', 'RCM bootloader']],
  [/\b(?:dbi|tinfoil|awoo|tinwoo|tinleaf)\b/i, ['Switch package installer', 'Switch installation tools', 'Switch file management']],
  [/\b(?:luma3ds|godmode9)\b/i, ['Nintendo 3DS homebrew tools', '3DS custom firmware tools']],
  [/\b(?:twilight menu|nds-bootstrap)\b/i, ['Nintendo DS homebrew', 'DSi homebrew launcher', 'DS game launcher']],
  [/\b(?:ps3hen|ps3 hen)\b/i, ['PS3HEN', 'PS3 homebrew enabler', 'PS3 HEN setup']],
  [/\b(?:multiman|irisman|webman mod)\b/i, ['PS3 file manager', 'PS3 homebrew utilities', 'PS3 game management']],
  [/\b(?:pkgj|vitadb|vitashell)\b/i, ['PS Vita homebrew apps', 'Vita app downloads', 'Vita package tools']],
  [/\b(?:aurora|freestyle dash|xexmenu)\b/i, ['Xbox 360 dashboard', 'Xbox 360 homebrew apps', 'Xbox 360 app launcher']],
  [/\b(?:swiss|nintendont)\b/i, ['GameCube homebrew loader', 'GameCube game launcher']],
  [/\b(?:open ps2 loader|wlaunchelf|freemcboot|opentuna)\b/i, ['PS2 homebrew tools', 'PlayStation 2 setup', 'PS2 homebrew loader']],
  [/\bretroarch\b/i, ['RetroArch', 'multi-system emulator', 'emulator cores', 'retro game emulation']],
  [/\b(?:save manager|save backup|checkpoint|jksv)\b/i, ['save manager', 'save backups', 'save restore', 'game save tools']],
  [/\b(?:file manager|file browser)\b/i, ['file manager', 'file browser', 'storage tools', 'file transfer tools']],
  [/\b(?:source code|source codes|source archive)\b/i, ['source code downloads', 'source archives', 'developer resources']],
  [/\blua\b/i, ['Lua scripts', 'Lua script downloads', 'Lua scripting']],
  [/\bgsc\b/i, ['Call of Duty scripts', 'GSC scripts', 'script modding tools']],
  [/\bcsc\b/i, ['CSC scripts', 'script modding tools']],
  [/\bapk\b/i, ['APK downloads', 'Android apps', 'Android app installer']],
  [/\b(?:orbit store|prosperostore|recompstore|homebrew (?:app )?store)\b/i, ['homebrew store', 'homebrew app store', 'free homebrew store', 'free store', 'free shop', 'freeshop', 'console app store', 'homebrew downloader', 'store app download']],
  [/\b(?:web[ -]?kit)\b/i, ['WebKit', 'WebKit exploit', 'browser WebKit exploit', 'WebKit exploit host']],
  [/\b(?:browser host|exploit host|jailbreak host)s?\b/i, ['browser exploit host', 'online exploit host', 'online jailbreak host', 'console jailbreak host']],
  [/\beta[ -]?hen\b/i, ['etaHEN', 'eta HEN', 'PS5 homebrew enabler', 'PS5 payload setup']],
  [/\by2jb\b/i, ['Y2JB', 'PS5 YouTube jailbreak setup', 'Y2JB installer', 'Y2JB autoloader']],
  [/\btrophy[ _-]*unlock(?:er|ers)?\b/i, ['trophy unlockers', 'trophy unlocker', 'trophy_unlockers', 'trophy unlock', 'trophy hack', 'trophy hacking', 'trophy tool', 'trophy unlock tool', 'PlayStation trophy unlocker', 'PlayStation trophy hack', 'PS4 trophy unlocker', 'PS4 trophy hack', 'PS4 trophy tools', 'PS4 trophy unlocker PKG']],
  [/\b(?:goldhen)\b/i, ['GoldHEN', 'Gold HEN', 'PS4 homebrew enabler', 'GoldHEN payload', 'goldhen.bin']],
  [/\bplugins\.ini\b/i, ['plugins.ini', 'GoldHEN plugin configuration', 'PS4 plugin setup', 'PRX plugin configuration', 'regional title IDs', 'CUSA title ID']],
  [/\bapollo save tool\b/i, ['Apollo Save Tool', 'save manager', 'save backup', 'save import', 'save export', 'save resigning']],
  [/\bps4[- ]?xplorer\b/i, ['PS4-Xplorer', 'PS4 file manager', 'PS4 file browser', 'PS4 storage manager']],
  [/\bezremote\b/i, ['ezRemote Client', 'console file manager', 'remote file transfer', 'FTP file transfer', 'SFTP file transfer', 'SMB network share', 'WebDAV file transfer']],
  [/\bpayload guest\b/i, ['Payload Guest', 'PS4 BIN loader', 'PS4 payload loader', 'PS4 payload launcher']],
  [/\bps4pkgviewer\b/i, ['PS4PKGViewer', 'PS4 PKG viewer', 'PS4 package information', 'PS4 package title ID', 'Windows PKG tool']],
  [/\bcheat engine\b/i, ['Cheat Engine', 'PC memory editor', 'memory scanner', 'cheat table', 'CT files']],
  [/\b(?:extreme injector|xenos|gh injector)\b/i, ['DLL injector', 'DLL injection tool', 'Windows injection tool']],
  [/\b(?:mod organizer 2|vortex)\b/i, ['mod manager', 'mod profiles', 'mod installation tool']],
  [/\b(?:reshade|enb(?: series)?)\b/i, ['graphics modding tool', 'post-processing tool', 'shader presets']],
  [/\b(?:gta\s*(?:v|5)|grand theft auto\s*(?:v|5))\b/i, ['GTA V', 'GTA 5', 'GTA5', 'Grand Theft Auto V', 'Grand Theft Auto 5']],
  [/\b(?:gta\s*(?:iv|4)|grand theft auto\s*(?:iv|4))\b/i, ['GTA IV', 'GTA 4', 'GTA4', 'Grand Theft Auto IV', 'Grand Theft Auto 4']],
  [/\b(?:rdr\s*2|red dead redemption\s*(?:2|ii))\b/i, ['RDR2', 'RDR 2', 'Red Dead Redemption 2', 'Red Dead Redemption II']],
  [/\b(?:gta\s*(?:sa|san andreas)|grand theft auto san andreas)\b/i, ['GTA San Andreas', 'GTA SA', 'GTASA', 'Grand Theft Auto San Andreas']],
  [/\b(?:gta\s*(?:vc|vice city)|grand theft auto vice city)\b/i, ['GTA Vice City', 'GTA VC', 'GTAVC', 'Grand Theft Auto Vice City']],
  [/\b(?:gta\s*(?:iii|3)|grand theft auto\s*(?:iii|3))\b/i, ['GTA III', 'GTA 3', 'GTA3', 'Grand Theft Auto III']],
  [/\b(?:red dead redemption|rdr\s*1)\b(?!\s*(?:2|ii)\b)/i, ['Red Dead Redemption', 'RDR1', 'RDR 1']],
  [/\b(?:modern warfare\s*(?:2|ii)|mw\s*2)\b/i, ['Modern Warfare 2', 'Modern Warfare II', 'MW2', 'MW 2']],
  [/\b(?:modern warfare\s*(?:3|iii)|mw\s*3)\b/i, ['Modern Warfare 3', 'Modern Warfare III', 'MW3', 'MW 3']],
  [/\bborderlands\s*(?:2|ii)\b/i, ['Borderlands 2', 'BL2', 'BL 2']],
  [/\bborderlands\s*(?:3|iii)\b/i, ['Borderlands 3', 'BL3', 'BL 3']],
  [/\bleft\s*4\s*dead\s*2\b|\bl4d\s*2\b/i, ['Left 4 Dead 2', 'L4D2', 'L4D 2']],
  [/\bleft\s*4\s*dead\b(?!\s*2\b)|\bl4d\s*1\b/i, ['Left 4 Dead', 'L4D1', 'L4D 1']],
  [/\b(?:black ops\s*(?:1|i)|bo\s*1)\b/i, ['Black Ops 1', 'Black Ops I', 'BO1', 'BO 1', 'Call of Duty Black Ops 1']],
  [/\b(?:black ops\s*(?:2|ii)|bo\s*2)\b/i, ['Black Ops 2', 'Black Ops II', 'BO2', 'BO 2', 'Call of Duty Black Ops 2']],
  [/\b(?:black ops\s*(?:3|iii)|bo\s*3)\b/i, ['Black Ops 3', 'Black Ops III', 'BO3', 'BO 3', 'Call of Duty Black Ops 3']],
  [/\b(?:black ops\s*(?:4|iv)|bo\s*4)\b/i, ['Black Ops 4', 'Black Ops IV', 'BO4', 'BO 4', 'Call of Duty Black Ops 4']],
  [/\b(?:black ops cold war|bocw)\b/i, ['Black Ops Cold War', 'BOCW', 'Call of Duty Black Ops Cold War']],
  [/\b(?:modern warfare remastered|cod\s*4 remastered|mwr)\b/i, ['Modern Warfare Remastered', 'MWR', 'COD4 Remastered', 'Call of Duty Modern Warfare Remastered']],
  [/\b(?:call of duty\s*4|cod\s*4)(?!\s*remastered)\b/i, ['Call of Duty 4', 'COD4', 'COD 4']],
  [/\b(?:call of duty world at war|world at war|cod\s*waw)\b/i, ['Call of Duty World at War', 'COD WaW', 'World at War']],
  [/\b(?:advanced warfare|cod\s*aw)\b/i, ['Advanced Warfare', 'COD AW', 'Call of Duty Advanced Warfare']],
  [/\b(?:infinite warfare|cod\s*iw)\b/i, ['Infinite Warfare', 'COD IW', 'Call of Duty Infinite Warfare']],
  [/\b(?:call of duty\s*(?:wwii|ww2|world war ii)|cod\s*(?:wwii|ww2))\b/i, ['Call of Duty WWII', 'Call of Duty WW2', 'COD WWII', 'COD WW2']],
  [/\b(?:counter[- ]strike\s*2|cs\s*2)\b/i, ['Counter-Strike 2', 'Counter Strike 2', 'CS2', 'CS 2']],
  [/\bcounter[- ]strike source\b/i, ['Counter-Strike Source', 'Counter Strike Source', 'CS Source', 'CS:S']],
  [/\bcounter[- ]strike\s*1\.6\b|\bcs\s*1\.6\b/i, ['Counter-Strike 1.6', 'Counter Strike 1.6', 'CS 1.6', 'CS16']],
  [/\b(?:counter[- ]strike global offensive|cs[: ]?go)\b/i, ['Counter-Strike Global Offensive', 'CSGO', 'CS GO', 'CS:GO']],
  [/\b(?:team fortress\s*2|tf\s*2)\b/i, ['Team Fortress 2', 'TF2', 'TF 2']],
  [/\b(?:garry['’]?s mod|gmod)\b/i, ["Garry's Mod", 'Garrys Mod', 'GMod']],
  [/\bwwb['’]s ps4 and ps5 game library\b/i, ['WWB Game Library', 'WhatWhatBoy Game Library', 'PlayStation game catalog',
    'PS4 game library', 'PS5 game library', 'PS4 game downloads', 'PS4 games downloads', 'download PS4 games',
    'PS5 game downloads', 'PS5 games downloads', 'download PS5 games', 'PS4 game download links', 'PS5 game download links',
    'CUSA title ID', 'PPSA title ID', 'PS4 PKG', 'PS5 package links', 'DLC', 'title updates', 'FPKG fixes', 'OnlyGames']],
  [/\b(?:playstation\s*1|ps\s*1)\b/i, ['PlayStation 1', 'PS1', 'PS 1']],
  [/\b(?:playstation\s*2|ps\s*2)\b/i, ['PlayStation 2', 'PS2', 'PS 2']],
  [/\b(?:playstation\s*3|ps\s*3)\b/i, ['PlayStation 3', 'PS3', 'PS 3']],
  [/\b(?:playstation\s*4|ps\s*4)\b/i, ['PlayStation 4', 'PS4', 'PS 4']],
  [/\b(?:playstation\s*5|ps\s*5)\b/i, ['PlayStation 5', 'PS5', 'PS 5']],
  [/\b(?:playstation vita|ps\s*vita|native vita)\b/i, ['PlayStation Vita', 'PS Vita', 'PSVita']],
  [/\b(?:playstation portable|psp)\b/i, ['PlayStation Portable', 'PSP']],
  [/\b(?:xbox\s*360|x360)\b/i, ['Xbox 360', 'Xbox360', 'X360']],
  [/\b(?:original xbox|xbox classic)\b/i, ['Original Xbox', 'Xbox Classic']],
  [/\b(?:xbox one)\b/i, ['Xbox One', 'XboxOne']],
  [/\b(?:xbox series x|xsx)\b/i, ['Xbox Series X', 'XSX']],
  [/\b(?:xbox series s|xss)\b/i, ['Xbox Series S', 'XSS']],
  [/\b(?:nintendo switch\s*2|switch\s*2)\b/i, ['Nintendo Switch 2', 'Switch 2']],
  [/(?:\bnintendo switch(?!\s*2)\b|^switch$|\bswitch(?=\s+(?:homebrew|firmware|games|mods|themes|apps|emulators|tools|setup|cfw|bootloader)\b))/i, ['Nintendo Switch', 'Switch']],
  [/\b(?:nintendo gamecube|gamecube)\b/i, ['Nintendo GameCube', 'GameCube', 'Game Cube']],
  [/\b(?:nintendo wii\s*u|wii\s*u)\b/i, ['Nintendo Wii U', 'Wii U', 'WiiU']],
  [/\b(?:nintendo wii|wii)(?!\s*u)\b/i, ['Nintendo Wii', 'Wii']],
  [/\b(?:nintendo\s*3ds|3ds)\b/i, ['Nintendo 3DS', '3DS']],
  [/\b(?:nintendo\s*2ds|2ds)\b/i, ['Nintendo 2DS', '2DS']],
  [/\b(?:nintendo dsi|dsi)\b/i, ['Nintendo DSi', 'DSi']],
  [/\b(?:nintendo ds|nds)(?!i)\b/i, ['Nintendo DS', 'NDS']],
  [/\b(?:game boy advance|gba)\b/i, ['Game Boy Advance', 'GBA']],
  [/\b(?:game boy color|gbc)\b/i, ['Game Boy Color', 'GBC']],
  [/\b(?:steam deck|steamdeck)\b/i, ['Steam Deck', 'SteamDeck']],
  [/\bsingle[- ]?player\b/i, ['single player', 'single-player', 'singleplayer']],
  [/\bmulti[- ]?player\b/i, ['multiplayer', 'multi-player', 'multi player']],
  [/\bco[- ]?op\b/i, ['co-op', 'co op', 'coop']],
  [/\bopen[- ]source\b/i, ['open source', 'open-source']],
  [/\b(?:frame[- ]?rate|\d+\s*fps)\b/i, ['frame rate', 'framerate']],
  [/\b(?:vpk)\b/i, ['VPK', 'VPK package']],
  [/\bpkg\b/i, ['PKG', 'package file']],
  [/\bwuhb\b/i, ['WUHB', 'homebrew bundle']],
  [/\b(?:nxtheme|nx themes?)\b/i, ['NXTheme', 'NX theme', 'theme file']],
  [/\bp3t\b/i, ['P3T', 'theme file']],
  [/\bpbp\b/i, ['PBP', 'EBOOT.PBP']],
  [/\bxbe\b/i, ['XBE', 'Xbox executable']],
  [/\bsha[- ]?256\b/i, ['SHA-256', 'SHA256', 'file checksum']]
];

function aliasesFor(value) {
  const text = plain(value);
  return unique(groups.flatMap(([pattern, aliases]) => pattern.test(text) ? aliases : []));
}
function resourceTerms(card, file = '') {
  const heading = card.match(/<h[234]\b[^>]*>([\s\S]*?)<\/h[234]>/i)?.[1]
    || card.match(/<(?:span|strong)\b[^>]*class=["'][^"']*\b(?:game-title|resource-title|source-title)\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|strong)>/i)?.[1] || '';
  const labels = [...card.matchAll(/<(?:span|li)\b[^>]*class=["'][^"']*\b(?:feature|feature-tag|tag|badge)\b[^"']*["'][^>]*>([\s\S]*?)<\/(?:span|li)>/gi)].map(match => plain(match[1]));
  for (const match of card.matchAll(/<ul\b[^>]*class=["'][^"']*\b[\w-]*tags\b[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gi)) labels.push(plain(match[1]));
  const title = plain(heading);
  // Negative compatibility tags remain visible/searchable, but must not add
  // positive platform aliases. A file format alone never assigns a platform.
  const positiveLabels=labels.filter(label=>!/\b(?:not (?:compatible|supported|tested|verified|available)|unsupported|unconfirmed|unverified|untested|no (?:native |verified |confirmed )?(?:support|ps[1-5]|xbox))\b/i.test(label));
  const host = /class=["'](?:[^"']*\s)?guide-host(?:\s|["'])/.test(card.slice(0, card.indexOf('>') + 1));
  const hostTerms = host ? positiveLabels.filter(label => /^PS[45]$/i.test(label)).flatMap(platform => [`${platform} host`, `${platform} exploit host`, `${platform} browser host`, `${platform} online host`, `${platform} jailbreak host`, `${platform} ${title} host`]) : [];
  const apolloPlatform = /^console\/(ps3|ps4|psvita)\/save-tools\.html$/.exec(file)?.[1]
    || (/^console\/psvita\/(?:index|apps)\.html$/.test(file) ? 'psvita' : '');
  const apolloTerms = apolloPlatform && /^Apollo Save Tool\b/i.test(title) ? [
    'Apollo save guide', 'change save owner', 'PSN Account ID', 'resign saves', 'restore save backup',
    ...{
      ps3: ['PS3 save resigning', 'PS3 SAVEDATA', 'owners.xml', 'Change Account ID'],
      ps4: ['PS4 save resigning', 'CUSA save import', 'decrypted PS4 saves', 'PS4 APOLLO'],
      psvita: ['PS Vita save resigning', 'Apollo Vita VPK', 'VitaShell save backup', 'Adrenaline PSP saves', 'PS1 virtual memory cards']
    }[apolloPlatform]
  ] : [];
  const ps4GuideTerms = file === 'console/ps4/index.html' && /href=["']\/console\/ps4\/jailbreaks\.html["']/.test(card)
    ? ["PS4 14.02 jailbreak","14.02 jailbreak","PS4 jailbreak 14.02","PlayStation 4 14.02 jailbreak","PS4 14.02 jailbreak guide","PS4 14.02 or lower jailbreak","PS4 jailbreak tutorial","PS4 jailbreak 2026","PS4 14.02 jailbreak tutorial","how to jailbreak PS4 14.02","PS4 14.02 jailbreak requirements","PS4 14.02 host compatibility","PS4 jailbreak step by step","PS4 browser jailbreak setup","PS4 automatic DNS","PS4 disable automatic updates","PS4 offline cache setup","PS4 jailbreak cache not working","PS4 insufficient free system memory","PS4 jailbreak reboot recovery","PS4 GoldHEN reload after restart","PS4 homebrew padlock fix","PS4 PKG not showing on USB","PS4 exFAT USB homebrew","PS4 jailbreak rest mode","PS4 browser cookies and website data"] : [];
  const menuTerms = require('./console-mod-search-tags.cjs').termsForCard(file, card, title);
  return unique([title, ...ps4GuideTerms, ...labels, ...[title, ...positiveLabels].flatMap(aliasesFor), ...hostTerms, ...apolloTerms, ...menuTerms]);
}
function protectedFile(file, html = '') {
  const relative = (path.isAbsolute(file) && !/^\/(?:console|downloads)\//.test(file) ? path.relative(root, file) : file).replaceAll('\\', '/').replace(/^\/+/, '').split(/[?#]/)[0];
  return relative.startsWith('hosts/runtime/')
    || relative.startsWith('downloads/') && relative !== 'downloads/index.html'
    || /(?:^|\/)whatsite-ps[45]\.html$/i.test(relative)
    || /\bid=["']receiver-catalog["']/.test(html);
}
const tokenPattern = /<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<\/?[a-z][\w:-]*\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
const searchAttribute = /(?:^|\s)(data-search|data-library-search|data-catalog-search)\s*=\s*(["'])([\s\S]*?)\2/i;
function apply(file, html) {
  if (protectedFile(file, html)) return html;
  if (/<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/i.test(html)) return html;
  if (/http-equiv=["']refresh["']/i.test(html)) return html;
  const canonical=html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
  if(canonical&&new URL(canonical).origin!=='https://whatwhatboy.com')return html;
  const relative = (path.isAbsolute(file) ? path.relative(root, file) : file).replaceAll('\\', '/');
  const tokens = [...html.matchAll(tokenPattern)];
  const edits = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i], start = token[0];
    const tag = start.match(/^<(article|div|a|li)\b/i)?.[1]?.toLowerCase();
    if (!tag) continue;
    const found = start.match(searchAttribute);
    const native = /\sdata-(?:ps2-item|vita-item|ds-card|three-ds-card|wii-card|wiiu-app|xbox-app|library-card)(?=\s|=|>)/.test(start)
      || /class=["'](?:[^"']*\s)?guide-host(?:\s|["'])/.test(start);
    if (!found && !native) continue;
    let depth = 1, end = -1;
    for (let j = i + 1; j < tokens.length; j++) {
      const next = tokens[j];
      if (new RegExp(`^<${tag}\\b`, 'i').test(next[0])) depth++;
      else if (new RegExp(`^<\\/${tag}\\s*>$`, 'i').test(next[0])) depth--;
      if (!depth) { end = next.index + next[0].length; break; }
    }
    if (end === -1) continue;
    const terms = resourceTerms(html.slice(token.index, end), relative);
    if (!terms.length) continue;
    let existing = found ? decode(found[3]).toLowerCase() : '';
    // Track just the generated suffix, not a second copy of each search index.
    // Verify it before removal so a manual edit is never silently truncated.
    const marker = /\sdata-search-i18n="(\d+):([a-f0-9]{12})"/i;
    const previous = start.match(marker);
    const digest = text => createHash('sha256').update(text).digest('hex').slice(0,12);
    if (previous) {
      const suffix = existing.slice(-Number(previous[1]));
      if (suffix.length === Number(previous[1]) && digest(suffix) === previous[2]) existing = existing.slice(0,-suffix.length);
    }
    const additions = [];
    const appendTerms = values => { for (const term of values) {
      const variants = [...new Set([term.toLowerCase(), fold(term)])];
      for (const value of variants) if (value && !(existing + ' ' + additions.join(' ')).includes(value)) additions.push(value);
    }};
    appendTerms(terms);
    const englishCount = additions.length;
    appendTerms(require('./multilingual-search-terms.cjs').localizedTerms(terms.join(' ')+' '+existing));
    const value = [existing, ...additions].filter(Boolean).join(' ').trim();
    const translated = additions.slice(englishCount).join(' ');
    const suffix = translated ? (existing || englishCount ? ' ' : '') + translated : '';
    const attr = found?.[1] || (/\sdata-library-card(?:\s|=|>)/.test(start) ? 'data-library-search' : 'data-search');
    const quote = found?.[2] || '"';
    const escaped = value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll(quote, quote === '"' ? '&quot;' : '&#39;');
    const prefix = found ? found[0].slice(0, found[0].indexOf(found[1])) : ' ';
    let updated = found ? start.replace(searchAttribute, `${prefix}${attr}=${quote}${escaped}${quote}`) : start.replace(/>$/, ` ${attr}=${quote}${escaped}${quote}>`);
    updated = updated.replace(marker,'');
    if (suffix) updated = updated.replace(/>$/,` data-search-i18n="${suffix.length}:${digest(suffix)}">`);
    if (updated !== start) edits.push({start: token.index, end: token.index + start.length, value: updated});
  }
  for (const edit of edits.reverse()) html = html.slice(0, edit.start) + edit.value + html.slice(edit.end);
  return html;
}
module.exports = {apply, aliasesFor, resourceTerms, protectedFile, decode, plain, fold};
