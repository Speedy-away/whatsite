(() => {
    'use strict';

    const ATTEMPT_TTL_MS = 20 * 60 * 1000;
    const MINIMUM_PROVIDER_TIME_MS = 3 * 1000;
    const GRANT_TTL_MS = 2 * 60 * 1000;
    const ATTEMPT_KEY = 'scooby_access_attempt';
    // Scooby is one global key: every product mapped to the same server-side
    // policy, so they all collapse to 'scooby'. The old per-game ids are still
    // accepted so existing links and stored pending values keep working.
    const LEGACY_SCOOBY = new Set([
        'gta5', 'rdr2', 'cs2', 'gmod', 'fivem', 'spoofer', 'l4d', 'sbox', 'tlou'
    ]);
    const PRODUCTS = new Set(['scooby', 'nenyoo-gtav', 'nenyoo-fivem', ...LEGACY_SCOOBY]);

    const isNenyooProduct = product => typeof product === 'string' && product.startsWith('nenyoo-');
    // Fold any legacy Scooby id down to the single global key.
    const normalise = product => (LEGACY_SCOOBY.has(product) ? 'scooby' : product);
    const productPath = product => isNenyooProduct(product)
        ? `free-keys/nenyoo/?product=${encodeURIComponent(product)}`
        : 'free-keys/scooby/';

    const blocked = document.getElementById('blockedContent');
    const selector = document.getElementById('selectorContent');
    const parameters = new URLSearchParams(window.location.search);

    // Nenyoo has its own return page and its own provider link; Scooby spreads
    // bypass-page traffic over the same pool scoobyontop.html uses.
    const pageBrand = document.body.dataset.keyBrand === 'nenyoo' ? 'nenyoo' : 'scooby';
    const PROVIDER_URLS = pageBrand === 'nenyoo'
        ? ['https://bstlar.com/F/N3NYOOfreeKEY']
        : [
            'https://bstlar.com/F/ScoobyKEY',
            'https://bstlar.com/F/ScoobyKEY2',
            'https://bstlar.com/F/ScoobyKEY4'
        ];
    const providerLink = document.querySelector('#blockedContent .primary-button, .blocked-panel .primary-button');
    if (providerLink) {
        providerLink.href = PROVIDER_URLS[Math.floor(Math.random() * PROVIDER_URLS.length)];
    }

    // Local-only preview for testing the blocked copy even after this browser
    // has already completed the access flow. It has no effect on production.
    const localBlockedPreview = (window.location.hostname === '127.0.0.1' ||
        window.location.hostname === 'localhost') && parameters.get('preview') === 'blocked';
    if (localBlockedPreview) {
        blocked.classList.remove('hidden');
        selector.classList.add('hidden');
        return;
    }

    const safeGet = (storage, key) => {
        try { return storage.getItem(key); } catch (_) { return null; }
    };
    const safeSet = (storage, key, value) => {
        try { storage.setItem(key, value); } catch (_) { /* Storage may be disabled. */ }
    };
    const safeRemove = (storage, key) => {
        try { storage.removeItem(key); } catch (_) { /* Storage may be disabled. */ }
    };

    const decode = value => atob(value);
    const allowedReferrers = [
        'YnN0bGFyLmNvbQ==', 'YnN0bGFyLm5ldA==', 'YnN0Lmdn', 'Ym9vc3QuaW5r', 'Ym9vc3Rpbms='
    ].map(decode);
    // Rotated. The previous values are retired, so a link carrying an old ref
    // no longer passes on its own.
    const validRefParameters = [
        decode('Z1NxYnNnT25pYkhyRHlhd2hkakozX2p1bkNvWWUydktEOXhpdk43aXRnWQ==')
    ];
    const validTokens = [];
    // Returned by the Nenyoo provider link.
    const nenyooRefParameter = decode('bmVueW9vX0J6QUE1b1VrVEI0N2h1ZldSbjNpMlY=');

    const referrer = document.referrer.toLowerCase();
    const refParameter = parameters.get('ref');

    // Each brand's ref belongs to that brand's return page. A Nenyoo return
    // therefore cannot land on the Scooby selector, or the other way round.
    // With no ref at all we still accept a trusted provider referrer.
    const refBrand = refParameter === nenyooRefParameter ? 'nenyoo'
        : validRefParameters.includes(refParameter) ? 'scooby'
        : '';
    const hasReturnSignal = refBrand
        ? refBrand === pageBrand
        : allowedReferrers.some(domain => referrer.includes(domain)) ||
          validTokens.includes(parameters.get('token'));

    // The attempt is written to both stores: sessionStorage for the same-tab
    // path, localStorage for when the provider was opened in a new tab.
    const clearAttempt = () => {
        safeRemove(sessionStorage, ATTEMPT_KEY);
        safeRemove(localStorage, ATTEMPT_KEY);
    };

    let attempt = null;
    try {
        const raw = safeGet(sessionStorage, ATTEMPT_KEY) || safeGet(localStorage, ATTEMPT_KEY);
        attempt = JSON.parse(raw || 'null');
    } catch (_) {
        attempt = null;
    }
    const now = Date.now();
    const validAttempt = attempt &&
        typeof attempt.id === 'string' &&
        attempt.id.length >= 32 &&
        Number.isFinite(attempt.startedAt) &&
        attempt.startedAt <= now &&
        now - attempt.startedAt >= MINIMUM_PROVIDER_TIME_MS &&
        now - attempt.startedAt <= ATTEMPT_TTL_MS &&
        (!attempt.product || PRODUCTS.has(attempt.product));
    // A valid ref, token, or referrer is enough on its own. The stored attempt
    // is now only used to remember which product the visitor came for.
    const authorized = hasReturnSignal;

    if (parameters.has('ref') || parameters.has('token')) {
        window.history.replaceState({}, '', window.location.pathname);
    }

    if (!authorized) {
        clearAttempt();
        blocked.classList.remove('hidden');
        selector.classList.add('hidden');
        return;
    }

    // The return from the access provider is single-use as well.
    clearAttempt();
    blocked.classList.add('hidden');
    selector.classList.remove('hidden');

    const createToken = () => {
        if (!window.crypto || typeof window.crypto.getRandomValues !== 'function') return '';
        const bytes = new Uint8Array(24);
        window.crypto.getRandomValues(bytes);
        return Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
    };

    let grantIssued = false;
    const issueGrant = product => {
        if (grantIssued || !PRODUCTS.has(product)) return '';
        // A page only ever grants its own brand's products.
        if ((isNenyooProduct(product) ? 'nenyoo' : 'scooby') !== pageBrand) return '';
        const token = createToken();
        if (!token) return '';
        const issuedAt = Date.now();
        const grant = { product, token, issuedAt, expiresAt: issuedAt + GRANT_TTL_MS };
        safeSet(sessionStorage, `scooby_one_time_grant_${product}`, JSON.stringify(grant));
        grantIssued = true;
        return token;
    };

    const navigateWithGrant = (product, href) => {
        const token = issueGrant(product);
        if (!token) {
            blocked.classList.remove('hidden');
            selector.classList.add('hidden');
            return;
        }
        const destination = new URL(href, window.location.href);
        destination.searchParams.set('grant', token);
        window.location.replace(destination.href);
    };

    const pending = safeGet(localStorage, 'scooby_pending_product');
    const attemptProduct = attempt && attempt.product;
    const requestedProduct = normalise(
        attemptProduct && PRODUCTS.has(attemptProduct)
            ? attemptProduct
            : (pending && PRODUCTS.has(pending) ? pending : ''));
    if (requestedProduct) {
        safeRemove(localStorage, 'scooby_pending_product');
        navigateWithGrant(requestedProduct, productPath(requestedProduct));
        return;
    }

    // Authorised, but we never learned which product they came for — they hit
    // the provider link directly rather than starting from a product page.
    // There is no chooser any more, so explain that instead.
    blocked.classList.remove('hidden');
    selector.classList.add('hidden');
    const note = document.getElementById('noProductNote');
    if (note) note.classList.remove('hidden');
})();
