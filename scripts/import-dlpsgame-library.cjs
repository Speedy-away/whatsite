'use strict';

// Import factual metadata and public file-host links from saved WordPress
// category snapshots. Preserve original listing and published download pages.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {decode} = require('./localized-html.cjs');
const {shard} = require('./import-playstation-library.cjs');

const root = path.resolve(__dirname, '..');
const imagePath = '/assets/images/playstation-library/dlpsgame/';
const digest = value => createHash('sha256').update(value).digest('hex');
const coverKey = url => digest(url).slice(0, 20);
const plain = value => decode(String(value || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const distinct = items => [...new Set(items.filter(Boolean))];
const compact = row => Object.fromEntries(Object.entries(row).filter(([,v]) => v !== undefined && v !== '' && (!Array.isArray(v) || v.length)));
const signedQuery = /^(?:token|expires|signature|sig|hm|x-amz-.+|auth|key-pair-id)$/i;
const legacyPlatforms = new Set(['PS2', 'PS3', 'PSP', 'PS Vita']);
const handheld = platform => platform === 'PSP' || platform === 'PS Vita';
const titleIdsByPlatform = {
  PS2: /\b(?:SLUS|SCUS|SLES|SCES|SLPS|SLPM|SCPS|SLAJ|SCAJ)[ _-]?\d{3}\.?\d{2}\b/gi,
  PS3: /\b(?:BL[AEJKU][SM]|BC[AEJKU][SM]|NP[AEJU][ABD])[\s-]?\d{5}\b/gi,
  PSP: /\b(?:UL[AEJUK][MS]|UC[AEJUK][MS]|NP[AEJU][GH])[\s-]?\d{5}\b/gi,
  'PS Vita': /\bPCS[A-I][\s-]?\d{5}\b/gi
};
const modernTitleIds = /\b(?:CUSA|PPSA)\d{5}\b/gi;
const extractTitleIds = (text, platform) => distinct(
  (text.match(titleIdsByPlatform[platform] || modernTitleIds) || [])
    .map(id => id.toUpperCase().replace(/[ ._-]/g, ''))
);
const regionPattern = /\b(USA|EUR|JPN|JAPAN|ASIA|UK|EU|US)\b/;
const hosts = new Set([
  '1fichier.com', 'akirabox.com', 'akirabox.to', 'archive.org', 'buzzheavier.com',
  'datanodes.to', 'datavaults.co', 'drive.google.com', 'filecrypt.cc', 'filecrypt.co',
  'fileditchfiles.st', 'filekeeper.net', 'gofile.io', 'itsfileditchfiles.st', 'link-vault.org',
  'mediafire.com', 'mega.co.nz', 'mega.nz', 'mocha.my', 'pixeldrain.com', 'qiwi.gg',
  'ranoz.gg', 'rapidgator.net', 'rootz.so', 'terabox.com', 'transfer.it',
  'vik1ngfile.site', 'vikingfile.com', '1cloudfile.com'
]);

function webUrl(value, base) {
  try {
    const url = new URL(decode(decode(value || '')), base);
    return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url : null;
  } catch { return null; }
}

function coverSource(post) {
  const body = post.content?.rendered || '';
  const img = /<img\b[^>]*\bsrc=["']([^"']+)["']/i.exec(body)?.[1];
  if (!img) return '';
  const url = webUrl(img, post.link);
  if (!url || !/(?:^|\.)(?:dlpsgame\.com|downloadgamepsp\.org|googleusercontent\.com|blogspot\.com|imgur\.com|postimg\.cc|ibb\.co)$/i.test(url.hostname)) return '';
  url.protocol = 'https:';
  url.hash = '';
  return url.href;
}

function downloadPage(url) {
  return url.hostname.replace(/^www\./, '') === 'downloadgameps3.net' && /^\/archives\/\d+\/?$/.test(url.pathname);
}

function listingPage(value, platform) {
  const url = webUrl(value);
  const expectedHost = handheld(platform) ? 'downloadgamepsp.org' : 'dlpsgame.com';
  return url && url.hostname.replace(/^www\./, '') === expectedHost && url.pathname !== '/' &&
    !url.search && !url.hash ? url.href : '';
}

function fileHost(value) {
  const url = webUrl(value);
  if (!url || (!hosts.has(url.hostname.toLowerCase().replace(/^www\./, '')) && !downloadPage(url))) return '';
  if (url.pathname === '/' && !url.search && !url.hash) return '';
  if ([...url.searchParams.keys()].some(key => signedQuery.test(key))) return '';
  if (/\/(?:login|register|terms|privacy|contact|support|help|premium|upload)\/?$/i.test(url.pathname)) return '';
  return url.href;
}

function region(text) {
  const value = regionPattern.exec(text)?.[1].toUpperCase();
  return {US:'USA', EU:'EUR', JAPAN:'JPN'}[value] || value || '';
}

function kind(text) {
  const isGame = /\b(?:base|game)\b/i.test(text);
  const isUpdate = /\b(?:update|patch)\b/i.test(text);
  const isDlc = /\b(?:dlc|add-on|add ons?)\b/i.test(text);
  if (isGame && (isUpdate || isDlc)) return 'bundle';
  if (isDlc) return 'dlc';
  if (isUpdate) return /\bpatch\b/i.test(text) ? 'patch' : 'update';
  if (isGame) return 'base';
  if (/\b(?:fix|backport)\b/i.test(text)) return 'fix';
  return 'other';
}

function parseLinks(post, platform) {
  // This attribute is the plaintext content encoded for the public site's
  // spoiler widget. Parse the data only and never execute its markup or scripts.
  const body = post.content.rendered
    .replace(/<div\b[^>]*\bdata-payload=["']([A-Za-z0-9+/=\r\n]+)["'][^>]*>[\s\S]*?<\/div>/gi,
      (_, payload) => Buffer.from(payload, 'base64').toString('utf8'))
    .replace(/<!--[\s\S]*?-->|<(script|style|blockquote|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<div\b[^>]*class=["'][^"']*\bsu-spoiler-title\b[^"']*["'][^>]*>/gi, '\n@release-section@\n');
  const anchors = [];
  const lines = body.replace(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, url, html) => {
    const id = anchors.push({url, text:plain(html)}) - 1;
    return ' @link' + id + '@ ';
  }).replace(/<\/?(?:p|br|li|tr|div|h[1-6])\b[^>]*>/gi, '\n').split(/\r?\n/).map(plain).filter(Boolean);
  const files = new Map(), ids = new Set(), regions = new Set(), notes = new Set();
  let currentId = '', currentRegion = '';
  for (const line of lines) {
    if (line === '@release-section@') { currentId = ''; currentRegion = ''; continue; }
    const references = [...line.matchAll(/@link(\d+)@/g)];
    const context = line.replace(/@link\d+@/g, '').trim();
    const idsHere = extractTitleIds(context, platform);
    idsHere.forEach(value => ids.add(value));
    if (idsHere.length) {
      currentId = idsHere.length === 1 ? idsHere[0] : '';
      currentRegion = region(context);
      if (currentRegion) regions.add(currentRegion);
    }
    if (/^(?:Voice|Screen Languages|Works on|Requires firmware|Minimum firmware|Credits|Size)\b/i.test(context)
      && context.length <= 260 && !references.length && !/https?:/i.test(context)) notes.add(context);
    if (!references.length) continue;
    const prefix = line.slice(0, references[0].index).trim();
    const release = prefix.split(':', 1)[0].trim();
    for (const ref of references) {
      const anchor = anchors[Number(ref[1])];
      const url = fileHost(anchor.url);
      if (!url || !anchor.text || /^(?:guide|how to|download tool|trailer|tutorial)\b/i.test(anchor.text)) continue;
      const [anchorId] = extractTitleIds(anchor.text, platform);
      const titleId = anchorId || currentId;
      if (titleId) ids.add(titleId);
      const label = /\b(?:game|base|update|patch|dlc|fix|backport|part\s*\d+)\b/i.test(release)
        ? release : anchor.text;
      const versionContext = label.split(/\b(?:fix|backport|firmware|fw)\b/i)[0];
      const version = /\bv(\d+(?:\.\d+){1,3})\b/i.exec(versionContext)?.[1] ||
        /\b(?:update|patch)\s*\(?(\d+(?:\.\d+){1,3})(?![\d.+])/i.exec(versionContext)?.[1];
      const firmware = /\b(?:fix|backport|firmware|fw)\s+(\d[\dx.+/]*(?:\s*\/\s*\d[\dx.+/]*)*)/i.exec(label)?.[1] ||
        /\((\d+(?:\.[\dx]+)+\+)\)/i.exec(label)?.[1];
      const pkg = compact({url, label:label.slice(0,180), kind:kind(label), titleId,
        region:region(label) || currentRegion, version, firmware, landing:downloadPage(new URL(url)) || undefined});
      if (pkg.region) regions.add(pkg.region);
      const key = digest(JSON.stringify(pkg)).slice(0,16);
      if (!files.has(key)) files.set(key,{id:key,...pkg});
    }
  }
  return {files:[...files.values()], titleIds:[...ids], regions:[...regions], notes:[...notes].join('\n')};
}

function readCatalog(directory) {
  const index = JSON.parse(fs.readFileSync(path.join(directory,'index.json'),'utf8'));
  const details = Array.from({length:32}, (_, i) => {
    const name = i.toString(16).padStart(2, '0') + '.json';
    const modern = JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
    const legacy = path.join(directory, 'legacy', name);
    return fs.existsSync(legacy) ? {...modern, ...JSON.parse(fs.readFileSync(legacy, 'utf8'))} : modern;
  });
  return {index,details};
}

function mergeSnapshots(snapshots,{index,details},hasCover) {
  const existing = new Map(index.titles.map((game,i)=>[game.id,i]));
  const totals = {};
  for (const [platform,posts] of Object.entries(snapshots)) {
    const legacy = legacyPlatforms.has(platform);
    if ((!legacy && !['PS4','PS5'].includes(platform)) || !Array.isArray(posts) || !posts.length) throw Error('Invalid platform snapshot');
    const provider = handheld(platform) ? 'DownloadGamePSP' : 'DLPSGame';
    const counts = {listings:0,covers:0,withLinks:0,links:0};
    totals[platform] = counts;
    for (const post of posts) {
      const name = plain(post.title?.rendered);
      if (!Number.isSafeInteger(post.id) || !name || typeof post.content?.rendered !== 'string') throw Error('Invalid catalog entry');
      const page = listingPage(post.link, platform);
      if (legacy && !page) throw Error('Unexpected listing page: ' + post.link);
      const id = digest(provider.toLowerCase() + ':' + platform + ':' + post.id).slice(0,16);
      const {files,titleIds,regions,notes} = parseLinks(post, platform);
      const image = coverSource(post);
      const cover = image && hasCover(coverKey(image)) ? imagePath + coverKey(image) + '.jpg' : legacy ? image : '';
      const date = /^\d{4}-\d{2}-\d{2}T/.test(post.modified_gmt || '') ? post.modified_gmt + 'Z' : '';
      const facets = distinct(files.map(file=>(file.region || 'Unspecified')+':'+file.kind));
      const title = compact({id,name,platform,cover,titleIds,count:files.length,facets,
        regions:distinct([...regions,...facets.map(facet=>facet.split(':')[0])]),date,source:provider});
      const bucket = details[parseInt(shard(id),16)];
      const detail = {...compact({name,platform,cover,titleIds,date,source:provider,notes,page}),files};
      if (existing.has(id)) {
        if (bucket[id]?.source !== provider) throw Error('Conflicting catalog ID '+id);
        const position = existing.get(id);
        // Keep older mirrors when a later snapshot omits them.
        const retained = new Map([...bucket[id].files,...files].map(file=>[file.id,file]));
        detail.files = [...retained.values()];
        if (!detail.page && bucket[id].page) detail.page = bucket[id].page;
        const old = index.titles[position];
        if (!title.cover && old.cover) detail.cover = title.cover = old.cover;
        title.titleIds = detail.titleIds = distinct([...(old.titleIds||[]),...titleIds]);
        title.count = detail.files.length;
        title.facets = distinct([...(old.facets||[]),...facets]);
        title.regions = distinct([...(old.regions||[]),...(title.regions||[])]);
        index.titles[position] = compact(title);
      } else {
        existing.set(id,index.titles.length);
        index.titles.push(title);
      }
      bucket[id] = {...compact(detail),files:detail.files};
      counts.listings++;
      if (title.cover) counts.covers++;
      if (detail.files.length) counts.withLinks++;
      counts.links += detail.files.length;
    }
  }
  index.revision = digest(JSON.stringify(details)).slice(0,16);
  const {PSP, 'PS Vita': vita, ...dlpsgame} = totals;
  index.stats = {...index.stats,titles:index.titles.length,links:index.titles.reduce((count,game)=>count+game.count,0),
    dlpsgame:{...index.stats?.dlpsgame,...dlpsgame}};
  if (PSP || vita) index.stats.downloadgamepsp = {...index.stats.downloadgamepsp, ...(PSP && {PSP}), ...(vita && {'PS Vita':vita})};
  return {index,details,totals};
}

function writeCatalog(directory,{index,details}) {
  const legacyDirectory = path.join(directory, 'legacy');
  for (const [i, bucket] of details.entries()) {
    const name = i.toString(16).padStart(2, '0') + '.json';
    const modern = [], legacy = [];
    for (const [id, record] of Object.entries(bucket)) {
      const rows = legacyPlatforms.has(record.platform) ? legacy : modern;
      rows.push(JSON.stringify(id) + ':' + JSON.stringify(record));
    }
    fs.writeFileSync(path.join(directory, name), '{\n' + modern.join(',\n') + '\n}\n');
    if (legacy.length) {
      fs.mkdirSync(legacyDirectory, {recursive:true});
      fs.writeFileSync(path.join(legacyDirectory, name), '{\n' + legacy.join(',\n') + '\n}\n');
    }
  }
  const {titles,...metadata} = index;
  fs.writeFileSync(path.join(directory,'index.json'),JSON.stringify(metadata).slice(0,-1)+
    ',\n"titles":[\n'+titles.map(game=>JSON.stringify(game)).join(',\n')+'\n]}\n');
}

module.exports = {coverSource,coverKey,fileHost,parseLinks,readCatalog,mergeSnapshots,writeCatalog};
if (require.main === module) {
  const args = process.argv.slice(2);
  const platforms = args[0] === '--legacy' ? (args.shift(), [...legacyPlatforms]) : ['PS4', 'PS5'];
  if (args.length !== platforms.length) throw Error('Usage: node scripts/import-dlpsgame-library.cjs <PS4.json> <PS5.json> or --legacy <PS2.json> <PS3.json> <PSP.json> <PSVita.json>');
  const input = Object.fromEntries(platforms.map((platform, i) => [platform, JSON.parse(fs.readFileSync(args[i],'utf8'))]));
  const directory = path.join(root,'assets/playstation-library');
  const merged = mergeSnapshots(input,readCatalog(directory),key=>fs.existsSync(path.join(root,imagePath.slice(1),key+'.jpg')));
  writeCatalog(directory,merged);
  console.log(JSON.stringify(merged.index.stats,null,2));
}
