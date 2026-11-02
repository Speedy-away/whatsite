const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {verifyFile, verifyCatalogueBaseline} = require('../verify-console-continuation.cjs');

test('baseline verification permits additional resources and detects changed or missing prior entries', () => {
  const prior = {id: 'preserved', filename: 'original.xml', sha256: 'a'.repeat(64), platforms: ['ps4', 'ps5']};
  const current = {...prior, platforms: ['ps5', 'ps4']};
  assert.equal(verifyCatalogueBaseline([prior], [current, {id: 'new-native-ps5-resource'}])[0].passed, true);
  const changed = verifyCatalogueBaseline([prior], [{...current, sha256: 'b'.repeat(64), filename: 'renamed.xml', platforms: ['ps5']}])[0];
  assert.equal(changed.passed, false);
  assert.equal(changed.issues.length, 3);
  assert.equal(verifyCatalogueBaseline([prior], [])[0].passed, false);
  assert.equal(verifyCatalogueBaseline([prior], [current, current])[0].passed, false);
});

test('file verification reads exact bytes, rejects mismatches and stays inside the required root', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'whatsite-continuation-verifier-'));
  const target = path.join(directory, 'fixture.txt');
  const bytes = Buffer.from('Read-only verification fixture.');
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  fs.writeFileSync(target, bytes);
  try {
    assert.equal(verifyFile(target, bytes.length, sha256, directory).passed, true);
    assert.equal(verifyFile(target, bytes.length + 1, sha256, directory).passed, false);
    assert.equal(verifyFile(target, bytes.length, '0'.repeat(64), directory).passed, false);
    assert.equal(verifyFile(path.join(directory, 'missing.txt'), bytes.length, sha256, directory).passed, false);
    assert.match(verifyFile(path.resolve(directory, '../outside.txt'), bytes.length, sha256, directory).reason, /outside/);
    assert.deepEqual(fs.readFileSync(target), bytes);
  } finally {
    fs.unlinkSync(target);
    fs.rmdirSync(directory);
  }
});
