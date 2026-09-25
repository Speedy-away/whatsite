const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// The resolver moved into the shared key.js when the per-product pages were
// merged into one page per brand. Extract just that function and exercise it.
const source = fs.readFileSync(path.join(__dirname, '../key.js'), 'utf8');
const start = source.indexOf('    const resolveLoaderUrl =');
const end = source.indexOf('    if (brand.downloadManifests)');
assert.ok(start !== -1 && end > start, 'resolveLoaderUrl not found in key.js');
const resolver = source.slice(start, end);

const MANIFESTS = [
  'https://nenyoomenu.com/loader-download.json',
  'https://raw.githubusercontent.com/walteryo1337/NENYOO-WEB/main/loader-download.json'
];
const FALLBACK = 'https://nenyoomenu.com/downloads';

async function resolve(responses) {
  const calls = [];
  const context = {URL, AbortController, setTimeout, clearTimeout, fetch: async (url, options) => {
    calls.push({url, options});
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return {ok: !!response, json: async () => response};
  }};
  vm.createContext(context);
  vm.runInContext(
    `${resolver}\nglobalThis.result = resolveLoaderUrl(${JSON.stringify(MANIFESTS)}, ${JSON.stringify(FALLBACK)});`,
    context
  );
  return {url: await context.result, calls};
}

test('uses the published manifest and omits credentials', async () => {
  const result = await resolve([{url: 'https://filego.at/bucket/new-release'}]);
  assert.equal(result.url, 'https://filego.at/bucket/new-release');
  assert.equal(result.calls.length, 1);
  assert.match(result.calls[0].url, /loader-download\.json$/);
  assert.equal(result.calls[0].options.credentials, 'omit');
});

test('CORS or network failure uses the hosting repository manifest', async () => {
  const result = await resolve([new Error('CORS'), {url: 'https://filego.at/bucket/fallback'}]);
  assert.equal(result.url, 'https://filego.at/bucket/fallback');
  assert.match(result.calls[1].url, /raw\.githubusercontent\.com/);
});

test('rejects unsafe links and falls back to the downloads page', async () => {
  for (const url of [
    'javascript:alert(1)',
    'https://filego.at.evil.test/bucket/x',
    'https://evil@filego.at/bucket/x',
    'http://filego.at/bucket/x',
    'https://filego.at/bucket/x?redirect=evil'
  ]) {
    const result = await resolve([{url}, {url}]);
    assert.equal(result.url, FALLBACK, `should have rejected ${url}`);
  }
});
