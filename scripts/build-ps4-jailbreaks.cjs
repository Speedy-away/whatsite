'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const guide = require('./ps4-browser-guide.cjs');
const buildSelector = guide.buildGuide;
const buildBrowserGuide = () => guide.buildAlias('jailbreak-13-52.html');
function refreshPs4NavigationAndHub() {
  const file = path.join(root, 'console/ps4/index.html');
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace('Choose the 14.00 WebKit guide or the browser tutorial for 13.52 or lower.', 'Full browser guide for PS4 firmware 14.02 or lower, including offline use, app installation and troubleshooting.');
  html = html.replace('choose the 14.00 webkit guide or the browser tutorial for 13.52 or lower.', 'full browser guide for ps4 firmware 14.02 or lower, including offline use, app installation and troubleshooting.');
  html = html.replace(/14\.00 or lower/g, '14.02 or lower');
  html = html.replace(/(<a href="\/console\/ps4\/jailbreaks\.html"[^>]*>)Choose your firmware/, '$1Read the full guide');
  fs.writeFileSync(file, html);
}
function buildPs4Jailbreaks() {
  buildSelector();
  buildBrowserGuide();
  require('./ps4-1400-guide.cjs').buildFourteenGuide();
  refreshPs4NavigationAndHub();
}
module.exports = {buildPs4Jailbreaks, buildSelector, buildBrowserGuide, refreshPs4NavigationAndHub, jailbreakNav: guide.jailbreakNav};
if (require.main === module) buildPs4Jailbreaks();
