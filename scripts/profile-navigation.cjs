const fs = require('node:fs');
const path = require('node:path');
const {root, pages} = require('./site-public-pages.cjs');
const {icon} = require('./sidebar-icons.cjs');
function apply(file, html) {
  return html.replace(/<nav\b[^>]*class="sidebar-nav"[^>]*>[\s\S]*?<\/nav>/, nav => {
    const active = String(file).replaceAll('\\', '/') === 'pages/profile.html';
    const entry = `<li data-profile-navigation><a href="/pages/profile.html" class="nav-link${active ? ' active' : ''}"${active ? ' aria-current="page"' : ''} data-tooltip="Contact Me" aria-label="Contact Me">${icon('profile')}<span>Contact Me</span></a></li>`;
    if (nav.includes('data-profile-navigation')) {
      return nav.replace(/<li\b[^>]*\bdata-profile-navigation[^>]*>[\s\S]*?<\/li>/, entry);
    }
    const group = /<li\b[^>]*>\s*<button\b(?=[^>]*data-tooltip="Community")[^>]*>/.exec(nav);
    if (!group) return nav;
    const tags = /<(\/?)li\b[^>]*>/g;
    tags.lastIndex = group.index + group[0].length;
    let depth = 1, tag;
    while (depth && (tag = tags.exec(nav))) depth += tag[1] ? -1 : 1;
    if (depth) throw Error('Unclosed Community navigation: ' + file);
    return nav.slice(0, group.index) + entry + nav.slice(tags.lastIndex);
  });
}
if (require.main === module) {
  let changed = 0;
  for (const file of pages()) {
    const before = fs.readFileSync(file, 'utf8');
    const after = apply(path.relative(root, file), before);
    if (before !== after) { fs.writeFileSync(file, after); changed++; }
  }
  console.log(`Replaced Community dropdown on ${changed} pages.`);
}
module.exports = {apply};
