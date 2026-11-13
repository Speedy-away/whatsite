'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const tags = require('./page-search-tags.cjs');
const metadata = require('./page-search-metadata.cjs');
const legacy = require('./legacy-console-menu-search.cjs');
const root = path.resolve(__dirname, '..');
function pages() {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(path.join(root, dir), {withFileTypes: true})) {
      const file = dir + '/' + entry.name;
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.html')) files.push(file);
    }
  }
  for (const platform of ['ps3', 'xbox360']) {
    files.push(`console/${platform}/mods.html`);
    walk(`console/${platform}/mods`);
  }
  return files;
}
function update({check = false, date = '2026-11-13'} = {}) {
  const changes = [], reports = [], resources = [];
  for (const file of pages()) {
    const target = path.join(root, file), before = fs.readFileSync(target, 'utf8');
    if (!legacy.metadataForPage(file, before)) continue;
    const result = metadata.transform(file, tags.apply(file, before));
    const urls = html => [...html.matchAll(/(?:href|src)="([^"]*)"/g)].map(match => match[1]);
    assert.deepEqual(urls(result.html), urls(before), file + ': link mutation');
    const body = html => html.slice(html.indexOf('<body')).replace(/\sdata-(?:(?:catalog|library)-)?search="[^"]*"/g, '').replace(/\sdata-search-i18n="[^"]*"/g, '');
    assert.equal(body(result.html), body(before), file + ': visible content or runtime mutation');
    reports.push(result.metadata);
    resources.push(...legacy.recordsForPage(file, result.html).map(item => ({...item, page: file})));
    if (result.html !== before) changes.push({file, target, before, after: result.html});
  }
  if (!check) {
    for (const item of changes) {
      assert.equal(fs.readFileSync(item.target, 'utf8'), item.before, 'Concurrent edit: ' + item.file);
      fs.writeFileSync(item.target, item.after);
    }
    const reportFile = path.join(root, 'docs/seo/page-metadata.json');
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    const replacements = new Map(reports.map(item => [item.page, item]));
    report.pages = report.pages.map(item => replacements.get(item.page) || item);
    const existing = new Set(report.pages.map(item => item.page));
    report.pages.push(...reports.filter(item => !existing.has(item.page)));
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(path.join(root, 'docs/seo/legacy-console-menu-search.json'), JSON.stringify({date, resources}, null, 2) + '\n');
    const canonicals = new Set(reports.filter(item => changes.some(change => change.file === item.page)).map(item => item.canonical));
    const sitemapFile = path.join(root, 'sitemap.xml');
    const sitemap = fs.readFileSync(sitemapFile, 'utf8').replace(/<url>[\s\S]*?<\/url>/g, block => {
      if (!canonicals.has(block.match(/<loc>([^<]+)<\/loc>/)?.[1])) return block;
      return /<lastmod>/.test(block) ? block.replace(/<lastmod>[^<]*<\/lastmod>/, `<lastmod>${date}</lastmod>`) : block.replace('</loc>', `</loc><lastmod>${date}</lastmod>`);
    });
    fs.writeFileSync(sitemapFile, sitemap);
  }
  return {checked: reports.length, entries: Object.fromEntries(['ps3', 'xbox360'].map(platform => [platform,
    new Set(resources.filter(item => item.platform === platform).map(item => item.id)).size])),
    resourceListings: resources.length, updated: changes.map(item => item.file)};
}
module.exports = {pages, update};
if (require.main === module) {
  const result = update({check: process.argv.includes('--check')});
  console.log(JSON.stringify(result, null, 2));
  if (process.argv.includes('--check') && result.updated.length) process.exitCode = 1;
}
