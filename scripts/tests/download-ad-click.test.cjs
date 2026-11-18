'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const PhoneDownloads = require('../../assets/mobile-downloads.js');
const {applyAds, publishAds} = require('../site-ads.cjs');

function runtime() {
  let click;
  const opened = [];
  const document = {
    baseURI: 'https://whatwhatboy.com/console/ps4/apps.html',
    addEventListener(type, listener) { if (type === 'click') click = listener; },
    getElementById() { return null; }
  };
  const window = {PhoneDownloads, open(...args) { opened.push(args); }};
  vm.runInNewContext(fs.readFileSync('assets/site-ads.js', 'utf8'), {document, window, URL});
  function press(href, options = {}) {
    const link = {
      textContent: options.label || 'Download',
      getAttribute(name) { return name === 'href' ? href : null; },
      hasAttribute(name) { return name === 'download' && options.explicit === true; },
      closest() { return options.navigation ? {} : null; },
      matches() { return options.receiver === true; }
    };
    click({isTrusted: true, button: 0, target: {closest() { return link; }}, ...options.event});
  }
  return {opened, press, window};
}

test('page load, ordinary navigation and download directory links never open an ad', () => {
  const app = runtime();
  assert.equal(app.opened.length, 0);
  for (const href of ['/', '/downloads/', '/console/ps4/apps.html', '#downloads', 'javascript:alert(1)']) app.press(href);
  app.press('/downloads/pinned.pkg', {navigation: true});
  app.press('/downloads/pinned.pkg', {receiver: true});
  assert.equal(app.opened.length, 0);
});

test('real download clicks open one separate ad without cancelling or altering the file link', () => {
  const app = runtime();
  const href = 'https://github.com/owner/project/releases/download/v1.0/pinned.pkg';
  app.press(href);
  app.press('/downloads/pinned.pkg', {event: {button: 0, detail: 0}}); // keyboard activation
  assert.equal(app.opened.length, 2);
  assert.deepEqual(app.opened[0], ['https://araplhn.org/4/ac85b864baf2e2322b99cd2ad051fbc2', '_blank', 'noopener,noreferrer']);
  // No preventDefault or navigation methods are provided: downloads must remain native.
  app.window.open = () => { throw new Error('Popup blocked'); };
  assert.doesNotThrow(() => app.press('/downloads/pinned.pkg'));
});

test('cancelled, modified and synthetic download clicks do not trigger ads', () => {
  const app = runtime();
  for (const event of [{defaultPrevented: true}, {isTrusted: false}, {ctrlKey: true}, {metaKey: true}, {shiftKey: true}, {altKey: true}, {button: 1}]) {
    app.press('/downloads/pinned.pkg', {event});
  }
  assert.equal(app.opened.length, 0);
});

test('local and published pages remove the specified automatic popunder', () => {
  const html = '<html><head><script data-cfasync="false" src="https://abscloud.org/1/366a2e3edafab888009b3076fcd47b82"></script></head><body><main id="main-content">Content</main></body></html>';
  for (const render of [applyAds, publishAds]) {
    for (const name of ['index.html', 'console/ps4/apps.html', 'fr/index.html']) {
      const out = render(name, html);
      assert.doesNotMatch(out, /abscloud\.org/);
      assert.match(out, /site-ads\.js\?v=4/);
      assert.equal(render(name, out), out);
    }
  }
  const noindex = html.replace('<head>', '<head><meta name="robots" content="noindex, nofollow">');
  assert.doesNotMatch(publishAds('free-keys/nenyoo/index.html', noindex), /abscloud\.org/);
  assert.doesNotMatch(applyAds('free-keys/sponsor-frame.html', noindex), /abscloud\.org/);
});
