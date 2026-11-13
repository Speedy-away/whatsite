'use strict';
// Refresh only search attributes and metadata; retain page content and download links.
const fs = require('node:fs');
const path = require('node:path');
const {catalog} = require('./console-mod-catalog.cjs');
const tags = require('./page-search-tags.cjs');
const metadata = require('./page-search-metadata.cjs');
const root = path.resolve(__dirname, '..');
function update({check = false} = {}) {
  const {games, entries} = catalog();
  const menuGames = games.filter(game => entries.some(entry => entry.gameId === game.id && entry.keywords.length));
  const files = [...menuGames.map(game => game.url.slice(1) + 'index.html'),
    'console/mods/ps4/index.html', 'console/mods/ps4/menus.html',
    'console/mods/ps4/call-of-duty/index.html', 'console/mods/ps4/call-of-duty/multicod/index.html'];
  const updates = [], reports = [];
  for (const file of files) {
    const target = path.join(root, file), before = fs.readFileSync(target, 'utf8');
    const result = metadata.transform(file, tags.apply(file, before));
    reports.push(result.metadata);
    if (result.html !== before) updates.push({file, target, before, after: result.html});
  }
  if (!check) {
    for (const item of updates) {
      if (fs.readFileSync(item.target, 'utf8') !== item.before) throw Error('Concurrent page edit: ' + item.file);
      fs.writeFileSync(item.target, item.after);
    }
    const reportFile = path.join(root, 'docs/seo/page-metadata.json');
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    const replacements = new Map(reports.map(item => [item.page, item]));
    report.pages = report.pages.map(item => replacements.get(item.page) || item);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
    const tagFile = path.join(root, 'docs/seo/resource-tags.json');
    const tagReport = JSON.parse(fs.readFileSync(tagFile, 'utf8'));
    tagReport.resources = entries.map(entry => ({name: entry.name, gameId: entry.gameId,
      category: entry.category, tags: entry.tags, searchTerms: entry.search, url: entry.url}));
    fs.writeFileSync(tagFile, JSON.stringify(tagReport, null, 2) + '\n');
  }
  return {checked: files.length, menuEntries: entries.filter(entry => entry.keywords.length).length,
    updated: updates.map(item => item.file)};
}
module.exports = {update};
if (require.main === module) {
  const result = update({check: process.argv.includes('--check')});
  console.log(JSON.stringify(result, null, 2));
  if (process.argv.includes('--check') && result.updated.length) process.exitCode = 1;
}
