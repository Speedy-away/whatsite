'use strict';
let cachedEntries;
const normalized = value => String(value).normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
function termsForCard(file, card, title) {
  if (!file.startsWith('console/mods/ps4/')) return [];
  cachedEntries ||= require('./console-mod-catalog.cjs').catalog().entries.filter(entry => entry.keywords.length);
  const directory = file === 'console/mods/ps4/menus.html';
  const multicod = file === 'console/mods/ps4/call-of-duty/multicod/index.html';
  const pagePath = '/' + file.replace(/index\.html$/, '');
  const directoryGame = card.match(/^<\w+\b[^>]*\bdata-catalog-game="([^"]+)"/)?.[1];
  const candidates = cachedEntries.filter(entry => (directory && (!directoryGame || entry.gameId === directoryGame)) ||
    (multicod && entry.url.includes('/call-of-duty/')) || (!directory && entry.url.split('#')[0] === pagePath));
  const id = card.match(/^<\w+\b[^>]*\bid="resource-([^"]+)"/)?.[1]?.replace(/-legacy$/, '');
  const name = normalized(title);
  let matches = id ? candidates.filter(entry => entry.id === id || 'bo3-' + entry.id === id) : [];
  if (!matches.length) matches = candidates.filter(entry => normalized(entry.name) === name);
  // A few established cards shorten the documented label (North / North Beta).
  if (!matches.length && name.length >= 4) {
    const shortened = candidates.filter(entry => normalized(entry.name).startsWith(name + ' '));
    if (shortened.length === 1) matches = shortened;
  }
  return matches.flatMap(entry => entry.keywords);
}
module.exports = {termsForCard};
