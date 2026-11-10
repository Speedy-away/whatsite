'use strict';

const {eligible, relativePath} = require('./site-public-pages.cjs');
const {attributes} = require('./localized-html.cjs');

const destination = '/console/game-downloads/';

function apply(file, html) {
  const relative = relativePath(file);
  if (!html.includes('nav-console-list') || !eligible(relative) || relative.startsWith('hosts/')) return html;
  const current = relative === 'console/game-downloads/index.html';
  return html.replace(/<ul\b(?=[^>]*class=["'][^"']*\bnav-console-list\b)[^>]*>[\s\S]*?<\/ul>/gi, list => {
    if (/href=["'](?:\/[a-z]{2})?\/console\/game-downloads\/(?:index\.html)?["']/.test(list)) return list;
    return list.replace(/<li\b[^>]*>\s*(<a\b[^>]*>)[\s\S]*?<\/li>/gi, (item, anchor) => {
      const href = attributes(anchor).href;
      if (!href) return item;
      const base = 'https://whatwhatboy.com/' + relative;
      if (!URL.canParse(href, base)) return item;
      const url = new URL(href, base);
      const mods = /^(\/[a-z]{2})?\/console\/mods\/(?:index\.html)?$/.exec(url.pathname);
      if (url.origin !== 'https://whatwhatboy.com' || !mods) return item;
      const active = current ? ' active' : '';
      const selected = current ? ' aria-current="page"' : '';
      return item + `<li><a class="nav-link nav-sublink${active}" href="${mods[1] || ''}${destination}"${selected}><i class="fas fa-download" aria-hidden="true"></i><span>Game Downloads</span></a></li>`;
    });
  });
}

module.exports = {apply};
