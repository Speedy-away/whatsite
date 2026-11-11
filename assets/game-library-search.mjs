// Additional title aliases and genre terms shared by the console game libraries.
const romanNumbers = ['', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi'];
const titleAliases = [
  [/\bneed for speed\b/, 'nfs'],
  [/\bneed for speed most wanted\b/, 'nfsmw'],
  [/\bneed for speed underground 2\b/, 'nfsu2'],
  [/\bneed for speed hot pursuit\b/, 'nfshp'],
  [/^assassin ?s creed\b/, 'assassinscreed'],
  [/^assassin ?s creed 2\b/, 'ac2'],
  [/^assassin ?s creed brotherhood\b/, 'acb'],
  [/^assassin ?s creed revelations\b/, 'acrev'],
  [/^assassin ?s creed 4 black flag\b/, 'ac4 ac4bf'],
  [/^gears of war\b/, 'gearsofwar'],
  [/^gears of war 2\b/, 'gears2'],
  [/^gears of war 3\b/, 'gears3'],
  [/^god of war\b/, 'gow'],
  [/^god of war 3\b/, 'gow3'],
  [/^god of war ragnarok\b/, 'gowr'],
  [/\bmetal gear solid\b/, 'mgs'],
  [/\bmetal gear solid 3\b/, 'mgs3'],
  [/\bmetal gear solid 5\b/, 'mgs5 mgsv'],
  [/\bkingdom hearts\b/, 'kh'],
  [/\bkingdom hearts 3\b/, 'kh3'],
  [/^super mario odyssey\b/, 'smo'],
  [/^animal crossing new horizons\b/, 'acnh'],
  [/^animal crossing new leaf\b/, 'acnl'],
  [/^fire emblem three houses\b/, 'fe3h'],
  [/^monster hunter generations ultimate\b/, 'mhgu'],
  [/^monster hunter 4 ultimate\b/, 'mh4u'],
  [/^monster hunter rise\b/, 'mhr'],
  [/\bpokemon\b/, 'pkmn']
];
const genreAliases = {
  RPG: 'role playing roleplaying role play',
  Platformer: 'platforming platform game',
  Simulation: 'simulator sim',
  Sports: 'sport sporting',
  Racing: 'race racing game',
  Strategy: 'strategy games',
  'Turn-Based': 'turnbased turn based',
  Fighting: 'fighter fighting games',
  Shooter: 'shooting shooter games',
  Horror: 'scary horror games'
};
const exactAliases = new Set(titleAliases.flatMap(([, terms]) => terms.split(' ')));
for (let number = 0; number <= 16; number++) {
  exactAliases.add('ff' + number);
  exactAliases.add('re' + number);
}
exactAliases.add('fps');

export function extraSearchTerms(title, genres = []) {
  const normalized = title.normalize('NFKD').toLowerCase().replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const numbered = normalized.replace(/\b(xvi|xiv|xiii|xii|xi|xv|ix|viii|vii|vi|iv|iii|ii|x|v|i)\b/g, numeral => romanNumbers.indexOf(numeral));
  const terms = titleAliases.filter(([pattern]) => pattern.test(numbered)).map(([, aliases]) => aliases);
  const finalFantasy = numbered.match(/\bfinal fantasy (\d{1,2})\b/);
  const residentEvil = numbered.match(/\b(?:resident evil|biohazard) (\d{1,2})\b/);
  if (finalFantasy) terms.push('ff' + finalFantasy[1]);
  if (residentEvil) terms.push('re' + residentEvil[1]);
  terms.push(...genres.map(genre => genreAliases[genre] || ''));
  if (genres.includes('Shooter') && genres.includes('First-Person')) terms.push('fps first person shooter');
  return terms.filter(Boolean).join(' ');
}

export function matchesSearchTerm(search, term) {
  const value = term.trim();
  return exactAliases.has(value) ? (' ' + search + ' ').includes(' ' + value + ' ') : search.includes(term);
}
