/*
 * Adds the i18n <script> tag to every page that does not already have it.
 *
 *   node tools/i18n-inject.js          apply
 *   node tools/i18n-inject.js --check  report only, change nothing
 *
 * Safe to re-run: pages that already reference i18n.js are skipped, so new
 * pages just need this run again.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TAG = '<script src="/languages/i18n.js"></script>';
const CHECK = process.argv.includes('--check');
const SKIP_DIRS = ['.git', '.claude', 'backup', 'node_modules', 'i18n-tools', 'languages', 'api', 'css2', 'css2-1'];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

let added = 0, already = 0, failed = 0;

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  let html = fs.readFileSync(file, 'utf8');

  if (html.includes('/languages/i18n.js')) { already++; continue; }

  // Load in <head> (not deferred) so the anti-flash cloak applies before paint.
  let out;
  if (/<\/head>/i.test(html)) {
    out = html.replace(/<\/head>/i, '  ' + TAG + '\n</head>');
  } else if (/<body[^>]*>/i.test(html)) {
    out = html.replace(/(<body[^>]*>)/i, '$1\n' + TAG);
  } else {
    console.log('  SKIP (no <head> or <body>):', rel);
    failed++;
    continue;
  }

  if (!CHECK) fs.writeFileSync(file, out, 'utf8');
  console.log((CHECK ? '  would add ' : '  added    ') + rel);
  added++;
}

console.log('\n' + (CHECK ? 'check' : 'done') + ': ' + added + ' to update, ' +
            already + ' already wired, ' + failed + ' skipped');
