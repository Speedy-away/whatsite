// Search taxonomy only; these labels do not assert hardware support or playability.
const subjects = {
  'burnout-3-takedown': ['Racing', 'Burnout'],
  'super-mario-sunshine': ['3D Platformer', 'Super Mario'],
  'ratchet-clank': ['Action Platformer', 'Ratchet & Clank'],
  'the-legend-of-zelda-the-wind-waker': ['Action Adventure', 'The Legend of Zelda'],
  'spider-man-edge-of-time': ['Action Adventure', 'Spider-Man'],
  'infamous-second-son': ['Open-world Action', 'inFAMOUS'],
  'uncharted-the-nathan-drake-collection': ['Action Adventure', 'Uncharted'],
  'god-of-war-iii': ['Hack and Slash', 'God of War'],
  'bloodborne': ['Action RPG', 'Bloodborne', 'Soulslike'],
  'sin-and-punishment': ['Rail Shooter', 'Sin and Punishment'],
  'pokemon-snap': ['Photography', 'Pokémon'],
  '007-the-world-is-not-enough': ['FPS', 'James Bond 007'],
  'ace-combat-5-the-unsung-war': ['Flight Combat', 'Ace Combat'],
  'ridge-racer-v': ['Racing', 'Ridge Racer'],
  'soulcalibur': ['Fighting', 'Soulcalibur'],
  'eternal-darkness-sanity-s-requiem': ['Survival Horror', 'Eternal Darkness'],
  'new-super-mario-bros-wii': ['2D Platformer', 'Super Mario'],
  'scooby-doo-night-of-100-frights': ['3D Platformer', 'Scooby-Doo'],
  'serious-sam-next-encounter': ['FPS', 'Serious Sam'],
  'skies-of-arcadia-legends': ['JRPG', 'Skies of Arcadia'],
  'super-smash-bros-melee': ['Platform Fighter', 'Super Smash Bros.'],
  'super-mario-galaxy': ['3D Platformer', 'Super Mario'],
  'super-paper-mario': ['Action Platformer', 'Paper Mario'],
  'wario-land-shake-it': ['2D Platformer', 'Wario Land'],
  '007-from-russia-with-love': ['Third-person Shooter', 'James Bond 007'],
  'dead-or-alive-3': ['Fighting', 'Dead or Alive'],
  'def-jam-fight-for-ny': ['Wrestling', 'Def Jam'],
  'far-cry-instincts': ['FPS', 'Far Cry'],
  'the-lord-of-the-rings-the-two-towers': ['Hack and Slash', 'The Lord of the Rings'],
  'the-lord-of-the-rings-the-return-of-the-king': ['Hack and Slash', 'The Lord of the Rings'],
  'tom-clancy-s-splinter-cell-double-agent': ['Stealth', 'Splinter Cell'],
  'army-of-two': ['Co-op Shooter', 'Army of Two'],
  'crackdown': ['Open-world Action', 'Crackdown'],
  'dead-rising-2-case-zero': ['Survival Horror', 'Dead Rising'],
  'forza-horizon': ['Open-world Racing', 'Forza'],
  'geometry-wars-retro-evolved-2': ['Twin-stick Shooter', 'Geometry Wars'],
  'peter-jackson-s-king-kong': ['Action Adventure', 'King Kong'],
  'call-of-duty-modern-warfare-2': ['FPS', 'Call of Duty'],
  'splatterhouse': ['Beat ’em Up', 'Splatterhouse'],
  'tekken-6-native-online': ['Fighting', 'Tekken'],
  'wet': ['Action Shooter', 'WET'],
  'wwe-smackdown-vs-raw-2011': ['Wrestling', 'WWE'],
  'infamous': ['UGC Tools', 'inFAMOUS'],
  'resident-evil-code-veronica': ['Survival Horror', 'Resident Evil'],
  'crash-team-racing-nitro-fueled': ['Kart Racing', 'Crash Bandicoot'],
  'driveclub': ['Racing', 'Driveclub'],
  'gravity-rush-2': ['Action Adventure', 'Gravity Rush'],
  'the-last-guardian': ['Puzzle Adventure', 'The Last Guardian'],
  'prince-of-persia-mod-manager-openjade': ['Mod Tools', 'Prince of Persia']
};
const consoles = {GameCube:'Nintendo GameCube GCN GC NGC',Wii:'Nintendo Wii','Nintendo 64':'Nintendo 64 N64',PS2:'Sony PlayStation 2 PS2',PS3:'Sony PlayStation 3 PS3',PS4:'Sony PlayStation 4 PS4',Xbox:'Microsoft Original Xbox OG Xbox','Xbox 360':'Microsoft Xbox 360 X360','Dreamcast':'Sega Dreamcast DC','PC helper':'Windows desktop helper'};
const extraAliases = {
  'god-of-war-iii':['God of War 3 Remastered','GOW3'],
  'uncharted-the-nathan-drake-collection':['Uncharted 1 2 3','Drakes Fortune','Among Thieves','Drakes Deception'],
  'super-mario-sunshine':['SMS Launcher','Delfino Plaza'],
  'serious-sam-next-encounter':['SSNE','Silly ReEncounter','Silly Re Encounter'],
  'tom-clancy-s-splinter-cell-double-agent':['SCDA','SC Double Agent','Xbox Double Agent'],
  'crackdown':['Crackdown 1','Crackdown Recompiled','SkiddyToast','saulob'],
  'infamous':['inFAMOUS 2','Festival of Blood','UGC restoration server'],
  'resident-evil-code-veronica':['RECVX','Code Veronica X HD'],
  'ridge-racer-v':['Ridge Racer 5'],
  'call-of-duty-modern-warfare-2':['COD MW2 2009'],
  'the-legend-of-zelda-the-wind-waker':['Windwaker','Wind Waker','WW Recomp','BlueWake']
};
function unique(values) { return [...new Map(values.filter(Boolean).map(value => [value.toLocaleLowerCase('en'), value])).values()]; }
function enrich(entry) {
  const [genre, franchise, ...extras] = subjects[entry.id] || [entry.kind, entry.title];
  const helper = /Companion|Mod manager/i.test(entry.kind);
  return {...entry, genre, franchise,
    tags:unique([entry.tags[0],entry.platform,entry.kind,genre,franchise,'Windows',helper?'Game Tools':'Console to PC',...extras]),
    aliases:unique([...entry.aliases,...(extraAliases[entry.id]||[]),consoles[entry.platform],entry.repository?.split('/').at(-1),`${franchise} ${genre}`]),
    keywords:unique([`${entry.requestedTitle} ${helper?'PC tool':'PC port'} download`,`${entry.title} Windows download`,`${entry.requestedTitle} Windows PC`,`${franchise} PC ${helper?'tools':'ports'}`,`${genre} ${helper?'tools':'games'} on PC`,helper?'desktop game companion tools':'console games on PC',entry.platform+' to PC',entry.release?.tag])};
}
module.exports = {enrich, subjects, unique};
