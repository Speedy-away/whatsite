(() => {
    'use strict';

    const ROTATION_SECONDS = 4 * 60 * 60;
    const GRANT_TTL_MS = 2 * 60 * 1000;
    const PRODUCTS = {
        gta5: { name: 'GTA V', prefix: 'GTA5' },
        rdr2: { name: 'Red Dead Redemption 2', prefix: 'RDR2' },
        cs2: { name: 'Counter-Strike 2', prefix: 'CS2' },
        gmod: { name: "Garry's Mod", prefix: 'GMOD' },
        fivem: { name: 'FiveM', prefix: 'FIVEM' },
        redm: { name: 'RedM', prefix: 'REDM' },
        spoofer: { name: 'Spoofer', prefix: 'SPOOFER' }
    };

    const product = document.body.dataset.product;
    const definition = PRODUCTS[product];
    if (!definition) return;

    const safeGet = (storage, key) => {
        try { return storage.getItem(key); } catch (_) { return null; }
    };
    const safeSet = (storage, key, value) => {
        try { storage.setItem(key, value); } catch (_) { /* Storage may be disabled. */ }
    };
    const safeRemove = (storage, key) => {
        try { storage.removeItem(key); } catch (_) { /* Storage may be disabled. */ }
    };

    const parameters = new URLSearchParams(window.location.search);
    const presentedToken = parameters.get('grant') || '';
    const grantKey = `scooby_one_time_grant_${product}`;
    let storedGrant = null;
    try {
        storedGrant = JSON.parse(safeGet(sessionStorage, grantKey) || 'null');
    } catch (_) {
        storedGrant = null;
    }

    const now = Date.now();
    const validGrant = storedGrant &&
        storedGrant.product === product &&
        typeof storedGrant.token === 'string' &&
        storedGrant.token.length >= 32 &&
        storedGrant.token === presentedToken &&
        Number.isFinite(storedGrant.issuedAt) &&
        Number.isFinite(storedGrant.expiresAt) &&
        storedGrant.issuedAt <= now &&
        storedGrant.expiresAt >= now &&
        storedGrant.expiresAt - storedGrant.issuedAt <= GRANT_TTL_MS;

    // Consume before displaying anything. A refresh, copied URL, browser history
    // restore, or second tab cannot reuse the same grant.
    safeRemove(sessionStorage, grantKey);

    if (!validGrant) {
        safeSet(localStorage, 'scooby_pending_product', product);
        window.location.replace(`/scoobyontop.html?product=${encodeURIComponent(product)}`);
        return;
    }

    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('grant');
    window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);

    // Browsers can restore a fully rendered page from the back-forward cache
    // without re-running this script. Treat that restore as a new visit so the
    // already-consumed grant cannot reveal the key again.
    window.addEventListener('pageshow', event => {
        if (!event.persisted) return;
        safeSet(localStorage, 'scooby_pending_product', product);
        window.location.replace(`/scoobyontop.html?product=${encodeURIComponent(product)}`);
    });

    const keyOutput = document.getElementById('keyOutput');
    const copyButton = document.getElementById('copyButton');
    const timerText = document.getElementById('timerText');
    const timerFill = document.getElementById('timerFill');
    const blockMessage = document.getElementById('blockMessage');
    const bait = document.getElementById('adBait');
    let keyEnabled = false;

    function secret() {
        const encoded = [9, 57, 106, 106, 56, 35, 23, 105, 52, 47, 17, 105, 35, 104, 106, 104, 108, 123];
        return encoded.map(value => String.fromCharCode(value ^ 90)).join('');
    }

    function fnv1a(value) {
        let hash = 2166136261;
        for (let index = 0; index < value.length; index += 1) {
            hash ^= value.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function segment(value, length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let output = '';
        let hash = value >>> 0;
        for (let index = 0; index < length; index += 1) {
            output += characters[hash % 36];
            hash = Math.floor(hash / 36);
        }
        return output;
    }

    function keyFor(seed) {
        const material = `${seed}|${product}|`;
        const keySecret = secret();
        const first = segment(fnv1a(`${material}1|${keySecret}`), 4);
        const second = segment(fnv1a(`${material}2|${keySecret}`), 4);
        const third = segment(fnv1a(`${material}3|${keySecret}`), 4);
        return `SCOOBY-${definition.prefix}-${first}-${second}-${third}`;
    }

    function updateKeyAndTimer() {
        const nowSeconds = Math.floor(Date.now() / 1000);
        const seed = Math.floor(nowSeconds / ROTATION_SECONDS);
        const remaining = ROTATION_SECONDS - (nowSeconds % ROTATION_SECONDS);
        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;

        if (keyEnabled) keyOutput.textContent = keyFor(seed);
        timerText.textContent = [hours, minutes, seconds]
            .map(value => String(value).padStart(2, '0')).join(':');
        timerFill.style.width = `${((ROTATION_SECONDS - remaining) / ROTATION_SECONDS) * 100}%`;
    }

    async function copyKey() {
        if (!keyEnabled) return;
        const value = keyOutput.textContent;
        try {
            await navigator.clipboard.writeText(value);
        } catch (_) {
            const field = document.createElement('textarea');
            field.value = value;
            field.setAttribute('readonly', '');
            field.style.position = 'fixed';
            field.style.opacity = '0';
            document.body.appendChild(field);
            field.select();
            document.execCommand('copy');
            field.remove();
        }
        const original = copyButton.textContent;
        copyButton.textContent = 'Copied';
        window.setTimeout(() => { copyButton.textContent = original; }, 1600);
    }

    copyButton.addEventListener('click', copyKey);
    updateKeyAndTimer();
    window.setInterval(updateKeyAndTimer, 1000);

    window.setTimeout(() => {
        const baitStyle = bait ? window.getComputedStyle(bait) : null;
        const blocked = !bait || bait.offsetHeight === 0 || bait.offsetWidth === 0 ||
            !baitStyle || baitStyle.display === 'none' || baitStyle.visibility === 'hidden';
        if (blocked) {
            keyOutput.textContent = 'KEY LOCKED';
            copyButton.disabled = true;
            blockMessage.classList.add('show');
            return;
        }
        keyEnabled = true;
        copyButton.disabled = false;
        updateKeyAndTimer();
    }, 850);
})();
