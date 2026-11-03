// Intake only: release files are read and hashed, never executed or mirrored into the site.
const fs = require('node:fs');
const {createArchive} = require('./console-expansion-archive.cjs');
async function main(input = process.argv[2]) {
  if (!input) throw Error('Pass a prepared intake JSON file');
  const data = JSON.parse(fs.readFileSync(input, 'utf8'));
  const archive = createArchive(), scope = 'pc-game-mods-expansion';
  for (const entry of data.entries.filter(row => row.download)) {
    const game = data.games.find(row => row.id === entry.game), file = entry.download;
    const archived = await archive.archiveFile({scope,
      item: {id: scope + '-' + entry.id, title: entry.title, platform: 'PC', project: entry.id,
        url: entry.source, category: ['Games', game.title, 'Mods'], pages: ['mods/' + game.id + '.html']},
      file: {name: file.name, sourceUrl: file.sourceUrl, version: entry.version,
        expectedBytes: file.bytes, expectedSha256: file.sha256, compatibility: entry.compatibility,
        archiveRole: entry.kind === 'Mod manager' ? ['Helpers', 'Windows'] : ['Builds']},
      sourceFile: file.staging});
    entry.download = {...archived.publicFile, upstreamSha256: file.upstreamSha256, upstreamSha512: file.upstreamSha512};
    console.log('Archived ' + entry.id);
  }
  // Public metadata deliberately excludes private filesystem locations.
  fs.writeFileSync('docs/pc-game-mods.json', JSON.stringify(data, null, 2) + '\n');
  const result = await archive.mergeInventory({inventory: archive.inventoryPath(scope)});
  console.log(JSON.stringify(result));
}
module.exports = {main};
if (require.main === module) main().catch(error => {console.error(error); process.exitCode = 1;});
