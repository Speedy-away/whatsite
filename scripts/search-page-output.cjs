// Final browser-page pass shared by generators. Never alters packaged HTML tools.
const {eligible} = require('./site-public-pages.cjs');
const tags = require('./page-search-tags.cjs');
function finish(file, html) {
  const metadata = require('./page-search-metadata.cjs');
  const relative = metadata.normalizedFile(file);
  const helpfulTools = require('./console-helpful-tools.cjs');
  const ps4Hub = relative === 'console/ps4/index.html';
  if (!ps4Hub) html = helpfulTools.apply(relative, html);
  if (!eligible(relative) || tags.protectedFile(relative, html)) return html;
  html = require('./language-loader.cjs').apply(html);
  html = require('./console-game-patch-navigation.cjs').apply(relative, html);
  html = require('./phone-navigation.cjs').apply(relative, html);
  html = require('./profile-navigation.cjs').apply(relative, html);
  html = require('./canonical-host-links.cjs').apply(html);
  html = require('./console-guide-host-links.cjs').apply(relative, html);
  html = require('./catalog-layout.cjs').apply(relative, html);
  if (require('./site-ads.cjs').eligible(relative, html)) html = require('./site-ads.cjs').applyAds(relative, html);
  const navigable = require('./pc-ports-navigation.cjs').apply(relative, require('./console-game-directories.cjs').apply(relative, html));
  const shops = require('./console-free-shops.cjs').apply(relative, navigable);
  const grouped = require('./console-hub-groups.cjs').apply(relative, shops);
  const withTools = ps4Hub ? helpfulTools.apply(relative, grouped) : grouped;
  const themed = require('./add-themes-sidebar.cjs').applyThemes(withTools, relative);
  const illustrated = require('./category-card-art.cjs').apply(relative, themed);
  const directories = require('./game-directory-card-layout.cjs').apply(relative, illustrated);
  const searchable = tags.apply(relative, require('./host-page-shell.cjs').apply(relative,directories));
  return require('./internal-page-navigation.cjs').apply(relative, require('./responsive-category-images.cjs').apply(relative, metadata.transform(relative, searchable).html));
}
module.exports = {finish};
