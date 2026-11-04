'use strict';
const fs = require('node:fs');
const {pages, relativePath, eligible} = require('./site-public-pages.cjs');
const grids = new Set(('games-grid cheats-grid tools-grid console-grid app-grid pc-emu-grid ports-grid mods-console-grid core-download-grid switch-mod-grid switch-theme-grid ps2-grid menu-resource-grid menu-game-grid ps3-game-grid ps3-theme-grid patch-card-grid psp-grid vita-grid wii-more-grid wiiu-grid wiiu-theme-grid themes-console-grid xbox-app-grid console-download-grid').split(' '));
const stylesheet = '<link rel="stylesheet" href="/assets/catalog-layout.css?v=1">';

function apply(file, html) {
  file = relativePath(file);
  if (!eligible(file) || /^(?:hosts|downloads)\//.test(file) ||
      /http-equiv=["']refresh|name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html) ||
      !/class="[^"]*\bmain-content\b/.test(html)) return html;
  const found = [...html.matchAll(/<(?:div|section|ul)\b[^>]*\bclass="([^"]*)"[^>]*>/g)]
    .some(match => match[1].split(/\s+/).some(name => grids.has(name)));
  if (!found) return html;
  // A body attribute leaves existing class-based generator substitutions intact.
  html = html.replace(/<body\b[^>]*>/, tag => tag.includes('data-catalog-page') ? tag : tag.replace(/>$/, ' data-catalog-page>'));
  if (!html.includes('/assets/catalog-layout.css')) html = html.replace('</head>', stylesheet + '\n</head>');
  return html;
}

function run() {
  let changed = 0;
  for (const file of pages()) {
    const before = fs.readFileSync(file, 'utf8'), after = apply(file, before);
    if (before !== after) { fs.writeFileSync(file, after); changed++; }
  }
  console.log('Updated responsive catalogues on ' + changed + ' pages.');
}
if (require.main === module) run();
module.exports = {apply, grids};
