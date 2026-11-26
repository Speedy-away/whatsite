'use strict';
const {range} = require('./category-card-art.cjs');

function render() {
  const {section, grid, resource, link, ext} = require('./build-console-guides.cjs');
  return section('console-hub-hens', 'Hens', grid(
    resource('GoldHEN', 'Browse GoldHEN downloads and choose a build matching your firmware and jailbreak.',
      link('/console/ps4/goldhen.html', 'Browse GoldHEN'), '/assets/images/console-software/goldhen.png'),
    resource('HEN / SilverHEN', 'Open the PS4 host to choose HEN. Check the selected build’s firmware requirements before starting.',
      ext('https://speedy-away.github.io/ps4/14.02/', 'Choose HEN / SilverHEN'), '/assets/images/consoles/playstation.jpg'),
    resource('PhantomHEN', 'Open the dedicated PhantomHEN console page for PS4 firmware 14.02.',
      ext('https://speedy-away.github.io/ps4/phantomhen/', 'Open PhantomHEN'), '/assets/images/consoles/playstation.jpg')
  ), 'Choose your homebrew enabler after checking your firmware and jailbreak route.');
}

function apply(file, html) {
  if (file !== 'console/ps4/index.html') return html;
  html = html.replace(/<section\b[^>]*\bid="console-hub-hens"[^>]*>[\s\S]*?<\/section>/g, '');
  const opening = /<section\b[^>]*\bid="console-hub-setup"[^>]*>/.exec(html);
  if (!opening) throw new Error('PS4 firmware and jailbreak section is missing');
  const setup = range(html, opening.index, opening[0]);
  if (!setup) throw new Error('PS4 firmware and jailbreak section is incomplete');
  return html.slice(0, setup.end) + render() + html.slice(setup.end);
}

module.exports = {render, apply};
