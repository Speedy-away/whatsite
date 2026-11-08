const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const scope = 'ps4-user-plugin-templates';
const manifestPath = path.join(root, 'downloads/ps4/plugin-templates/manifest.json');
const definitions = [
  {id: 'gta5', name: 'GTA V', source: 'C:/Users/whatw/Desktop/GTA5 - plugins.ini', titleIds: ['CUSA00411', 'CUSA00419', 'CUSA-00880']},
  {id: 'rdr2', name: 'RDR2', source: 'C:/Users/whatw/Desktop/RDR2 - plugins.ini', titleIds: ['CUSA08519', 'CUSA-03041', 'CUSA-08568']}
];
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const esc = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
function prepare() {
  const files = definitions.map(game => {
    const bytes = fs.readFileSync(game.source), sha256 = hash(bytes);
    const local = `/downloads/ps4/plugin-templates/${game.id}/${sha256.slice(0, 12)}/plugins.ini`;
    const destination = path.join(root, '.' + local);
    if (fs.existsSync(destination)) {
      if (hash(fs.readFileSync(destination)) !== sha256) throw Error('Refusing to replace different file: ' + destination);
    } else {
      fs.mkdirSync(path.dirname(destination), {recursive: true});
      fs.writeFileSync(destination, bytes, {flag: 'wx'});
    }
    return {id: game.id, game: game.name, name: 'plugins.ini', originalName: path.basename(game.source),
      titleIds: game.titleIds, regions: ['EU', 'USA', 'JP'], version: 'User-supplied snapshot 2026-11-03',
      local, sourceUrl: 'https://whatwhatboy.com' + local, provenance: 'User-supplied desktop file; original bytes preserved.',
      bytes: bytes.length, sha256, template: true};
  });
  const existing = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files : [];
  fs.writeFileSync(manifestPath, JSON.stringify({schemaVersion: 1, files: [...files, ...existing.filter(file => !definitions.some(game => game.id === file.id))]}, null, 2) + '\n');
  return files;
}
function renderSection({game, local, regions, instructions, id = 'goldhen-plugin-template'}) {
  const {section, esc} = require('./build-console-guides.cjs');
  const labels = regions.map(([region]) => region);
  const titleIds = regions.map(([, titleId]) => titleId);
  const search = ['goldhen plugins.ini', game, ...labels, ...titleIds].join(' ').toLowerCase();
  const regionButtons = regions.map(([region, titleId]) =>
    `<span class="cod-region"><strong>${esc(region)}</strong>: <button type="button" data-copy-title-id="${esc(titleId)}" title="Copy ${esc(titleId)}" translate="no">${esc(titleId)}</button></span>`).join(' · ');
  const note = `<aside class="guide-note cod-regional-template" data-search="${esc(search)}"><p class="cod-regions">${regionButtons}</p>${instructions}</aside>`;
  const download = `<div class="guide-links"><a class="btn btn-primary" href="${esc(local)}" download="plugins.ini"><i class="fas fa-download" aria-hidden="true"></i> Download ${esc(game)} plugins.ini</a></div>`;
  return section(id, `GoldHEN plugins.ini · ${esc(game)}`, note + download, `${esc(labels.join(' / '))} title IDs`);
}

function addTitleIdCopy(html) {
  return html.includes('data-copy-title-id=') && !html.includes('/assets/cod-regional-copy.js')
    ? html.replace('</body>', '<script defer src="/assets/cod-regional-copy.js?v=1"></script></body>')
    : html;
}

function sectionFor(id) {
  const file = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files.find(file => file.id === id);
  if (!file) throw Error('Unknown game: ' + id);
  const instructions = file.plugin ? `<p>Place <code>${esc(file.plugin)}</code> in <code>/data/GoldHEN/plugins/</code>. Back up <code>/data/GoldHEN/plugins.ini</code> and merge the entry for your installed title ID into it, keeping your existing entries.</p><p>${esc(file.compatibility)}</p>` : '<p>Template with all three regional sections. Add the exact plugin filenames after <code>/data/GoldHEN/plugins/</code> and match the section to your installed game’s title ID. Merge into <code>/data/GoldHEN/plugins.ini</code>, keeping your existing entries. Plugin files are downloaded separately.</p>';
  const regions = file.regions.map((region, index) => [region, file.titleIds[index]]);
  return renderSection({game: file.game, local: file.local, regions, instructions});
}
function apply() {
  for (const {id} of definitions) {
    const destination = path.join(root, `console/mods/ps4/${id}/index.html`);
    let html = fs.readFileSync(destination, 'utf8');
    html = html.replace(/<section class="section" id="goldhen-plugin-template">[\s\S]*?<\/section>/, '');
    if (!html.includes('<div id="content">')) throw Error('Missing content container: ' + destination);
    html = html.replace('<div id="content">', () => '<div id="content">' + sectionFor(id));
    fs.writeFileSync(destination, addTitleIdCopy(html));
  }
}
async function archive() {
  const intake = require('./console-expansion-archive.cjs').createArchive();
  const files = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files.filter(file => definitions.some(game => game.id === file.id));
  const results = [];
  for (const file of files) {
    const bytes = fs.readFileSync(path.join(root, '.' + file.local));
    const result = await intake.writeBytes({scope,
      item: {id: scope + '-' + file.id, title: file.game + ' GoldHEN plugins.ini template', project: 'GoldHEN Plugin Templates',
        platform: 'PS4', category: ['Games', file.id === 'gta5' ? 'GTA5' : 'RDR2', 'Configurations'],
        pages: [`console/mods/ps4/${file.id}/index.html`], url: file.sourceUrl},
      file: {...file, archiveRole: ['Builds'], expectedSha256: file.sha256, expectedBytes: file.bytes}, bytes});
    if (hash(fs.readFileSync(result.file.backupPath)) !== file.sha256) throw Error('Archive verification failed');
    results.push(result.file);
  }
  await intake.mergeInventory({inventory: intake.inventoryPath(scope)});
  fs.writeFileSync(path.join(root, 'docs/qa/ps4-user-plugin-template-archive.json'), JSON.stringify({scope, files: results, allFilesVerified: true}, null, 2) + '\n');
  return results.map(file => ({name: file.originalName, backupPath: file.backupPath, bytes: file.bytes, sha256: file.sha256}));
}
if (require.main === module) (async () => {
  if (process.argv.includes('--prepare')) { console.log(JSON.stringify(prepare())); apply(); }
  else if (process.argv.includes('--archive')) console.log(JSON.stringify(await archive()));
  else throw Error('Use --prepare or --archive');
})().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = {renderSection, addTitleIdCopy, sectionFor, apply, prepare, archive};
