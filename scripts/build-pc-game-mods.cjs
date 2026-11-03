const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const {section, grid, note, ext, esc} = require('./build-console-guides.cjs');
const data = require('../docs/pc-game-mods.json');
const finish = require('./search-page-output.cjs').finish;
function resource(entry) {
  const download = entry.download;
  const action = download ? ext(download.sourceUrl, 'Download ' + esc(entry.version) + ' · ' + (download.bytes / 1048576).toFixed(1) + ' MiB') : ext(entry.source, entry.kind === 'Mod directory' ? 'Browse mods' : 'Author page');
  return `<article class="guide-resource" id="${entry.id}" data-search="${esc([entry.title, entry.kind, entry.description, entry.compatibility].join(' ').toLowerCase())}"><p class="feature">${esc(entry.kind)}</p><h3>${esc(entry.title)}</h3><p>${esc(entry.description)}</p><p><strong>Compatibility:</strong> ${esc(entry.compatibility)}</p><div class="guide-links">${action}${download ? ext(entry.source, 'Release notes') : entry.documentation ? ext(entry.documentation, 'Documentation') : ''}</div>${download ? `<details><summary>File details</summary><p>${esc(download.name)}</p><p>SHA-256: <code class="mod-file-hash">${download.sha256}</code></p></details>` : `<p>${esc(entry.availability)}</p>`}</article>`;
}
function build() {
  const template = fs.readFileSync(path.join(root, 'mods/skyrim.html'), 'utf8');
  const sidebar = template.slice(template.indexOf('    <!-- Sidebar Navigation -->'), template.indexOf('    <!-- Main Content -->'));
  const footer = template.slice(template.indexOf('    <footer class="footer">'));
  const output = [];
  for (const game of data.games) {
    const file = `mods/${game.id}.html`, title = `${game.title} Mods & Tools`;
    const entries = data.entries.filter(row => row.game === game.id);
    const content = section('requirements', 'Choose a compatible setup', note(`<p>${esc(game.requirements)}</p>`)) +
      section('mods', 'Mods & tools', grid(...entries.map(resource)), `${entries.length} resources · pinned downloads and author pages`) +
      section('setup', 'Getting started', note(`<p>${esc(game.setup)}</p><div class="guide-links">${ext(game.help, 'Official setup instructions')}</div>`));
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"><meta name="color-scheme" content="dark"><meta name="theme-color" content="#0a0a0c"><title>${esc(title)} | whatwhatboy</title><meta name="description" content="${esc(game.description)}"><meta name="keywords" content="${esc([game.title, 'game mods', ...entries.map(e => e.title)].join(', '))}"><link rel="canonical" href="https://whatwhatboy.com/${file}"><link rel="icon" href="/assets/images/logo.png" type="image/png"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><link rel="stylesheet" href="/style.css?v=3.3.2"><link rel="stylesheet" href="/assets/console-guides.css?v=10"><link rel="stylesheet" href="/assets/pc-game-mods.css?v=1"><script defer src="/languages/i18n.js?v=3"></script></head><body class="console-guide"><a class="skip-link" href="#main-content">Skip to content</a>${sidebar}<main class="main-content" id="main-content" tabindex="-1"><header class="guide-hero"><div class="container guide-hero-grid"><div><div class="guide-breadcrumb"><a href="/">Home</a> / <a href="/pages/mods.html">Game Mods</a></div><h1>${esc(title)}</h1><p>${esc(game.description)}</p><div class="hero-buttons"><a href="#mods" class="btn btn-primary">Browse mods</a><a href="/pages/mods.html" class="btn btn-outline">All games</a></div></div><img src="${game.image}" alt="${esc(game.title)} artwork" width="460" height="215"></div></header><div class="container"><nav class="guide-nav" aria-label="Game mod sections"><a href="#requirements">Compatibility</a><a href="#mods">Mods & tools</a><a href="#setup">Getting started</a></nav></div>${content}</main>${footer}`;
    fs.writeFileSync(path.join(root, file), finish(file, require('./apply-mobile-layout.cjs').improve(html)).replace(/[\t ]+$/gm, ''));
    output.push(file);
  }
  const hubPath = path.join(root, 'pages/mods.html');
  let hub = fs.readFileSync(hubPath, 'utf8');
  const cards = data.games.map(game => `<div class="game-card" data-mod="${esc(game.title.toLowerCase())}" data-search="${esc([game.title, ...data.entries.filter(e=>e.game===game.id).map(e=>e.title)].join(' ').toLowerCase())}"><div class="game-image"><img src="${game.image}" alt="${esc(game.title)} artwork" loading="lazy"></div><div class="game-info"><h3 class="game-title">${esc(game.title)}</h3><p class="game-description">${esc(game.description)}</p><a href="/mods/${game.id}.html" class="game-link"><i class="fas fa-arrow-right" aria-hidden="true"></i> View Mods</a></div></div>`).join('\n');
  const block = `<!-- PC MOD EXPANSION START -->\n${cards}\n<!-- PC MOD EXPANSION END -->`;
  if (hub.includes('<!-- PC MOD EXPANSION START -->')) hub = hub.replace(/<!-- PC MOD EXPANSION START -->[\s\S]*?<!-- PC MOD EXPANSION END -->/, block);
  else hub = hub.replace('<div class="games-grid">', '<div class="games-grid">\n' + block);
  fs.writeFileSync(hubPath, finish('pages/mods.html', hub));
  return output;
}
module.exports = {build, resource};
if (require.main === module) console.log(JSON.stringify(build()));
