const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const start = '<!-- BEGIN SITE AD -->';
const end = '<!-- END SITE AD -->';
const stylesheet = '<link rel="stylesheet" href="/assets/site-ads.css?v=3">';
const script = '<script defer src="/assets/site-ads.js?v=2"></script>';

function eligible(file, html) {
  html = html.replace(/<!-- BEGIN SITE AD -->[\s\S]*?<!-- END SITE AD -->/g, '');
  const relative = require('./site-public-pages.cjs').relativePath(file);
  return require('./site-public-pages.cjs').eligible(relative) &&
    !/^hosts\//.test(relative) &&
    /class=["'][^"']*\bmain-content\b/.test(html) &&
    !/^console\/ps[45]\/whatsite-ps[45]\.html$/.test(file.replaceAll('\\', '/')) &&
    !/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html) &&
    !/http-equiv=["']refresh/i.test(html) &&
    !/\bclass=["'][^"']*receiver-/.test(html);
}

function placement() {
  // Use the site's existing native embed pattern: the provider expects its
  // container in the top-level document. Only public content pages use this.
  return `${start}\n<aside class="site-ad" id="page-advertisement" aria-label="Advertisement"><div class="container"><div class="site-ad-panel"><span class="site-ad-label">Advertisement</span><div class="site-ad-stage"><div id="container-fd0a4dcec74a63f4d2662af5273f9d5b"></div><script async="async" data-cfasync="false" src="https://aloudalimonyexplosion.com/fd0a4dcec74a63f4d2662af5273f9d5b/invoke.js"></script><p class="site-ad-empty" hidden>Ad unavailable.</p></div></div></div></aside>\n${end}`;
}

function applyAds(file, html) {
  if (!eligible(file, html)) return html;
  // Migrate the older body/footer embed into one labelled responsive placement.
  // Other publisher units are retained; only this exact native unit is replaced.
  html = html.replace(/<script\b[^>]*\bsrc=["']https:\/\/aloudalimonyexplosion\.com\/fd0a4dcec74a63f4d2662af5273f9d5b\/invoke\.js["'][^>]*>\s*<\/script>/gi, '')
    .replace(/<div\b[^>]*\bid=["']container-fd0a4dcec74a63f4d2662af5273f9d5b["'][^>]*>\s*<\/div>/gi, '');
  html = html.replace(/\/assets\/site-ads\.css\?v=[12](?=["'])/g, '/assets/site-ads.css?v=3').replace('/assets/site-ads.js?v=1', '/assets/site-ads.js?v=2');
  if (!html.includes('/assets/site-ads.css')) html = html.replace('</head>', stylesheet + '\n</head>');
  if (!html.includes('/assets/site-ads.js')) html = html.replace('</body>', script + '</body>');
  if (html.includes(start) && !html.includes(end, html.indexOf(start))) throw Error('Unterminated ad placement in ' + file);
  // Reposition existing placements too, so older ads inside cards are repaired.
  html = html.replace(/\s*<!-- BEGIN SITE AD -->[\s\S]*?<!-- END SITE AD -->\s*/g, '');
  const normalizedFile=file.replaceAll('\\', '/');
  if(normalizedFile === 'console/ps5/index.html'){
    const setup=html.search(/<div\b[^>]*\bid="console-hub-setup"[^>]*>/i);
    if(setup>=0)return html.slice(0,setup)+placement()+'\n'+html.slice(setup);
  }
  if(normalizedFile === 'console/ps3/index.html'){
    const start=html.search(/<section\b[^>]*\bid="start"[^>]*>/i);
    const end=start>=0?html.indexOf('</section>',start):-1;
    if(end>=0)return html.slice(0,end+10)+'\n'+placement()+html.slice(end+10);
  }
  if(normalizedFile === 'console/mods/ps4/rdr2/index.html'){
    const downloads=html.search(/<section\b[^>]*\bid="downloads"[^>]*>/i);
    const end=downloads>=0?html.indexOf('</section>',downloads):-1;
    if(end>=0)return html.slice(0,end+10)+'\n'+placement()+html.slice(end+10);
  }
  // Keep the first content section (including exploit-host lists) at the top.
  const content = html.indexOf('<div id="content">');
  const main = html.search(/<(?:main|div)\b[^>]*\bid="main-content"/i);
  const sectionStart = content >= 0 ? content : main >= 0 ? main : 0;
  // The PS4/PS5 games hub places its ad after the game choices.
  const sectionPattern = normalizedFile === 'console/mods/ps4/index.html'
    ? /<section\b[^>]*\bid="games"[^>]*>/i
    : normalizedFile === 'console/ps5/index.html' && html.includes('id="console-hub-tools"')
      ? /<section\b[^>]*\bid="console-hub-tools"[^>]*>/i
      : normalizedFile === 'console/ps4/index.html'
      ? /<section\b[^>]*\bid="start"[^>]*>/i
      : normalizedFile === 'console/ps4/game-library/index.html'
        ? /<section\b[^>]*\bid="catalog"[^>]*>/i
        : normalizedFile === 'console/ps4/themes.html' && html.includes('id="theme-library"')
          ? /<section\b[^>]*\bid="theme-library"[^>]*>/i
          : /<section\b[^>]*>/i;
  const firstMatch = sectionPattern.exec(html.slice(sectionStart));
  const first = firstMatch ? sectionStart + firstMatch.index : -1;
  let sectionEnd = -1, depth = 0;
  if (first >= 0) {
    const tokens = /<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>|<\/?section\b[^>]*>/gi;
    tokens.lastIndex = first;
    let token;
    while ((token = tokens.exec(html))) {
      if (!/^<\/?section\b/i.test(token[0])) continue;
      depth += /^<\//.test(token[0]) ? -1 : 1;
      if (depth === 0) { sectionEnd = tokens.lastIndex; break; }
    }
  }
  if (sectionEnd < 0 && main >= 0) {
    // Older directories use a main-content DIV without any SECTION elements.
    const tag = /^<(main|div)\b/i.exec(html.slice(main))[1];
    const tokens = new RegExp('<!--[\\s\\S]*?-->|<script\\b[^>]*>[\\s\\S]*?<\\/script\\s*>|<style\\b[^>]*>[\\s\\S]*?<\\/style\\s*>|<\\/?' + tag + '\\b[^>]*>', 'gi');
    tokens.lastIndex = main;
    let token, level = 0;
    while ((token = tokens.exec(html))) {
      if (!new RegExp('^<\\/?' + tag + '\\b', 'i').test(token[0])) continue;
      level += /^<\//.test(token[0]) ? -1 : 1;
      if (level === 0) { sectionEnd = token.index; break; }
    }
  }
  if (sectionEnd < 0) throw Error('No content placement found in ' + file);
  // Ports has one long catalogue section. Put its ad after the intro rather
  // than below all 49 cards, keeping the provider outside the searchable grid.
  const heroEnd = file.replaceAll('\\', '/') === 'pc/ports.html' ? html.indexOf('</header>', main) : -1;
  // The homepage keeps discovery, tools and help ahead of the ad, above its footer.
  const homeEnd = file.replaceAll('\\', '/') === 'index.html' ? html.indexOf('</main>', main) : -1;
  const insert = homeEnd >= 0 ? html.slice(0, homeEnd).trimEnd().length : heroEnd >= 0 ? heroEnd + '</header>'.length : sectionEnd;
  return html.slice(0, insert) + '\n' + placement() + '\n' + html.slice(homeEnd >= 0 ? homeEnd : insert);
}

function addExisting() {
  let changed = 0, total = 0;
  for (const file of require('./site-public-pages.cjs').pages()) {
    const relative = path.relative(root, file).replaceAll('\\', '/');
    const before = fs.readFileSync(file, 'utf8');
    if (!eligible(relative, before)) continue;
    total++;
    const after = applyAds(relative, before);
    if (after !== before) { fs.writeFileSync(file, after); changed++; }
  }
  console.log(`Configured inline ads on ${total} public content pages; updated ${changed}.`);
}

if (require.main === module) addExisting();
module.exports = {eligible, placement, applyAds, addExisting};
