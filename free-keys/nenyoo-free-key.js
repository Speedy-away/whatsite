(() => {
  'use strict';
  const slug = document.body.dataset.policy;
  if (slug !== 'gtav' && slug !== 'fivem') return;
  const base = 'https://proudlyauthentication.com/api/portal/v1/pk_wq5QrTCJgdWbnTAI7eYzD4OAcXBkeCsE';
  const output = document.getElementById('keyOutput');
  const copy = document.getElementById('copyButton');
  const message = document.getElementById('blockMessage');
  const timer = document.getElementById('timerText');
  const fill = document.getElementById('timerFill');
  const loaderDownload = document.createElement('a');
  loaderDownload.className = 'loader-download';
  loaderDownload.href = 'https://nenyoomenu.com/download';
  loaderDownload.target = '_blank';
  loaderDownload.rel = 'noopener noreferrer';
  loaderDownload.textContent = 'Download Nenyoo loader';
  loaderDownload.hidden = true;
  document.querySelector('.key-actions')?.insertAdjacentElement('afterend', loaderDownload);
  let key = '', issuedAt = 0, expiresAt = 0;
  const dashboardUrl = 'https://nenyoomenu.com/dashboard';
  const downloadPageFallback = 'https://nenyoomenu.com/download';

  const fetchText = async url => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`Could not read ${url} (${response.status})`);
      return response.text();
    } finally {
      clearTimeout(timeout);
    }
  };

  // Follow the dashboard's download link and extract the current loader URL
  // from Nenyoo's own download-gate script, so loader updates need no edit here.
  const findLoaderUrl = async () => {
    const dashboard = new DOMParser().parseFromString(await fetchText(dashboardUrl), 'text/html');
    const downloadLink = [...dashboard.querySelectorAll('a[href]')]
      .find(link => /\/download(?:[/?#]|$)/i.test(link.getAttribute('href')));
    if (!downloadLink) throw new Error('Nenyoo dashboard has no download link.');

    const downloadPageUrl = new URL(downloadLink.getAttribute('href'), dashboardUrl).href;
    const downloadPage = new DOMParser().parseFromString(await fetchText(downloadPageUrl), 'text/html');
    const gateScript = [...downloadPage.querySelectorAll('script[src]')]
      .find(script => /download-gate(?:\.min)?\.js(?:[?#]|$)/i.test(script.getAttribute('src')));
    if (!gateScript) throw new Error('Nenyoo download configuration was not found.');

    const source = await fetchText(new URL(gateScript.getAttribute('src'), downloadPageUrl).href);
    const match = source.match(/PRIMARY_DOWNLOAD_URL\s*=\s*(['"])(https?:\/\/[^'"\s]+)\1/);
    if (!match) throw new Error('Nenyoo loader URL was not found.');
    return new URL(match[2]).href;
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
    const metadata = await api(`/access-key-policies/${slug}`);
    const policy = metadata.policy;
    const expectedId = slug === 'gtav' ? '3546744805' : '2759446834';
    const actualIds = (policy.subscriptions || []).map(item => String(item.id));
    if (policy.slug !== slug || policy.expires_in !== 14400 || policy.binding_mode !== 'hwid' ||
        policy.usage_mode !== 'reusable' ||
        actualIds.length !== 1 || actualIds[0] !== expectedId) {
      throw new Error('This key policy needs review before keys can be issued.');
    }
    const challenge = await api('/access-keys/challenge', {
      method: 'POST',
      body: JSON.stringify({ policy_slug: slug, integration_id: policy.integration_id })
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
