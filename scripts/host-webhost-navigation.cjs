'use strict';
function integrateWebhostLink(html){
  const links=html.replace(/\s*<li\b[^>]*data-webhost-navigation[^>]*>[\s\S]*?<\/li>/g,'');
  const item='<li data-webhost-navigation><a href="https://speedy-away.github.io/WWB-HOST/" class="nav-link" data-tooltip="PS4 / PS5 Host" aria-label="PS4 / PS5 Host"><svg class="nav-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M7 10v4m-2-2h4m6-1h1m2 3h1"/></svg><span>PS4 / PS5 Host</span></a></li>';
  // Language is mounted at runtime; its initializer moves this same item below it.
  return links.replace(/(<li\b[^>]*>\s*<a\b[^>]*\bdata-tooltip="(?:Language|Help(?: &amp;| &) FAQ)"[\s\S]*?<\/li>)/,'$1\n'+item);
}
module.exports={integrateWebhostLink};
