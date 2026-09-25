(() => {
  'use strict';
  const slug = document.body.dataset.policy;
  if (slug !== 'gtav' && slug !== 'fivem') return;
  // Both product pages share one merged access-key policy.
  const policySlug = 'nenyfree';
  const accessProduct = `nenyoo-${slug}`;
  const grantTtlMs = 2 * 60 * 1000;
  const safeGet = (storage, name) => { try { return storage.getItem(name); } catch (_) { return null; } };
  const safeSet = (storage, name, value) => { try { storage.setItem(name, value); } catch (_) {} };
  const safeRemove = (storage, name) => { try { storage.removeItem(name); } catch (_) {} };
  const parameters = new URLSearchParams(window.location.search);
  const presentedToken = parameters.get('grant') || '';
  const grantKey = `scooby_one_time_grant_${accessProduct}`;
  let storedGrant = null;
  try { storedGrant = JSON.parse(safeGet(sessionStorage, grantKey) || 'null'); } catch (_) {}
  const grantNow = Date.now();
  const validGrant = storedGrant && storedGrant.product === accessProduct &&
    storedGrant.token === presentedToken && Number.isFinite(storedGrant.issuedAt) &&
    Number.isFinite(storedGrant.expiresAt) && storedGrant.issuedAt <= grantNow &&
    storedGrant.expiresAt >= grantNow &&
    storedGrant.expiresAt - storedGrant.issuedAt <= grantTtlMs;
  safeRemove(sessionStorage, grantKey);

  if (!validGrant) {
    safeSet(localStorage, 'scooby_pending_product', accessProduct);
    window.location.replace(`/scoobyontop.html?product=${encodeURIComponent(accessProduct)}`);
    return;
  }

  const cleanUrl = new URL(window.location.href);
  cleanUrl.searchParams.delete('grant');
  window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);

  const productArt = document.createElement('img');
  productArt.src = slug === 'gtav'
    ? '../assets/images/nenyoo-gtav.jpg'
    : '../assets/images/nenyoo-fivem.png';
  productArt.alt = slug === 'gtav' ? 'Nenyoo menu in GTA V' : 'Nenyoo menu in FiveM';
  productArt.decoding = 'async';
  document.querySelector('.art-card')?.prepend(productArt);

  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    safeSet(localStorage, 'scooby_pending_product', accessProduct);
    window.location.replace(`/scoobyontop.html?product=${encodeURIComponent(accessProduct)}`);
  });

  const base = 'https://proudlyauthentication.com/api/portal/v1/pk_wq5QrTCJgdWbnTAI7eYzD4OAcXBkeCsE';
  const output = document.getElementById('keyOutput');
  const copy = document.getElementById('copyButton');
  const message = document.getElementById('blockMessage');
  const timer = document.getElementById('timerText');
  const fill = document.getElementById('timerFill');
  const loaderDownload = document.createElement('a');
  loaderDownload.className = 'loader-download';
  loaderDownload.href = 'https://nenyoomenu.com/downloads';
  loaderDownload.target = '_blank';
  loaderDownload.rel = 'noopener noreferrer';
  loaderDownload.textContent = 'Download Nenyoo loader';
  loaderDownload.hidden = true;
  document.querySelector('.key-actions')?.insertAdjacentElement('afterend', loaderDownload);
  let key = '', issuedAt = 0, expiresAt = 0;
  const downloadPageFallback = 'https://nenyoomenu.com/downloads';
  const downloadManifests = [
    'https://nenyoomenu.com/loader-download.json',
    'https://raw.githubusercontent.com/walteryo1337/NENYOO-WEB/main/loader-download.json'
  ];

  // Read the public release manifest, not the React HTML shell or hashed bundle.
  const findLoaderUrl = async () => {
    for (const endpoint of downloadManifests) {
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
    throw new Error('Nenyoo download configuration was not available.');
  };

  const loaderUrl = findLoaderUrl().catch(() => downloadPageFallback);
  const fail = error => {
    output.textContent = 'KEY UNAVAILABLE';
    message.textContent = error.message || String(error);
    message.classList.add('show');
    copy.disabled = true;
  };
  const api = async (path, options) => {
    const response = await fetch(base + path, {
      ...options,
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  };
  const issue = async (challengeId, token) => {
    output.textContent = 'GENERATING KEY…';
    const data = await api('/access-keys/issue', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, turnstile_token: token })
    });
    key = data.key;
    issuedAt = Date.now();
    expiresAt = Date.parse(data.expires_at);
    output.textContent = key;
    copy.disabled = false;
    message.classList.remove('show');
    loaderDownload.href = await loaderUrl;
    loaderDownload.hidden = false;
  };
  const loadTurnstile = () => new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error('Could not load verification.'));
    document.head.appendChild(script);
  });
  const start = async () => {
    const metadata = await api(`/access-key-policies/${policySlug}`);
    const policy = metadata.policy;
    const expectedId = slug === 'gtav' ? '3546744805' : '2759446834';
    const actualIds = (policy.subscriptions || []).map(item => String(item.id));
    if (policy.slug !== policySlug || policy.expires_in !== 14400 || policy.binding_mode !== 'hwid' ||
        policy.usage_mode !== 'reusable' ||
        !actualIds.includes(expectedId)) {
      throw new Error('This key policy needs review before keys can be issued.');
    }
    const challenge = await api('/access-keys/challenge', {
      method: 'POST',
      body: JSON.stringify({ policy_slug: policySlug, integration_id: policy.integration_id })
    });
    if (!challenge.challenge.turnstile_required) return issue(challenge.challenge.id, '');
    if (!challenge.challenge.site_key) throw new Error('Verification is not configured.');
    const turnstile = await loadTurnstile();
    const host = document.createElement('div');
    host.style.margin = '16px auto';
    output.insertAdjacentElement('afterend', host);
    output.textContent = 'COMPLETE VERIFICATION';
    turnstile.render(host, {
      sitekey: challenge.challenge.site_key,
      action: challenge.challenge.action,
      cData: challenge.challenge.cdata,
      theme: 'dark',
      callback: token => issue(challenge.challenge.id, token).catch(fail),
      'error-callback': () => fail(new Error('Verification failed. Reload to try again.')),
      'expired-callback': () => fail(new Error('Verification expired. Reload to try again.'))
    });
  };
  copy.addEventListener('click', async () => {
    if (!key) return;
    try { await navigator.clipboard.writeText(key); }
    catch (_) {
      const field = document.createElement('textarea');
      field.value = key;
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    copy.textContent = 'Copied';
    setTimeout(() => { copy.textContent = 'Copy key'; }, 1600);
  });
  setInterval(() => {
    if (!expiresAt) return;
    const remaining = Math.max(0, expiresAt - Date.now());
    const seconds = Math.ceil(remaining / 1000);
    timer.textContent = `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    fill.style.width = `${Math.min(100, remaining / Math.max(1, expiresAt - issuedAt) * 100)}%`;
    if (!remaining && key) { key = ''; output.textContent = 'KEY EXPIRED'; copy.disabled = true; }
  }, 1000);
  start().catch(fail);
})();
