const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const data = require('../../docs/pc-game-mods.json');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
test('new game destinations retain the five established mod collections', () => {
  const hub = read('pages/mods.html');
  for (const route of ['mods/gta5.html', 'mods/gta4.html', 'mods/rdr2.html', 'mods/skyrim.html', 'games-downloads/plants-vs-zombies.html', ...data.games.map(g => `mods/${g.id}.html`)]) assert.ok(hub.includes(route), route);
  assert.equal(new Set(data.entries.map(e => e.id)).size, data.entries.length);
});
test('download pins, upstream hashes and public archive records are explicit', () => {
  const downloads = data.entries.filter(e => e.download);
  assert.equal(downloads.length, 12);
  for (const entry of downloads) {
    const file = entry.download;
    assert.ok(entry.version && entry.compatibility && file.version === entry.version, entry.id);
    assert.match(file.sourceUrl, /^https:\/\/(?:github\.com|cdn\.modrinth\.com)\//);
    assert.doesNotMatch(file.sourceUrl, /\/latest(?:\/|$)/);
    assert.ok(file.bytes > 0);
    assert.match(file.sha256, /^[a-f0-9]{64}$/);
    if (file.upstreamSha256) assert.equal(file.sha256, file.upstreamSha256);
    assert.equal(file.local, undefined, 'No additional repository binary mirrors');
  }
  assert.doesNotMatch(JSON.stringify(data), /"[A-Z]:[\\/]|"archivePath"|"staging"/i);
});
test('every new page exposes requirements, exact files and honest author-page actions', () => {
  for (const game of data.games) {
    const html = read(`mods/${game.id}.html`);
    assert.ok(html.includes('href="/pages/mods.html"'));
    assert.ok(html.includes('id="requirements"') && html.includes('id="setup"'));
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    for (const entry of data.entries.filter(e => e.game === game.id)) {
      const section = html.slice(html.indexOf(`id="${entry.id}"`)).split('</article>')[0];
      assert.ok(section.includes(entry.title.replaceAll('&', '&amp;')), entry.id);
      if (entry.download) {
        assert.ok(section.includes(entry.download.sha256), entry.id);
        assert.ok(section.includes(entry.version), entry.id);
      } else {
        assert.ok(section.includes(entry.availability.replaceAll('&', '&amp;')), entry.id);
        assert.doesNotMatch(section, />Download /);
      }
    }
  }
});
test('Minecraft and game-specific builds retain their compatibility boundaries', () => {
  const minecraft = read('mods/minecraft.html');
  for (const pin of ['1.21.1', 'Java 21', '0.16.0', 'beta.1']) assert.ok(minecraft.includes(pin));
  const iris = data.entries.find(e => e.id === 'iris'), sodium = data.entries.find(e => e.id === 'sodium');
  assert.ok(iris.dependencies.some(d => d.dependency_type === 'required' && sodium.source.endsWith('/' + d.version_id)));
  assert.match(read('mods/elden-ring.html'), /Elden Ring 1\.17/);
  assert.match(read('mods/hollow-knight.html'), /1\.5\.78\.11833/);
  assert.match(read('mods/stardew-valley.html'), /1\.6\.14/);
  assert.match(read('mods/celeste.html'), /Windows Store edition is not supported/);
  assert.match(read('mods/terraria.html'), /0\.11\.8\.3/);
});
test('publisher artwork and social previews have valid recorded hashes', () => {
  const manifest = JSON.parse(read('docs/seo/social-images.json'));
  for (const game of data.games) {
    if (game.imageSource) {
      const image = fs.readFileSync(path.join(root, game.image));
      assert.equal(image.length, game.imageSource.bytes);
      assert.equal(crypto.createHash('sha256').update(image).digest('hex'), game.imageSource.sha256);
    }
    const preview = manifest.images[`mods/${game.id}.html`];
    assert.ok(preview && preview.width === 1200 && preview.height === 630);
  }
});
