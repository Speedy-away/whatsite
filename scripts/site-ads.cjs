const fs = require('node:fs');
const path = require('node:path');
const {relativePath, eligible: publicPage, pages, root} = require('./site-public-pages.cjs');
const {attributes, mapTokens} = require('./localized-html.cjs');

const start = '<!-- BEGIN SITE AD -->';
const end = '<!-- END SITE AD -->';
const banner = /[ \t]*<!-- BEGIN SITE AD -->[\s\S]*?<!-- END SITE AD -->[ \t]*\r?\n?/g;
const railOpen = '<div class="site-ad-layout"><div class="site-ad-content">';
const stylesheet = '<link rel="stylesheet" href="/assets/site-ads.css?v=6">';
const script = '<script defer src="/assets/site-ads.js?v=3"></script>';
const unit = 'fd0a4dcec74a63f4d2662af5273f9d5b';
const legacyNative = 'https://aloudalimonyexplosion.com/' + unit + '/invoke.js';
const native = 'https://bauval.org/21/' + unit;
const headAd = 'https://abscloud.org/1/366a2e3edafab888009b3076fcd47b82';
const bodyAd = 'https://bauval.org/14/5723aef0781af6b27fc0113e359a1d7c';
const replacedScripts = [headAd, bodyAd, 'https://aloudalimonyexplosion.com/57/23/ae/5723aef0781af6b27fc0113e359a1d7c.js'];
const sponsoredLink = '<a class="site-ad-sponsored" href="https://araplhn.org/4/ac85b864baf2e2322b99cd2ad051fbc2" target="_blank" rel="sponsored noopener noreferrer">Sponsored link</a>';

function isMain(tag) {
  const {id, class: classes = ''} = attributes(tag);
  return id === 'main-content' || classes.split(/\s+/).includes('main-content');
}

function eligible(file, html) {
  const relative = relativePath(file);
  const packagePage = relative === 'console/playstation-library/download.html';
  return publicPage(relative) &&
    !relative.startsWith('hosts/') &&
    (packagePage || !/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) &&
    !/http-equiv=["']refresh/i.test(html) &&
    !/\bclass=["'][^"']*receiver-/.test(html) &&
    [...html.matchAll(/<(?:main|div)\b[^>]*>/gi)].some(([tag]) => isMain(tag));
}

function placement({sponsored = false} = {}) {
  return [
    start,
    '<aside class="site-ad" id="page-advertisement" aria-label="Advertisement">',
    '<div class="site-ad-panel"><span class="site-ad-label">Advertisement</span>',
    sponsored ? sponsoredLink : '',
    '<div class="site-ad-stage"><div id="container-' + unit + '"></div>',
    '<script async="async" data-cfasync="false" src="' + native + '"></script>',
    '</div></div></aside>',
    end
  ].filter(Boolean).join('\n');
}

function addRail(html, file, options) {
  if (html.includes(railOpen)) {
    return html.replace(banner, () => placement(options) + '\n');
  }

  // Older documents use a DIV for main content. Track matching tags so their
  // internal cards, sections and templates remain together in the content column.
  let mainTag, depth = 0, placed = false;
  const result = mapTokens(html.replace(banner, ''), token => {
    if (placed) return;
    const tag = /^<(\/?)(main|div)\b/i.exec(token);
    if (!tag) return;
    const [, closing, name] = tag;
    if (!mainTag && !closing && isMain(token)) {
      mainTag = name.toLowerCase();
      depth = 1;
      return token + '\n' + railOpen;
    }
    if (!mainTag || name.toLowerCase() !== mainTag) return;
    depth += closing ? -1 : 1;
    if (depth > 0) return;
    placed = true;
    return '\n</div>\n' + placement(options) + '\n</div>\n' + token;
  });
  if (!placed) throw Error('No complete ad layout found in ' + file);
  return result;
}

function configureAds(file, html, {sponsored = false} = {}) {
  if (!eligible(file, html)) return html;
  // Delete unwrapped legacy embeds before inserting exactly one native unit.
  // Marked banners are replaced separately by addRail.
  const nativeUnit = /<div\b[^>]*\bid=["']container-fd0a4dcec74a63f4d2662af5273f9d5b["'][^>]*>\s*<\/div>/gi;
  let hasStylesheet = false, hasRuntime = false;
  const cleaned = mapTokens(html.replace(nativeUnit, ''), token => {
    if (/^<script\b/i.test(token)) {
      const {src} = attributes(token.slice(0, token.indexOf('>') + 1));
      if (src === legacyNative || src === native || (sponsored && replacedScripts.includes(src))) return '';
      if (src?.split('?')[0] === '/assets/site-ads.js') {
        if (hasRuntime) return '';
        hasRuntime = true;
        return script;
      }
    }
    if (/^<link\b/i.test(token) && attributes(token).href?.split('?')[0] === '/assets/site-ads.css') {
      if (hasStylesheet) return '';
      hasStylesheet = true;
      return stylesheet;
    }
    if (/^<\/head\s*>$/i.test(token)) {
      const publisherHead = sponsored ? '<script data-cfasync="false" src="' + headAd + '"></script>' : '';
      return (hasStylesheet ? '' : stylesheet) + publisherHead + token;
    }
    if (/^<\/body\s*>$/i.test(token)) {
      const publisherBody = sponsored ? '<script data-cfasync="false" src="' + bodyAd + '"></script>' : '';
      return (hasRuntime ? '' : script) + publisherBody + token;
    }
  });
  return addRail(cleaned, file, {sponsored});
}

function applyAds(file, html) {
  return configureAds(file, html);
}

function publishAds(file, html) {
  return configureAds(file, html, {sponsored: true});
}

function addExisting() {
  let changed = 0;
  for (const file of pages()) {
    const before = fs.readFileSync(file, 'utf8');
    const after = applyAds(relativePath(file), before);
    if (after !== before) { fs.writeFileSync(file, after); changed++; }
  }
  console.log('Configured left-side ad layouts on ' + changed + ' public content pages.');
}

if (require.main === module) addExisting();
module.exports = {eligible, placement, applyAds, addExisting, publishAds};
