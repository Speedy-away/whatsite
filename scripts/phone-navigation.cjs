// Shared Phone group for current pages and future generators.
const fs = require('node:fs');
const path = require('node:path');
const {root, pages, relativePath} = require('./site-public-pages.cjs');
const {icon} = require('./sidebar-icons.cjs');

function phoneLink(file, href, label, symbol) {
  const active = file === href.slice(1);
  return `<li><a href="${href}" class="nav-link nav-sublink${active ? ' active' : ''}"${active ? ' aria-current="page"' : ''} data-tooltip="${label}" aria-label="${label}">${icon(symbol)}<span>${label}</span></a></li>`;
}

function apply(file, html) {
  file = relativePath(file);
  return html.replace(/<nav\b[^>]*class="sidebar-nav"[^>]*>[\s\S]*?<\/nav>/, nav => {
    const open = file === 'pages/phone.html' || file === 'pages/apk.html';
    const entry = `<li class="nav-group${open ? ' open' : ''}" data-phone-navigation><button type="button" class="nav-link nav-group-toggle" aria-expanded="${open}" data-tooltip="Phone" aria-label="Phone">${icon('phone')}<span>Phone</span>${icon('chevron', true)}</button><ul class="nav-sublist">${phoneLink(file, '/pages/phone.html', 'Phone', 'phone')}${phoneLink(file, '/pages/apk.html', 'Tv/Movies apps', 'android')}</ul></li>`;
    const phone = /<li\b(?=[^>]*\bdata-phone-navigation)[^>]*>(?:\s*<a\b[\s\S]*?<\/a>\s*|\s*<button\b[\s\S]*?<\/ul>\s*)<\/li>/;
    const legacyApk = /[ \t]*<li\b[^>]*>\s*<a\b(?=[^>]*\bdata-tooltip="APK Downloads")[^>]*>[\s\S]*?<\/a>\s*<\/li>\r?\n?/g;
    const withoutLegacyApk = nav.replace(legacyApk, '');
    if (phone.test(nav)) return withoutLegacyApk.replace(phone, entry);
    // Insert before the next top-level group after PC.
    const pc = /<li\b[^>]*>\s*<button\b(?=[^>]*data-tooltip="PC")[^>]*>/.exec(withoutLegacyApk);
    if (!pc) return nav;
    const tags = /<(\/?)li\b[^>]*>/g;
    tags.lastIndex = pc.index + pc[0].length;
    let depth = 1, tag;
    while (depth && (tag = tags.exec(withoutLegacyApk))) depth += tag[1] ? -1 : 1;
    if (depth) throw Error('Unclosed PC navigation: ' + file);
    return withoutLegacyApk.slice(0, tags.lastIndex) + entry + withoutLegacyApk.slice(tags.lastIndex);
  });
}
if (require.main === module) {
  let changed = 0;
  for (const file of pages()) {
    const before = fs.readFileSync(file, 'utf8');
    const after = apply(path.relative(root, file), before);
    if (before !== after) { fs.writeFileSync(file, after); changed++; }
  }
  console.log(`Updated Phone navigation in ${changed} sidebars.`);
}
module.exports = {apply};
