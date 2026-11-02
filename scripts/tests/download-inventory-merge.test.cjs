const test = require('node:test');
const assert = require('node:assert/strict');
const {mergeImport} = require('../download-inventory-merge.cjs');
test('platform imports preserve other platform records and previous file versions', () => {
  const latest = {items: [{id: 'ps4-ps5-menu', files: [{sha256: 'original'}]}, {id: 'ps3-menu', files: [{name: 'menu.sprx', sha256: 'old'}], attempts: []}], reviews: ['preserved']};
  const pending = {items: [{id: 'ps3-menu', files: [{name: 'menu.sprx', sha256: 'new'}], attempts: [{at: 'now', status: 'downloaded'}]}]};
  const oldManifest = {files: [{downloadId: 'menu', status: 'downloaded', sha256: 'old'}]};
  const nextManifest = {files: [{downloadId: 'menu', status: 'downloaded', sha256: 'new'}]};
  const merged = mergeImport(oldManifest, latest, nextManifest, pending, 'menu', 'ps3');
  assert.deepEqual(merged.audit.items[0], latest.items[0]);
  assert.deepEqual(merged.audit.items[1].files.map(file => file.sha256), ['old', 'new']);
  assert.deepEqual(merged.manifest.files.map(file => file.sha256), ['old', 'new']);
  assert.deepEqual(merged.audit.reviews, ['preserved']);
  assert.equal(latest.items[1].files.length, 1);
});
test('default collection remains PS4/PS5 and unsupported collection paths are rejected', () => {
  const pending = {items: [{id: 'ps4-ps5-menu', files: [], attempts: []}]};
  assert.equal(mergeImport({files: []}, {items: []}, {files: []}, pending, 'menu').audit.items[0].id, 'ps4-ps5-menu');
  assert.throws(() => mergeImport({files: []}, {items: []}, {files: []}, pending, 'menu', '../outside'), /Unknown download collection/);
});
