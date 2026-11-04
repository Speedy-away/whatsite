// Search subjects only: no game, platform, region or firmware compatibility inference.
const concepts=[
 ['Game Mods',['mods','game mods','modifications'],/\b(?:mods?|modifications?)\b/i],
 ['Mods / Mod Menus',['mod menus','mod menu'],/\bmod menus?\b/i],
 ['Cheats & Mods',['cheats'],/\bcheats?\b/i],
 ['Emulators',['emulators','emulator','emulation'],/\bemulat(?:ors?|ion)\b/i],
 ['Themes',['themes','theme'],/\bthemes?\b/i],
 ['Apps',['apps','applications'],/\b(?:apps?|applications?)\b/i],
 ['Tools',['tools','utilities'],/\b(?:tools?|utilities)\b/i],
 ['Guides',['guides','guide'],/\bguides?\b/i],
 ['Downloads',['downloads'],/\bdownloads?\b/i],
 ['Game Downloads',['game downloads'],/\bgame downloads?\b/i],
 ['Game patches',['game patches','patches'],/\b(?:game )?patch(?:es)?\b/i],
 ['Save tools',['save tools','save backups'],/\bsave (?:tools?|backups?|restore)\b/i],
 ['Source Code',['source code','source archives'],/\bsource (?:code|archives?)\b/i],
 ['Free shops',['free shops','free shop','freeshop'],/\b(?:free[ -]?shops?|freeshops?)\b/i],
 ['Setup instructions',['setup instructions','setup'],/\bsetup(?: instructions)?\b/i],
 ['Firmware',['firmware'],/\bfirmware\b/i],
 ['Jailbreak',['jailbreak'],/\bjailbreak\b/i],
 ['Multiplayer',['multiplayer'],/\bmultiplayer\b/i]
].map(([key,aliases,pattern])=>({key,aliases,pattern}));
function translations(table){
 const result={};
 for(const {key,aliases}of concepts){
  if(!table[key])throw Error('Discovery translation missing: '+key);
  for(const alias of aliases){
   result[alias]={...table[key]};
   // Keyword phrases preserve the complete named subject literally.
   result['{name} '+alias]=Object.fromEntries(Object.entries(table[key]).map(([code,value])=>[code,'{name} '+value]));
  }
 }
 return result;
}
module.exports={concepts,translations};
