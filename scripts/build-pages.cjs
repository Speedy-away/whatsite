'use strict';
// Stage Pages independently of the complete, version-preserving Git archive.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {publishAds} = require('./site-ads.cjs');
const ROOT = path.resolve(__dirname, '..');
const LIMIT = 900 * 1024 * 1024;
// The library’s theme and share preview should load from the published site.
const libraryArtwork = new Set([
  'xmb-wave.svg', 'xmb-wave-dark.svg', 'share-black-wave-v1.png',
  'bloodborne.webp', 'god-of-war-iii.webp', 'astro-bot.png'
].map(name => 'assets/images/playstation-library/' + name).concat('assets/images/wwbsgames.svg'));
const legacyLibraryShard = /^assets\/playstation-library\/legacy\/([a-f0-9]{2})\.json$/;
const encodePath = name => name.split('/').map(encodeURIComponent).join('/');
function rawURL(name, revision = 'main') {
  if (!/^(?:main|[a-f0-9]{40})$/.test(revision)) throw Error('Invalid repository revision');
  return 'https://raw.githubusercontent.com/Speedy-away/whatsite/' + revision + '/' + encodePath(name);
}
function eligible(name) {
  // Native host runtimes now belong to the independent WWB-HOST repository.
  // Main-site /hosts pages are small compatibility redirects only.
  if (name.startsWith('hosts/runtime/')) return false;
  return (/^(?:downloads|hosts\/runtime)\//.test(name) || !name.split('/').some(p => p.startsWith('.'))) &&
    !/^(?:docs\/i18n|languages\/pages)(?:\/|$)/.test(name) &&
    !/^(?:scripts|i18n-tools|design-references)\//.test(name) &&
    !/^docs\/(?:qa|screenshots|host-reviews)\//.test(name) &&
    !/^(?:AGENTS\.md|SYNC\.md|sync\.ps1|skills-lock\.json)$/.test(name);
}
function treeFiles(root) {
  if (process.env.PAGES_TREE_MANIFEST) {
    const data=JSON.parse(fs.readFileSync(process.env.PAGES_TREE_MANIFEST,'utf8'));
    if(process.env.GITHUB_SHA && data.revision!==process.env.GITHUB_SHA)throw Error('Pages metadata belongs to a different commit');
    const sizes=new Map(data.files.map(file=>{if(!Number.isSafeInteger(file.bytes)||file.bytes<0)throw Error('Invalid repository file size');return [file.name,file.bytes];}));
    return {names:[...sizes.keys()],sizes};
  }
  const entries = execFileSync('git', ['ls-tree', '-r', '-l', '-z', 'HEAD'], {cwd:root,maxBuffer:64*1024*1024}).toString().split('\0').filter(Boolean);
  const sizes = new Map(entries.map(entry => {const at=entry.indexOf('\t');return [entry.slice(at+1),Number(entry.slice(0,at).trim().split(/\s+/).at(-1))];}));
  return {names:[...sizes.keys()],sizes};
}
function materialize(root, result) {
  const names = result.files.filter(file => !result.offloaded.has(file.name)).map(file => '/' + file.name.replace(/[\\*?\[\]]/g, match => '\\' + match));
  execFileSync('git', ['sparse-checkout', 'set', '--no-cone', '--stdin'], {cwd:root,input:['/scripts/','/docs/','/languages/pages/','/i18n-tools/transfer-guide-source.json',...names].join('\n')+'\n',maxBuffer:64*1024*1024});
}
function materializeLocaleSources(root) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/i18n/page-translations.json'), 'utf8'));
  const sources = manifest.pages.map(require('./playstation-library-routes.cjs').moveTranslation).map(page => '/' + page.page.replace(/[\\*?\[\]]/g, match => '\\' + match));
  execFileSync('git', ['sparse-checkout', 'set', '--no-cone', '--stdin'], {cwd:root,input:['/scripts/','/docs/','/languages/','/i18n-tools/transfer-guide-source.json',...sources].join('\n')+'\n',maxBuffer:64*1024*1024});
}
function sourceLinks(root) {
  const file=path.join(root,'docs/download-source-links.json');
  if(!fs.existsSync(file))return new Map();
  return new Map(JSON.parse(fs.readFileSync(file,'utf8')).entries.map(entry=>[entry.local.slice(1),entry.url]));
}
function isBuildRecord(name) {
  // Keep linked documentation and browser data in Pages. Build inputs and
  // research records can use the same pinned repository fallback as archives.
  return /^docs\/(?:seo|update-checks|chat-handoffs|[^/]+-(?:research|staging))\//i.test(name) ||
    /^docs\/(?:console-download-catalog|ps4-ps5-game-(?:patches|resources)|discord-[^/]+)\.json$/i.test(name) ||
    (name !== 'docs/host-gamerhack-local-build.json' &&
      /^docs\/[^/]+-(?:audit|handoff|research|review|snapshot|build|jobs|migration-plan)\.(?:json|md)$/i.test(name));
}
function plan(root = ROOT, names, revision = 'main', sizes, reservedBytes = 0, preferredHeadroom = 0) {
  const karoBuild = path.join(root, 'docs/host-reviews/karo/build.json');
  const activeKaro = fs.existsSync(karoBuild) ? JSON.parse(fs.readFileSync(karoBuild, 'utf8')).runtime?.replace(/^\//, '').replace(/web\/$/, '') : null;
  const protectedFiles = new Set();
  // Native loaders run on the independent host. Historical main-site payloads
  // can use exact-revision repository delivery like other archived downloads.
  // Unpublished intermediate KARO assemblies remain in Git and their complete
  // archived ZIPs; deploy the current assembly selected by its build report.
  const files = [...new Set(names)].filter(eligible).filter(name => !/^hosts\/runtime\/karo-/.test(name) || !activeKaro || name.startsWith(activeKaro)).map(name => ({name, bytes: sizes ? sizes.get(name) : fs.statSync(path.join(root, name)).size}));
  let bytes = reservedBytes + files.reduce((sum, f) => sum + f.bytes, 0);
  const candidates = files.filter(f =>
    (f.name.startsWith('downloads/') && !protectedFiles.has(f.name) && !/\.(?:html|js|mjs|css|json|wasm|txt|md|xml|ini|cfg|conf|lua|gsc|csc|c|cc|cpp|h|hpp|py|ps1|sh|bat|cmd|ct|cht|csv|tsv|yml|yaml|toml|svg|png|jpe?g|webp|gif|avif|ico)$/i.test(f.name)) ||
    legacyLibraryShard.test(f.name) ||
    isBuildRecord(f.name) ||
    /^scooby\/(?:FSL\/)?WINMM\.dll$/i.test(f.name) ||
    (/^assets\/images\/.+\.(?:png|jpe?g|webp|gif|avif|svg|ico)$/i.test(f.name) && !libraryArtwork.has(f.name) && !f.name.startsWith('assets/images/transfer-guides/') && f.name !== 'assets/images/expansion-ps4-ps5/ps5-ezremote.jpg') ||
    /^hosts\/runtime\/karo-[^/]+\/web\/.+\.(?:bin|elf|bz2|zip)$/i.test(f.name)
  ).sort((a, b) => b.bytes - a.bytes || a.name.localeCompare(b.name));
  const offloaded = sourceLinks(root);
  for (const file of files) if (offloaded.has(file.name)) bytes -= file.bytes;
  for (const file of candidates) {
    if (offloaded.has(file.name)) continue;
    if (bytes <= LIMIT - preferredHeadroom) break;
    offloaded.set(file.name, rawURL(file.name, revision));
    bytes -= file.bytes;
  }
  if (bytes > LIMIT) throw Error('Required Pages files exceed the 900 MiB deployment budget');
  return {files, offloaded, bytes, protectedFiles};
}
function rewriter(offloaded) {
  const forms = new Map();
  for (const [name, url] of offloaded) for (const form of new Set([name, encodePath(name), encodeURI(name)])) {
    forms.set('/' + form, url);
  }
  const pattern = new RegExp('(?<![a-zA-Z0-9_./%:-])(?:https://whatwhatboy\\.com)?(?:' + [...forms.keys()].sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![a-zA-Z0-9_%./-])', 'g');
  return (source, name) => {
    source = source.replace(pattern, match => forms.get(match.replace(/^https:\/\/whatwhatboy\.com/, '')) || match);
    // Relative HTML attributes and CSS URLs also resolve against their document.
    const replaceRelative = (whole, prefix, value, suffix) => {
      if (/^(?:[a-z]+:|\/\/|#)/i.test(value)) return whole;
      try {
        const parsed = new URL(value.replaceAll('&amp;', '&').replaceAll('&#39;', "'").replaceAll('&#x27;', "'"), 'https://whatwhatboy.com/' + name);
        const target = offloaded.get(decodeURIComponent(parsed.pathname.slice(1)));
        return target ? prefix + target + parsed.search + parsed.hash + suffix : whole;
      } catch { return whole; }
    };
    return source.replace(/((?:href|src)=)(["'])(.*?)\2/g, (whole, prefix, quote, value) => replaceRelative(whole, prefix + quote, value, quote))
      .replace(/(srcset=)(["'])(.*?)\2/g,(whole,prefix,quote,value)=>{
        if(value.trim().startsWith('data:'))return whole;
        return prefix+quote+value.split(',').map(candidate=>candidate.replace(/^(\s*)(\S+)([\s\S]*)$/,(_,lead,url,descriptor)=>replaceRelative(lead+url+descriptor,lead,url,descriptor))).join(',')+quote;
      })
      .replace(/(url\(["']?)([^"'<>\s)]+)(["']?\))/g, replaceRelative);
  };
}
function build({root = ROOT, output = path.join(ROOT, 'tmp/pages-build'), revision = 'main', names, sizes} = {}) {
  const sparse = process.env.WHATSITE_SPARSE_PAGES === '1', tree = sparse ? treeFiles(root) : null;
  names ||= tree ? tree.names : execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {cwd: root, maxBuffer: 64 * 1024 * 1024}).toString().split('\0').filter(Boolean);
  if (fs.existsSync(output)) throw Error('Use a fresh output directory; existing files are never removed');
  const hasLocales=fs.existsSync(path.join(root,'docs/i18n/page-translations.json'));
  // Sparse source catalogues are materialized only for build-time rendering.
  if(sparse&&hasLocales)materializeLocaleSources(root);
  const localization=hasLocales?require('./build-localized-pages.cjs'):null;
  const localizedContext=localization?localization.load(root):null;
  const addAds = (source, name) => publishAds(name, source);
  const {apply: addConsoleDownloadNav} = require('./console-download-navigation.cjs');
  const siteShell = require('./site-shell.cjs').create(root);
  const prepare = (source, name) => addConsoleDownloadNav(name, siteShell(name, source))
    .replaceAll('href="/assets/catalog-layout.css?v=1"', 'href="/assets/catalog-layout.css?v=2"');
  const estimatedLocales=localization?localization.generate({root,context:localizedContext,estimate:true,prepare,rewrite:addAds}):{bytes:0};
  const reservedBytes = Math.max(0, estimatedLocales.bytes);
  // Keep space for URL rewrites when possible. The final artifact check
  // enforces the size limit using the rendered pages and rewritten links.
  const preferredHeadroom = localization ? 64 * 1024 * 1024 : 0;
  const result = plan(root, names, revision, tree?.sizes || sizes, reservedBytes, preferredHeadroom), rewriteLinks = rewriter(result.offloaded);
  const rewrite = (source, name) => addAds(rewriteLinks(prepare(source, name), name), name);
  const deliveryFile=path.join(root,'docs/download-source-links.json'),deliveryEntries=fs.existsSync(deliveryFile)?JSON.parse(fs.readFileSync(deliveryFile,'utf8')).entries:[];
  if (sparse) materialize(root, result);
  const legacyDetails = Object.fromEntries([...result.offloaded].flatMap(([name, url]) => {
    const shard = legacyLibraryShard.exec(name);
    return shard ? [[shard[1], url]] : [];
  }));
  const runtimeFiles = Object.fromEntries([...result.offloaded].filter(([name]) => name.startsWith('hosts/runtime/')).map(([name, url]) => ['/' + name, url]));
  for (const {name} of result.files) {
    if (result.offloaded.has(name)) continue;
    const destination = path.join(output, name);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    // Immutable downloads and receiver snapshots keep their exact archived bytes.
    if ((!name.startsWith('downloads/') || name === 'downloads/index.html') && !/^console\/ps[45]\/whatsite-ps[45]\.html$/.test(name) && /\.(?:html|js|css|json|xml|md|txt)$/i.test(name)) {
      let source=fs.readFileSync(path.join(root, name), 'utf8');
      if(name.endsWith('.html')&&!name.startsWith('hosts/runtime/'))source=require('./canonical-host-links.cjs').apply(source);
      if(name.endsWith('.html'))source=require('./source-download-notes.cjs').annotate(source,name,deliveryEntries);
      let content = rewrite(source, name);
      if (name === 'assets/playstation-library/index.json' && Object.keys(legacyDetails).length) {
        content = JSON.stringify({...JSON.parse(content), legacyDetails});
      }
      if (/^hosts\/runtime\/karo-[^/]+\/web\/.+\.html$/i.test(name) && Object.keys(runtimeFiles).length) {
        const adapter = '<script src="/pages-runtime-map.js"></script><script src="/assets/pages-runtime-files.js"></script>';
        content = /<head\b[^>]*>/i.test(content) ? content.replace(/<head\b[^>]*>/i, head => head + adapter) : adapter + content;
      }
      fs.writeFileSync(destination, content);
    } else fs.copyFileSync(path.join(root, name), destination);
  }
  const mapping = Object.fromEntries([...result.offloaded].map(([name, url]) => ['/' + name, url]));
  fs.writeFileSync(path.join(output, 'pages-download-map.json'), JSON.stringify(mapping));
  fs.writeFileSync(path.join(output, 'pages-runtime-map.js'), 'window.WHATSITE_RUNTIME_FILES=' + JSON.stringify(runtimeFiles).replaceAll('<', '\\u003c') + ';');
  fs.writeFileSync(path.join(output, '.nojekyll'), '');
  // Old bookmarked download paths still offer the exact repository file.
  const fallback = '<script>if(location.pathname){fetch("/pages-download-map.json",{cache:"no-store"}).then(function(r){return r.json()}).then(function(m){var u=m[decodeURIComponent(location.pathname)];if(u)location.replace(u)}).catch(function(){})}</script>';
  const errorPage = path.join(output, '404.html');
  fs.appendFileSync(errorPage, fallback);
  const localized=localization?localization.generate({root,output,rewrite,prepare,context:localizedContext}):{pages:0,bytes:0};
  const report = {revision, bytes: result.bytes-reservedBytes+localized.bytes, budget: LIMIT, hostedFiles: result.files.filter(file => !result.offloaded.has(file.name)).length+localized.pages, repositoryFiles: result.offloaded.size, protectedNativeFiles: result.protectedFiles.size,localized};
  fs.writeFileSync(path.join(output, 'pages-build.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  return report;
}
if (require.main === module) build({output: process.argv[2] && path.resolve(process.argv[2]), revision: process.env.GITHUB_SHA || 'main'});
module.exports = {build, plan, rewriter, rawURL, eligible, LIMIT, treeFiles, materialize, materializeLocaleSources, sourceLinks};
