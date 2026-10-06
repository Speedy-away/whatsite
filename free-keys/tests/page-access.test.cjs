const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../page-access.js'), 'utf8');

function setup(options = {}) {
    const state = { cosmetic: false, network: false, offline: false, control: true, ...options };
    const nodes = [], calls = [];
    function element(tag) {
        const node = { tag, style: {}, isConnected: true, listeners: {},
            get offsetWidth() { return state.cosmetic ? 0 : 10; },
            get offsetHeight() { return state.cosmetic ? 0 : 10; },
            setAttribute() {}, remove() { this.isConnected = false; },
            addEventListener(type, fn) { this.listeners[type] = fn; },
            focus() {}, showModal() { this.open = true; }, close() { this.open = false; },
            querySelector(selector) { return this.children[selector] ||= element('child'); }, children: {}
        };
        nodes.push(node);
        return node;
    }
    const context = { URL, AbortController, navigator: { get onLine() { return !state.offline; } },
        document: { currentScript: { src: 'https://site.test/free-keys/page-access.js' },
            readyState: 'loading', addEventListener() {}, createElement: element,
            body: { appendChild() {} }, documentElement: { classList: { add() {}, remove() {} } } },
        setTimeout(fn, ms) { return ms < 1000 ? setTimeout(fn, 0) : setTimeout(fn, ms); },
        clearTimeout, getComputedStyle: () => ({ display: 'block', visibility: 'visible' }),
        fetch: async url => {
            calls.push(url);
            if (url.startsWith('https://site.test/')) return { ok: state.control };
            if (state.network || (state.oneHost && url.includes('abscloud'))) throw new Error('blocked');
            return { type: 'opaque', ok: false };
        }
    };
    context.window = context;
    vm.runInNewContext(source, context);
    return { state, nodes, calls, guard: context.freeKeyAccess };
}
async function until(predicate) {
    for (let i = 0; i < 100; i++) {
        if (predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 2));
    }
    assert.fail('Expected state was not reached');
}

test('opaque successful ad requests pass without a popup', async () => {
    const { guard, nodes } = setup();
    await guard.requireClear();
    assert.equal(guard.blocked, false);
    assert.equal(nodes.some(node => node.tag === 'dialog'), false);
});
test('cosmetic filtering pauses callers and retry resumes them in place', async () => {
    const { guard, nodes, state } = setup({ cosmetic: true });
    let resumed = false;
    const pending = guard.requireClear();
    assert.equal(guard.requireClear(), pending);
    pending.then(() => { resumed = true; });
    await until(() => nodes.some(node => node.open));
    const dialog = nodes.find(node => node.tag === 'dialog');
    assert.equal(resumed, false);
    let prevented = false;
    dialog.listeners.cancel({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    state.cosmetic = false;
    await dialog.querySelector('button').listeners.click();
    await pending;
    assert.equal(resumed, true);
    assert.equal(dialog.open, false);
});
test('network-only blocking is confirmed twice and opens the popup', async () => {
    const { guard, nodes, calls } = setup({ network: true });
    guard.requireClear();
    await until(() => nodes.some(node => node.open));
    assert.equal(guard.blocked, true);
    assert.equal(calls.filter(url => !url.startsWith('https://site.test/')).length, 4);
});
test('offline, unavailable control and a single failed ad host do not accuse a blocker', async () => {
    for (const options of [{ offline: true }, { network: true, control: false }, { oneHost: true }]) {
        const { guard, nodes } = setup(options);
        await guard.requireClear();
        assert.equal(nodes.some(node => node.open), false);
    }
});
test('a retry that is still blocked keeps the popup open and restores its button', async () => {
    const { guard, nodes } = setup({ cosmetic: true });
    guard.requireClear();
    await until(() => nodes.some(node => node.open));
    const dialog = nodes.find(node => node.tag === 'dialog');
    await dialog.querySelector('button').listeners.click();
    assert.equal(dialog.open, true);
    assert.equal(dialog.querySelector('button').disabled, false);
});
