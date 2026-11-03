'use strict';
// Update only authored KARO package locations after the requested repository move.
// Preserve all former URLs, versions, checksums and physical archive files.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
async function main() {
  const revision = process.argv[2];
  assert.match(revision || '', /^[a-f0-9]{40}$/);
  const auditPath = path.join(root, 'docs/download-audit.json');
  const before = JSON.parse(fs.readFileSync(auditPath));
  const jobs = before.items.filter(item => item.id.startsWith('karo-ready-')).flatMap(item => item.files.map(file => {
    assert.match(file.local || '', /^\/downloads\/hosts\/karo\//);
    const url = 'https://raw.githubusercontent.com/Speedy-away/WWB-HOST/' + revision + file.local;
    return {id: item.id, name: file.name, bytes: file.bytes, sha256: file.sha256, local: file.local, url};
  }));
  let next = 0;
  await Promise.all(Array.from({length: 4}, async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      const response = await fetch(job.url, {method: 'HEAD', signal: AbortSignal.timeout(45000)});
      assert.equal(response.status, 200, job.url);
      assert.equal(Number(response.headers.get('content-length')), job.bytes, job.url);
    }
  }));
  const urls = new Map(jobs.map(job => [job.id + '\0' + job.name, job.url]));
  const now = new Date().toISOString(), retained = [];
  // Read fresh after network checks so unrelated archive additions are retained.
  const original = fs.readFileSync(auditPath), audit = JSON.parse(original);
  for (const item of audit.items.filter(item => item.id.startsWith('karo-ready-'))) {
    retained.push(JSON.parse(JSON.stringify(item)));
    const mapped = item.files.map(file => {
      const url = urls.get(item.id + '\0' + file.name);
      assert.ok(url, 'Unexpected concurrent KARO package; rerun with the latest inventory');
      return {...file, previousSourceUrls: [...new Set([...(file.previousSourceUrls || []), file.sourceUrl, file.resolvedUrl].filter(Boolean))], sourceUrl: url, resolvedUrl: url, repositoryMigrationCheckedAt: now};
    });
    item.sourceUrls = [...new Set([...(item.sourceUrls || []), item.url, ...mapped.map(file => file.sourceUrl)].filter(Boolean))];
    item.url = mapped[0].sourceUrl;
    item.files = mapped;
  }
  const history = path.join(root, 'docs/host-reviews/karo/retained');
  fs.mkdirSync(history, {recursive: true});
  const digest = crypto.createHash('sha256').update(JSON.stringify(retained)).digest('hex').slice(0, 16);
  const saved = path.join(history, 'package-urls-before-migration-' + digest + '.json');
  if (!fs.existsSync(saved)) fs.writeFileSync(saved, JSON.stringify(retained, null, 2) + '\n', {flag: 'wx'});
  assert.ok(fs.readFileSync(auditPath).equals(original), 'Inventory changed; rerun without overwriting concurrent additions');
  audit.updated = now;
  fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2) + '\n');
  const report = {checkedAt: now, repository: 'https://github.com/Speedy-away/WWB-HOST', revision, packages: jobs.length, status: 'verified-and-migrated', priorMetadata: path.relative(root, saved).replaceAll('\\', '/'), filesMovedOrDeleted: 0, jobs};
  fs.writeFileSync(path.join(root, 'docs/host-reviews/karo/archive-repository-migration.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({...report, jobs: undefined}));
}
if (require.main === module) main().catch(error => {console.error(error.message); process.exitCode = 1;});
