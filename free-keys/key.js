(() => {
    'use strict';

    const GRANT_TTL_MS = 2 * 60 * 1000;

    // One catalogue for both brands. Each brand has a single key page that
    // reads ?product= and dresses itself from this table, which is why the
    // per-product HTML files no longer exist.
    const CATALOGUE = {
        scooby: {
            entry: '../../scoobyontop.html',
            home: 'https://scoobymenu.cc/',
            providers: [
                'https://bstlar.com/F/ScoobyKEY',
                'https://bstlar.com/F/ScoobyKEY2',
                'https://bstlar.com/F/ScoobyKEY4'
            ],
            // One global key. Every Scooby product maps to the same 'allfree'
            // policy server-side, so splitting by product bought nothing and
            // left ?product= stuck in browser autocomplete.
            policy: 'allfree',
            global: {
                id: 'scooby',
                name: 'Scooby',
                art: 'logo.png',
                blurb: 'One key for every Scooby product.'
            }
        },
        nenyoo: {
            entry: '../../nenyooontop.html',
            home: 'https://nenyoomenu.com/',
            // Nenyoo bills to its own portal, with one merged policy covering
            // both products. It must not borrow Scooby's portal key.
            portalKey: 'pk_wq5QrTCJgdWbnTAI7eYzD4OAcXBkeCsE',
            policy: 'nenyfree',
            providers: ['https://bstlar.com/F/N3NYOOfreeKEY'],
            downloadPageFallback: 'https://nenyoomenu.com/downloads',
            downloadManifests: [
                'https://nenyoomenu.com/loader-download.json',
                'https://raw.githubusercontent.com/walteryo1337/NENYOO-WEB/main/loader-download.json'
            ],
            products: {
                'nenyoo-gtav':  { name: 'GTA V', art: 'nenyoo-gtav.jpg',  blurb: 'Legacy and Enhanced, one key.' },
                'nenyoo-fivem': { name: 'FiveM', art: 'nenyoo-fivem.png', blurb: 'A separate key for the FiveM menu.' }
            }
        }
    };

    const brand = CATALOGUE[document.body.dataset.brand];
    if (!brand) return;

    const safeGet = (storage, key) => { try { return storage.getItem(key); } catch (_) { return null; } };
    const safeSet = (storage, key, value) => { try { storage.setItem(key, value); } catch (_) {} };
    const safeRemove = (storage, key) => { try { storage.removeItem(key); } catch (_) {} };

    const parameters = new URLSearchParams(window.location.search);
    // A global brand ignores ?product= entirely, so a stale autocompleted
    // product in the URL cannot pin the visitor to one game.
    const product = brand.global ? brand.global.id : (parameters.get('product') || '');
    const entry = brand.global || (brand.products || {})[product];

    // The key card ships hidden. Nothing reveals it except a grant that checks
    // out below, so saving or sharing the bare URL shows only the locked panel
    // even if the redirect is blocked or scripts are cut off partway.
    const blockedPanel = document.getElementById('blockedContent');
    const keyContent = document.getElementById('keyContent');
    const providerLink = document.getElementById('providerLink');
    if (providerLink && brand.providers) {
        providerLink.href = brand.providers[Math.floor(Math.random() * brand.providers.length)];
    }

    // No product, or no valid grant: stay put and show the locked panel, the
    // way scoobyontop2.html does. Redirecting away would cost the ad
    // impression and hide the reason the key is not there. The pending product
    // is remembered so the provider return lands on the right page.
    const bounce = () => {
        if (product) safeSet(localStorage, 'scooby_pending_product', product);
        if (keyContent) keyContent.classList.add('hidden');
        if (blockedPanel) {
            blockedPanel.classList.remove('hidden');
            return;
        }
        // No locked panel in the markup: fall back to the access flow.
        window.location.replace(product
            ? `${brand.entry}?product=${encodeURIComponent(product)}`
            : brand.entry);
    };
    if (!entry) { bounce(); return; }

    // Preserve the sponsor hand-off as a UX step. The security boundary is the
    // server-issued IP-bound challenge and verified Turnstile result below.
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

    if (!validGrant) { bounce(); return; }

    // Grant checked out. This is the only path that reveals the card.
    if (blockedPanel) blockedPanel.classList.add('hidden');
    if (keyContent) keyContent.classList.remove('hidden');

    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('grant');
    window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);

    // A page restored from the back-forward cache must not reveal a key after
    // its one-time navigation grant has already been consumed.
    window.addEventListener('pageshow', event => {
        if (!event.persisted) return;
        bounce();
    });

    // Dress the shell for the requested product.
    const setText = (id, value) => {
        const node = document.getElementById(id);
        if (node) node.textContent = value;
    };
    setText('productName', entry.name);
    setText('productBlurb', entry.blurb);
    // A global brand keeps the static scope wording; only per-product brands
    // name the product there.
    if (!brand.global) setText('scopeProduct', entry.name);
    document.title = `${entry.name} Free Key`;
    const art = document.getElementById('productArt');
    if (art) {
        art.src = `../assets/${entry.art}`;
        art.alt = entry.name;
    }
    const homeLink = document.getElementById('brandHome');
    if (homeLink) homeLink.href = brand.home;

    // Read the public release manifest, not the React HTML shell or hashed
    // bundle. Anything that is not an exact filego.at bucket link is rejected
    // and the plain downloads page is used instead.
    const resolveLoaderUrl = async (manifests, fallback) => {
        for (const endpoint of manifests) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);
            try {
                const response = await fetch(endpoint, { cache: 'no-store', signal: controller.signal, credentials: 'omit' });
                if (!response.ok) throw new Error('Download manifest unavailable.');
                const manifest = await response.json();
                if (typeof manifest.url !== 'string') throw new Error('Missing loader URL.');
                const url = new URL(manifest.url);
                if (url.protocol !== 'https:' || url.hostname !== 'filego.at' || url.username || url.password || url.port ||
                    !/^\/bucket\/[A-Za-z0-9_-]+\/?$/.test(url.pathname) || url.search || url.hash) {
                    throw new Error('Invalid loader download URL.');
                }
                return url.href;
            } catch (_) {
                // The raw hosting-repository copy also works when the custom domain blocks CORS.
            } finally {
                clearTimeout(timeout);
            }
        }
        return fallback;
    };

    if (brand.downloadManifests) {
        const loaderDownload = document.getElementById('loaderDownload');
        if (loaderDownload) {
            resolveLoaderUrl(brand.downloadManifests, brand.downloadPageFallback)
                .then(href => {
                    loaderDownload.href = href;
                    loaderDownload.hidden = false;
                })
                .catch(() => {
                    loaderDownload.href = brand.downloadPageFallback;
                    loaderDownload.hidden = false;
                });
        }
    }

    const config = window.SCOOBY_ACCESS_KEY_CONFIG || {};
    const apiBase = String(config.apiBase || '').replace(/\/$/, '');
    const portalKey = String(brand.portalKey || config.portalKey || '');
    const policySlug = String(brand.policy || (config.policies || {})[product] || '');
    const keyOutput = document.getElementById('keyOutput');
    const copyButton = document.getElementById('copyButton');
    const timerText = document.getElementById('timerText');
    const timerFill = document.getElementById('timerFill');
    const blockMessage = document.getElementById('blockMessage');
    const bait = document.getElementById('adBait');
    let currentKey = '';
    let issuedAt = 0;
    let expiresAt = 0;

    if (copyButton) copyButton.textContent = `Copy ${entry.name} key`;

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
        copyButton.textContent = `Copy ${entry.name} key`;
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

    // The key ships blurred. Hover reveals it transiently; this toggle pins it.
    const revealButton = document.getElementById('revealButton');
    if (revealButton) {
        revealButton.addEventListener('click', () => {
            const shown = keyOutput.classList.toggle('revealed');
            revealButton.textContent = shown ? 'Hide' : 'Show';
            revealButton.setAttribute('aria-pressed', String(shown));
        });
    }
    keyOutput.addEventListener('click', copyKey);

    // Press C to copy, unless the visitor is typing into a field.
    document.addEventListener('keydown', event => {
        if (event.key !== 'c' && event.key !== 'C') return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const node = document.activeElement;
        if (node && (node.isContentEditable ||
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(node.tagName))) return;
        if (!currentKey) return;
        event.preventDefault();
        copyKey();
    });
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
