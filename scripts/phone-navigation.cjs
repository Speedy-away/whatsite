// Shared Phone destination for current pages and future generators.
const fs = require('node:fs');
const path = require('node:path');
const {root, pages} = require('./site-public-pages.cjs');
function apply(file, html) {
  return html.replace(/<nav\b[^>]*class="sidebar-nav"[^>]*>[\s\S]*?<\/nav>/, nav => {
    if (nav.includes('data-phone-navigation')) return nav;
    const active = String(file).replaceAll('\\', '/') === 'pages/phone.html';
    const entry = `<li data-phone-navigation><a href="/pages/phone.html" class="nav-link${active ? ' active' : ''}"${active ? ' aria-current="page"' : ''} data-tooltip="Phone" aria-label="Phone"><svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/></svg><span>Phone</span></a></li>`;
    // Insert before the next top-level group after PC.
    const pc = /<li\b[^>]*>\s*<button\b(?=[^>]*data-tooltip="PC")[^>]*>/.exec(nav);
    if (!pc) return nav;
    const tags = /<(\/?)li\b[^>]*>/g;
    tags.lastIndex = pc.index + pc[0].length;
    let depth = 1, tag;
    while (depth && (tag = tags.exec(nav))) depth += tag[1] ? -1 : 1;
    if (depth) throw Error('Unclosed PC navigation: ' + file);
    return nav.slice(0, tags.lastIndex) + entry + nav.slice(tags.lastIndex);
  });
}
if (require.main === module) {
  let changed = 0;
  for (const file of pages()) {
    const before = fs.readFileSync(file, 'utf8');
    const after = apply(path.relative(root, file), before);
    if (before !== after) { fs.writeFileSync(file, after); changed++; }
  }
  console.log(`Added Phone to ${changed} sidebars.`);
}
module.exports = {apply};
