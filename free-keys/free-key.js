(() => {
    'use strict';

    const GRANT_TTL_MS = 2 * 60 * 1000;
    const PRODUCTS = new Set(['gta5', 'rdr2', 'cs2', 'gmod', 'fivem', 'spoofer']);
    const product = document.body.dataset.product;
    if (!PRODUCTS.has(product)) return;

    const safeGet = (storage, key) => { try { return storage.getItem(key); } catch (_) { return null; } };
    const safeSet = (storage, key, value) => { try { storage.setItem(key, value); } catch (_) {} };
    const safeRemove = (storage, key) => { try { storage.removeItem(key); } catch (_) {} };

    // Preserve the sponsor hand-off as a UX step. The security boundary is the
    // server-issued IP-bound challenge and verified Turnstile result below.
    const parameters = new URLSearchParams(window.location.search);
    const presentedToken = parameters.get('grant') || '';
    const grantKey = `scooby_one_time_grant_${product}`;
    let storedGrant = null;
    try { storedGrant = JSON.parse(safeGet(sessionStorage, grantKey) || 'null'); } catch (_) {}
    const now = Date.now();
    const validGrant = storedGrant && storedGrant.product === product &&
        storedGrant.token === presentedToken && Number.isFinite(storedGrant.issuedAt) &&
        Number.isFinite(storedGrant.expiresAt) && storedGrant.issuedAt <= now &&
        storedGrant.expiresAt >= now && storedGrant.expiresAt - storedGrant.issuedAt <= GRANT_TTL_MS;
    safeRemove(sessionStorage, grantKey);

    if (!validGrant) {
        safeSet(localStorage, 'scooby_pending_product', product);
        window.location.replace(`/scoobyontop.html?product=${encodeURIComponent(product)}`);
        return;
    }

    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('grant');
    window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);

    // A page restored from the back-forward cache must not reveal a key after
    // its one-time navigation grant has already been consumed.
    window.addEventListener('pageshow', event => {
        if (!event.persisted) return;
        safeSet(localStorage, 'scooby_pending_product', product);
        window.location.replace(`/scoobyontop.html?product=${encodeURIComponent(product)}`);
    });

    const config = window.SCOOBY_ACCESS_KEY_CONFIG || {};
    const apiBase = String(config.apiBase || '').replace(/\/$/, '');
    const portalKey = String(config.portalKey || '');
    const policySlug = String((config.policies || {})[product] || '');
    const keyOutput = document.getElementById('keyOutput');
    const copyButton = document.getElementById('copyButton');
    const timerText = document.getElementById('timerText');
    const timerFill = document.getElementById('timerFill');
    const blockMessage = document.getElementById('blockMessage');
    const bait = document.getElementById('adBait');
    let currentKey = '';
    let issuedAt = 0;
    let expiresAt = 0;

    const showError = message => {
        keyOutput.textContent = 'KEY UNAVAILABLE';
        blockMessage.textContent = message || 'Access-key generation is temporarily unavailable.';
        blockMessage.classList.add('show');
        copyButton.disabled = true;
    };

    const api = async (path, options = {}) => {
        const response = await fetch(`${apiBase}${path}`, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
        });
        let payload = {};
        try { payload = await response.json(); } catch (_) {}
        if (!response.ok || !payload.success) {
            throw new Error(payload.message || `Request failed (${response.status})`);
        }
        return payload;
    };

    const loadTurnstile = () => new Promise((resolve, reject) => {
        if (window.turnstile) { resolve(window.turnstile); return; }
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.turnstile);
        script.onerror = () => reject(new Error('Could not load the site verification challenge.'));
        document.head.appendChild(script);
    });

    const issueKey = async (challengeId, token) => {
        const issued = await api(`/api/portal/v1/${encodeURIComponent(portalKey)}/access-keys/issue`, {
            method: 'POST',
            body: JSON.stringify({ challenge_id: challengeId, turnstile_token: token })
        });
        currentKey = issued.key;
        issuedAt = Date.now();
        expiresAt = Date.parse(issued.expires_at);
        keyOutput.textContent = currentKey;
        copyButton.textContent = 'Copy access key';
        copyButton.disabled = false;
        blockMessage.classList.remove('show');
    };

    const beginChallenge = async () => {
        keyOutput.textContent = 'PREPARING CHALLENGE…';
        const root = `/api/portal/v1/${encodeURIComponent(portalKey)}`;
        const metadata = await api(`${root}/access-key-policies/${encodeURIComponent(policySlug)}`);
        const challenge = await api(`${root}/access-keys/challenge`, {
            method: 'POST',
            body: JSON.stringify({ policy_slug: policySlug, integration_id: metadata.policy.integration_id })
        });
        if (challenge.challenge.turnstile_required === false) {
            keyOutput.textContent = 'GENERATING KEY…';
            await issueKey(challenge.challenge.id, '');
            return;
        }
        if (!challenge.challenge.site_key) {
            throw new Error('Turnstile is enabled but the site key is missing.');
        }
        const turnstile = await loadTurnstile();
        let host = document.getElementById('turnstileHost');
        if (!host) {
            host = document.createElement('div');
            host.id = 'turnstileHost';
            host.style.margin = '16px auto';
            host.style.display = 'flex';
            host.style.justifyContent = 'center';
            keyOutput.insertAdjacentElement('afterend', host);
        }
        host.replaceChildren();
        keyOutput.textContent = 'COMPLETE VERIFICATION';
        turnstile.render(host, {
            sitekey: challenge.challenge.site_key,
            action: challenge.challenge.action,
            cData: challenge.challenge.cdata,
            theme: 'dark',
            callback: token => issueKey(challenge.challenge.id, token).catch(error => showError(error.message)),
            'error-callback': () => showError('Site verification failed. Reload and try again.'),
            'expired-callback': () => showError('Site verification expired. Reload and try again.')
        });
    };

    const copyKey = async () => {
        if (!currentKey) return;
        try { await navigator.clipboard.writeText(currentKey); }
        catch (_) {
            const field = document.createElement('textarea');
            field.value = currentKey;
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
    };

    const updateTimer = () => {
        if (!expiresAt || !Number.isFinite(expiresAt)) {
            timerText.textContent = 'Awaiting issuance';
            timerFill.style.width = '0%';
            return;
        }
        const remaining = Math.max(0, expiresAt - Date.now());
        const seconds = Math.ceil(remaining / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        timerText.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        timerFill.style.width = `${Math.max(0, Math.min(100, remaining / Math.max(1, expiresAt - issuedAt) * 100))}%`;
        if (remaining === 0 && currentKey) {
            currentKey = '';
            keyOutput.textContent = 'KEY EXPIRED';
            copyButton.disabled = true;
        }
    };

    copyButton.addEventListener('click', copyKey);
    window.setInterval(updateTimer, 1000);
    updateTimer();

    if (!apiBase || portalKey.startsWith('REPLACE_') || !policySlug || policySlug.startsWith('REPLACE_')) {
        showError('This product has not been connected to its ProudlyServer access-key policy yet.');
        return;
    }

    window.setTimeout(() => {
        const style = bait ? window.getComputedStyle(bait) : null;
        if (!bait || bait.offsetHeight === 0 || bait.offsetWidth === 0 || !style ||
            style.display === 'none' || style.visibility === 'hidden') {
            showError('A content blocker hid a required page element. Allow this site, then reload.');
            return;
        }
        beginChallenge().catch(error => showError(error.message));
    }, 850);
})();
