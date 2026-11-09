'use strict';

const {games, dlcPost} = require('../docs/ps4-game-add-ons.json');
const title = "Game downloads & DLCs & Updates & FPKG's fixes";
const description = 'Browse PS4 game downloads, DLCs, versioned updates, FPKG fixes and game patches.';
const hub = '/console/ps4/game-downloads.html';
const dlcs = '/console/ps4/dlcs.html';
const updates = '/console/ps4/updates.html';
const cover = game => `/assets/images/covers/cod-${game.id}.jpg`;

function build() {
  const {page, section, grid, resource, ext} = require('./build-console-guides.cjs');
  const nav = [['/console/ps4/', 'PS4 Hub'], [hub, 'Game downloads'], [dlcs, "DLC's"], [updates, 'Updates'],
    ['/console/ps4/fpkg-fixes.html', "FPKG's Fixes"]];
  const artwork = '/assets/images/free-shops/game-downloads-20261104.jpg';
  const cards = (label, detail, url, button) => grid(...games.map(game =>
    resource(label(game), detail(game), ext(url(game), button), cover(game))
      .replace('<article ', `<article id="${game.id}" `)));

  page(dlcs.slice(1), "DLC's", 'Season Pass packages for Black Ops 1 and Black Ops 2 on PlayStation 4.', artwork, nav,
    section('games-dlcs', 'Games - DLCs', cards(game => game.title + ' DLC / Season Pass',
      game => `PS4 · ${game.titleId}`, game => game.dlc, 'Download Season Pass PKG') +
      `<div class="guide-note"><p>Discord download links expire. If a link stops working, open the original post in Discord to get a fresh link.</p><div class="guide-links">${ext(dlcPost, 'Open original Discord post')}</div></div>`),
    '#games-dlcs', 'Browse DLCs');
  page(updates.slice(1), 'Updates', 'Versioned PlayStation 4 game updates for Black Ops 1 and Black Ops 2.', artwork, nav,
    section('game-updates', 'PS4 game updates', cards(game => `${game.title} [${game.update}]`,
      game => `PS4 · ${game.titleId}. The folder lists the base game and update ${game.update} together in one PKG, labelled [5.05].`,
      game => game.updateFolder, 'Open VikingFile download folder')),
    '#game-updates', 'Browse updates');
  const files = [dlcs.slice(1), updates.slice(1)];
  for (const file of files) {
    const target = require('node:path').join(__dirname, '..', file);
    const fs = require('node:fs');
    fs.writeFileSync(target, fs.readFileSync(target, 'utf8').replace(/[ \t]+$/gm, ''));
  }
  return files;
}

function applyToDirectory(html) {
  const {section, grid, resource, link, esc} = require('./build-console-guides.cjs');
  html = html.replace(/<h1>PlayStation 4 Game Downloads<\/h1><p>[^<]*<\/p>/,
    `<h1>${esc(title)}</h1><p>${description}</p>`);
  html = html.replace(/<nav\b(?=[^>]*class="[^"]*\bguide-nav\b)[^>]*>[\s\S]*?<\/nav>/,
    nav => nav.includes(`href="${dlcs}"`) ? nav : nav.replace('</nav>',
      `<a href="${dlcs}">DLC's</a><a href="${updates}">Updates</a></nav>`));
  if (html.includes('id="games-dlcs"')) return html;
  const links = games.map(game => link(`${dlcs}#${game.id}`, `${game.title} Season Pass`)).join('');
  const dlcCard = resource("DLC's", 'Find Season Pass packages by game and PS4 title ID.',
    link(dlcs, 'Browse DLCs') + links, cover(games[0]));
  const updatesCard = resource('Updates', 'Find Black Ops 1 [1.09] and Black Ops 2 [1.11].',
    link(updates, 'Browse updates'), cover(games[1]));
  const block = section('games-dlcs', 'Games - DLCs', grid(dlcCard, updatesCard));
  return html.replace(/<section\b[^>]*\bid="game-directories"[^>]*>/, opening => block + opening);
}

function applyToHubCard(card) {
  const {esc} = require('./build-console-guides.cjs');
  return card.replace('<h3>Game downloads &amp; fixes</h3>', '<h3>' + esc(title) + '</h3>')
    .replace('Browse PS4 game download directories, title-specific sources and game fixes.', description)
    .replace('Browse game downloads &amp; fixes', 'Browse PS4 downloads');
}

module.exports = {title, description, hub, applyToDirectory, applyToHubCard, build};
if (require.main === module) build();
