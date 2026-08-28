(() => {
    'use strict';

    const ATTEMPT_TTL_MS = 20 * 60 * 1000;
    const MINIMUM_PROVIDER_TIME_MS = 3 * 1000;
    const GRANT_TTL_MS = 2 * 60 * 1000;
    const ATTEMPT_KEY = 'scooby_access_attempt';
    const PRODUCTS = new Set(['gta5', 'rdr2', 'cs2', 'gmod', 'fivem', 'redm', 'spoofer']);
    const blocked = document.getElementById('blockedContent');
    const selector = document.getElementById('selectorContent');
    const parameters = new URLSearchParams(window.location.search);

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
    const validRefParameters = [
        decode('UnU1SjltTTR0blota210ZzR2ZmN4eWt1RV83UjAxRVZiUHJLazh5VXYwVQ=='),
        decode('djJfazN5XzRjYzNzc18yMDI2')
    ];
    const validTokens = [decode('c2Nvb2J5MjAyNQ=='), decode('c2Nvb2J5X3YyXzIwMjY=')];

    const referrer = document.referrer.toLowerCase();
    const hasReturnSignal = allowedReferrers.some(domain => referrer.includes(domain)) ||
        validRefParameters.includes(parameters.get('ref')) || validTokens.includes(parameters.get('token'));

    let attempt = null;
    try {
        attempt = JSON.parse(safeGet(sessionStorage, ATTEMPT_KEY) || 'null');
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
    const authorized = hasReturnSignal && validAttempt;

    if (parameters.has('ref') || parameters.has('token')) {
        window.history.replaceState({}, '', window.location.pathname);
    }

    if (!authorized) {
        safeRemove(sessionStorage, ATTEMPT_KEY);
        blocked.classList.remove('hidden');
        selector.classList.add('hidden');
        return;
    }

    // The return from the access provider is single-use as well.
    safeRemove(sessionStorage, ATTEMPT_KEY);
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
    const requestedProduct = attempt.product && PRODUCTS.has(attempt.product)
        ? attempt.product
        : (pending && PRODUCTS.has(pending) ? pending : '');
    if (requestedProduct) {
        safeRemove(localStorage, 'scooby_pending_product');
        navigateWithGrant(requestedProduct, `/free-keys/${requestedProduct}.html`);
        return;
    }

    document.querySelectorAll('[data-key-product]').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const product = link.dataset.keyProduct;
            if (!PRODUCTS.has(product)) {
                return;
            }
            safeRemove(localStorage, 'scooby_pending_product');
            navigateWithGrant(product, link.href);
        });
    });
})();
