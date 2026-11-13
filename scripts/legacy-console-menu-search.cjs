'use strict';
// Search-only adapters for the reviewed PS3 and Xbox 360 catalogues.
// Never derive game support, HEN/DEX variants or download availability from a page path.
const {plain, mainContent} = require('./page-metadata-content.cjs');
const {unique} = require('./console-resource-tags.cjs');
const kinds = {
  sprx: 'SPRX mod menu', loader: 'mod loader', script: 'mod script', rtm: 'RTM tool',
  eboot: 'EBOOT variant', texture: 'texture tool', 'developer-menu': 'developer menu',
  'mod-menu': 'mod menu', 'patch-menu': 'patch menu', 'desktop-helper': 'desktop helper',
  tool: 'mod tool', savegame: 'save resource'
};
const cached = new Map();
const normalize = value => plain(value).normalize('NFKC').toLowerCase();
const pageFile = url => url.replace(/^\//, '').replace(/\/$/, '/index.html');
function platformFor(file) {
  return /^console\/(ps3|xbox360)\/mods(?:\.html|\/.*\.html)$/.exec(file)?.[1] || null;
}
function catalogue(platform) {
  if (cached.has(platform)) return cached.get(platform);
  let data;
  if (platform === 'ps3') {
    const source = require('./build-ps3-catalog.cjs');
    data = {games: source.games.map(game => ({...game, page: pageFile(game.url)})), resources: source.data().resources};
  } else {
    const source = require('./console-mod-navigation.cjs').xbox(require('../docs/discord-xbox360-resources.json'));
    const archives = require('../docs/xbox360-mod-resources.json');
    data = {games: source.games.map(game => ({...game, page: pageFile(game.page)})), resources: [...source.resources, ...archives.resources]};
  }
  data.resources = data.resources.filter(item => kinds[item.category]);
  data.byId = new Map(data.resources.map(item => [item.id, item]));
  cached.set(platform, data);
  return data;
}
function resourceForCard(file, card, title) {
  const platform = platformFor(file);
  if (!platform) return null;
  const data = catalogue(platform);
  const id = card.match(/^<article\b[^>]*\bid="([^"]+)"/)?.[1];
  let item = id && data.byId.get(id);
  if (!item) {
    const matches = data.resources.filter(item => normalize(item.name) === normalize(title));
    // Four preserved COD4 archive cards have no ID; their exact download path identifies them.
    item = matches.find(item => item.archive?.local && card.includes('href="' + item.archive.local + '"'));
    if (!item && matches.length === 1) item = matches[0];
  }
  if (!item) return null;
  const pageGame = data.games.find(game => game.page === file);
  const supported = unique([item.gameId, ...(item.gameIds || [])]);
  // Some Xbox pages deliberately show a resource to explain a source mismatch.
  if (pageGame && item.referenceGameIds?.includes(pageGame.id) && !supported.includes(pageGame.id)) return null;
  return {platform, data, item, id};
}
function searchTerms(record, card) {
  const {platform, data, item} = record;
  const label = platform === 'ps3' ? 'PS3' : 'Xbox 360';
  const longLabel = platform === 'ps3' ? 'PlayStation 3' : 'Xbox360';
  const name = item.name, kind = kinds[item.category];
  const supportedIds = unique([item.gameId, ...(item.gameIds || [])]);
  const games = data.games.filter(game => supportedIds.includes(game.id) && game.kind !== 'collection' && !['tools', 'stealth-servers'].includes(game.id));
  const gameNames = unique(games.flatMap(game => [game.title, game.short,
    ...(game.aliases || []).filter(alias => !/^(?:\d|BL[EU]S|BC[EU]S|NP[EU]B|GSC$|SPRX$|debug menu$|developer menu$)/i.test(alias))]));
  const anchors = [...card.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
  const hasDownload = anchors.some(([, attributes, body]) => /\sdownload(?:\s|=|$)/.test(attributes) ||
    /href="\/downloads\//.test(attributes) || /\b(?:download|original .+ file)\b/i.test(plain(body)));
  const hasGuide = /\bdata-guide-open\b/.test(card);
  const hasSteps = hasGuide && item.guideBlocks?.some(block => block.type === 'steps');
  const hasControls = hasGuide && (item.controls?.length || item.guideBlocks?.some(block => /controls|opening/i.test(block.title || '')));
  const variants = platform === 'ps3' ? unique([
    ...(item.tags || []).filter(tag => /^(?:HEN|DEX|CEX|CFW)$/i.test(tag)),
    ...(item.downloads || []).flatMap(download => String(download.label || '').match(/\b(?:HEN|DEX|CEX|CFW)\b/g) || []),
    ...(require('./ps3-multicod-metadata.cjs').entryForResource(item)?.variants || [])
      .flatMap(variant => String(variant.label).match(/\b(?:HEN|DEX|CEX|CFW)\b/g) || [])
  ]) : [];
  return unique([name, `${name} ${label}`, `${name} ${longLabel}`, `${name} ${kind}`,
    ...gameNames.map(game => `${name} ${game}`),
    ...(hasDownload ? [`${name} download`, `${name} downloads`, `download ${name}`, `${name} ${label} download`] : []),
    ...(hasGuide ? [`${name} guide`, `${name} setup`, `${name} requirements`] : []),
    ...(hasSteps ? [`${name} installation guide`, `how to install ${name}`] : []),
    ...(hasControls ? [`${name} controls`, `how to open ${name}`] : []),
    ...variants.flatMap(variant => [`${name} ${variant}`, ...(hasDownload ? [`${name} ${variant} download`] : [])]),
    ...(hasDownload ? [item.archive?.filename, ...(item.downloads || []).map(download => download.filename)] : [])
  ]);
}
function termsForCard(file, card, title) {
  const record = resourceForCard(file, card, title);
  return record ? searchTerms(record, card) : [];
}
function recordsForPage(file, html) {
  const records = [];
  if (!platformFor(file)) return records;
  const canonical = html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
  for (const match of mainContent(html).matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)) {
    const card = match[0], title = plain(card.match(/<h[234]\b[^>]*>([\s\S]*?)<\/h[234]>/)?.[1] || '');
    const record = resourceForCard(file, card, title);
    if (!record) continue;
    records.push({id: record.item.id, name: record.item.name, platform: record.platform,
      url: canonical + (record.id ? '#' + record.id : ''), keywords: searchTerms(record, card)});
  }
  return records;
}
function metadataForPage(file, html) {
  const platform = platformFor(file);
  if (!platform || /<meta[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html) || /http-equiv="refresh"/.test(html)) return null;
  const label = platform === 'ps3' ? 'PS3' : 'Xbox 360';
  const data = catalogue(platform), game = data.games.find(game => game.page === file);
  if (game?.id === 'stealth-servers') return null;
  const items = recordsForPage(file, html);
  const gameTitle = game?.title || (/\/call-of-duty\//.test(file) ? 'Call of Duty' : '');
  return {
    title: plain(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || `${label} Mod Menus`),
    description: plain(html.match(/<meta name="description" content="([^"]*)"/)?.[1] || `${label} menu downloads, guides and compatibility requirements.`),
    keywords: unique([`${label} mod menus`, `${label} mod menu downloads`, `${label} mod menu guides`,
      ...(gameTitle ? [`${gameTitle} ${label} mods`, `${gameTitle} ${label} menus`, `${gameTitle} ${label} downloads`, `${gameTitle} ${label} guides`] : [])]),
    searchKeywords: unique([...items.map(item => item.name), ...items.flatMap(item => item.keywords)]),
    exactKeywords: true, type: 'CollectionPage', items: items.length ? items : undefined
  };
}
module.exports = {platformFor, catalogue, resourceForCard, termsForCard, recordsForPage, metadataForPage};
