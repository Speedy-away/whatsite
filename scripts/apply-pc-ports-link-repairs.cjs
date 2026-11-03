const fs = require('node:fs');
const path = require('node:path');
const {enrich, unique} = require('./pc-ports-keywords.cjs');
const root = path.resolve(__dirname, '..');
function apply() {
  const catalogFile = path.join(root, 'docs/pc-ports.json');
  const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8'));
  const repairs = JSON.parse(fs.readFileSync(path.join(root, 'docs/pc-ports-link-repairs.json'), 'utf8'));
  for (const fix of repairs.entries) {
    const entry = catalog.entries.find(e => e.id === fix.id);
    if (!entry || !fix.download || fix.download.sha256 !== fix.download.upstreamSha256) throw Error('Unverified repair ' + fix.id);
    const old = {...entry};
    entry.originalRequirements ||= old.requirements;
    if (old.release && old.release.tag !== fix.tag) entry.requestedRelease ||= old.release;
    if (fix.id === 'super-mario-sunshine' || fix.id === 'crackdown') {
      entry.originalSource ||= old.source;
      entry.source = fix.source;
      entry.repository = fix.source;
    }
    entry.availability = 'release';
    entry.release = {tag:fix.tag,url:fix.release,prerelease:false};
    entry.download = fix.download;
    entry.archiveStatus = 'downloaded';
    if (fix.id === 'super-mario-sunshine') {
      entry.kind = 'Launcher';
      entry.originalLinkStatus = 'Former TekRantGaming repository returned HTTP 404';
      entry.summary = 'SMS Launcher by chasem-dev sets up the native Sunshine port from your own disc image.';
      entry.requirements = '64-bit Windows and an internet connection for setup. Use your own North American Super Mario Sunshine disc, GMSE01 revision 0, as ISO, NKit ISO, GCM or Dolphin CISO. The launcher prepares the game locally; no disc image is included.';
      entry.deliveryNote = 'Working alternative: SMS Launcher v0.1.68 portable Windows executable. This replaces the unavailable TekRantGaming link; it is a different project, clearly identified here.';
    } else if (fix.id === 'serious-sam-next-encounter') {
      entry.summary = 'Original Silly ReEncounter public launcher and build kit for Serious Sam: Next Encounter.';
      entry.requirements = 'Original public package: GameCube USA G3BE9G, Windows 10/11 64-bit and OpenGL 3.3. It builds from your own disc and downloads its compiler on first setup. This package is not the later update-tag engine.';
      entry.deliveryNote = 'The requested update tag has notes but no attached build. The working download is explicitly pinned to the original recomp tag. Later update notes, including PAL support, are kept separate and are not applied to this USA package.';
    } else if (fix.id === 'tom-clancy-s-splinter-cell-double-agent') {
      entry.summary = 'Original Xbox Double Agent through the publisher’s downloadable V3 Windows package.';
      entry.requirements = 'V3 Windows x64 package for the original Xbox game. Provide your own extracted default.xbe, sc4_adv.xbe and the Default, Media and adv folders. Follow V3 installation instructions; this is not the Xbox 360/PC edition of Double Agent.';
      entry.deliveryNote = 'V2 remains linked as the originally requested release. Its build attachment is absent; the working download is explicitly labelled V3 rather than silently substituted as V2.';
    } else if (fix.id === 'crackdown') {
      entry.summary = 'Downloadable Crackdown Recompiled Windows alternative maintained by saulob.';
      entry.requirements = 'Xbox 360 original retail disc without a title update (TU0), title ID 4D5307DC. Default.xex: 14,270,464 bytes, SHA-256 7AAA7A8920D1C3C737E58CF583DEBAFE6013BE0A96BEC3EC136E5DE7E3377E5A. Requires all 196 game files (6,555,220,594 bytes), Windows 10/11 x64 and DirectX 12.';
      entry.deliveryNote = 'Working alternative: saulob’s Crackdown Recompiled v0.6.2. The original SkiddyToast source-build project remains linked separately. Its SDK 0.2.2 source-build requirement is not applied to this alternative package.';
    }
  }
  catalog.entries = catalog.entries.map(enrich);
  fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 2) + '\n');
  const metadataFile = path.join(root, 'docs/seo/search-editorial-overrides.json');
  const metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
  metadata['pc/ports.html'] = {...metadata['pc/ports.html'],keywords:unique(['PC ports','console games on PC','Bloodborne PC port','Windows game ports',...catalog.entries.map(e=>e.tags[0]),...catalog.entries.map(e=>`${e.title} Windows download`),'console recompilations','GameCube PC ports','PlayStation PC ports','Xbox PC ports','Racing','3D platformer','Action RPG','Stealth','Survival horror','Fighting','Open-world games','JRPG','Flight combat','Soulslike','SMS Launcher','Silly ReEncounter','SCDA V3','Crackdown Recompiled','Windwaker','ReRAC','BlueWake','OpenJade','Pokemon Snap','Deaf Jam Fight for NY'])};
  fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2) + '\n');
  return {repaired:repairs.entries.length,downloads:catalog.entries.filter(e=>e.download).length,tags:catalog.entries.reduce((n,e)=>n+e.tags.length,0),keywords:catalog.entries.reduce((n,e)=>n+e.keywords.length,0)};
}
module.exports = {apply};
if (require.main === module) console.log(JSON.stringify(apply()));
