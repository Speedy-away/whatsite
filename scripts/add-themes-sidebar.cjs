const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function integrateThemes(fragment, file = '') {
    // Theme destinations live within each console, not in the top-level sidebar.
    return fragment.replace(/<li\b(?=[^>]*\bdata-nav-section=["']themes["'])[^>]*>[\s\S]*?<\/li>/gi, '');
}

function applyThemes(html, file) {
    html = html.replace(/<nav\b[^>]*class="sidebar-nav"[^>]*>[\s\S]*?<\/nav>/, fragment => integrateThemes(fragment, file));
    const relative = String(file).replaceAll('\\','/').replace(/^\//,'');
    const themes = {'console/ps3/index.html':['/console/ps3/themes.html','PS3 themes'], 'console/psvita/home.html':['/console/psvita/themes.html','Vita themes'], 'console/ps2/index.html':['/console/ps2/themes.html','OPL themes'], 'console/psp/index.html':['/console/psp/themes.html','PSP themes'], 'console/ds/index.html':['/console/ds/themes.html','TWiLight Menu++ skins'], 'console/3ds/index.html':['/console/retro/3ds-themes.html','3DS themes'], 'console/wiiu/index.html':['/console/retro/wiiu-themes.html','Wii U themes'], 'console/nintendo-switch/index.html':['/console/nintendo-switch/themes.html','Switch themes']};
    for(const platform of ['ps4','ps5']) themes[`console/${platform}/index.html`]=[`/console/${platform}/themes.html`,platform.toUpperCase()+' themes'];
    const owner = Object.keys(themes).find(hub => relative.startsWith(hub.slice(0,hub.lastIndexOf('/')+1)));
    const entry = themes[relative] || themes[owner];
    if (!entry || !fs.existsSync(path.join(root,entry[0].slice(1)))) return html;
    const [url,label] = entry;
    html = html.replace(/<nav\b(?=[^>]*class="[^"]*\bguide-nav\b)[^>]*>[\s\S]*?<\/nav>/g, nav => nav.includes(`href="${url}"`) ? nav : nav.replace('</nav>',`<a href="${url}">${label}</a></nav>`));
    const art = require('./category-card-art.cjs');
    const start = /<section\b(?=[^>]*id="start")[^>]*>/.exec(html);
    if (start && themes[relative]) {
      const section = art.range(html,start.index,start[0]);
      const body = section && html.slice(section.start,section.end);
      if (body && !body.includes(`href="${url}"`)) {
        const grid = /<div\b(?=[^>]*class="[^"]*\bgames-grid\b)[^>]*>/.exec(body);
        if (grid) {
          const area = art.range(body,grid.index,grid[0]), image = require('./merged-category-covers.cjs').render(url,{title:label,kind:'themes'});
          const card = `<article class="guide-resource" data-console-theme-card><a href="${url}" aria-label="${label}">${image}</a><h3>${label}</h3><p>Browse themes, previews and installation instructions for this console.</p><div class="guide-links"><a href="${url}">Browse themes <i class="fas fa-arrow-right" aria-hidden="true"></i></a></div></article>`;
          const position = section.start + area.close;
          html = html.slice(0,position) + card + html.slice(position);
        }
      }
    }
    return html;
}

if (require.main === module) {
    let changed = 0;
    for (const file of require('./site-public-pages.cjs').pages()) {
        const before = fs.readFileSync(file, 'utf8');
        const after = applyThemes(before, path.relative(root, file));
        if (before !== after) { fs.writeFileSync(file, after); changed++; }
    }
    console.log(`Moved theme navigation into console pages; ${changed} pages updated.`);
}

module.exports = { integrateThemes, applyThemes };
