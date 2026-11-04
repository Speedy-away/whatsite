// Final browser-page pass shared by generators. Never alters packaged HTML tools.
const {eligible} = require('./site-public-pages.cjs');
const tags = require('./page-search-tags.cjs');
function finish(file, html) {
  const metadata = require('./page-search-metadata.cjs');
  const relative = metadata.normalizedFile(file);
  if (!eligible(relative) || tags.protectedFile(relative, html)) return html;
  html = require('./phone-navigation.cjs').apply(relative, html);
  html = require('./profile-navigation.cjs').apply(relative, html);
  html = require('./console-guide-host-links.cjs').apply(relative, html);
  html = require('./catalog-layout.cjs').apply(relative, html);
  if (require('./site-ads.cjs').eligible(relative, html)) html = require('./site-ads.cjs').applyAds(relative, html);
  const navigable = require('./pc-ports-navigation.cjs').apply(relative, require('./console-game-directories.cjs').apply(relative, html));
  const themed = require('./add-themes-sidebar.cjs').applyThemes(navigable, relative);
  const illustrated = require('./category-card-art.cjs').apply(relative, themed);
  const searchable = tags.apply(relative, require('./host-page-shell.cjs').apply(relative,illustrated));
  return require('./responsive-category-images.cjs').apply(relative, metadata.transform(relative, searchable).html);
}
module.exports = {finish};
