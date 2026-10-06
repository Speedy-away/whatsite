(() => {
    'use strict';

    // Check behavior, not the browser name: Brave and extensions can block
    // requests without hiding elements. Fetch does not execute these scripts.
    const endpoints = [
        'https://abscloud.org/1/366a2e3edafab888009b3076fcd47b82',
        'https://aloudalimonyexplosion.com/fd0a4dcec74a63f4d2662af5273f9d5b/invoke.js'
    ];
    const controlUrl = new URL('access-key-config.js', document.currentScript.src).href;
    const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));
    let dialog, status, retry, bait, pending;
    let release;
    let blocked = false;

    const reachable = async (url, local = false) => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 4500);
        try {
            const response = await fetch(url, {
                mode: local ? 'same-origin' : 'no-cors', cache: 'no-store',
                credentials: 'omit', signal: controller.signal
            });
            return local ? response.ok : true;
        } catch (_) {
            return false;
        } finally {
            window.clearTimeout(timeout);
        }
    };

    const hidden = () => {
        const style = window.getComputedStyle(bait);
        return !bait.isConnected || bait.offsetHeight === 0 || bait.offsetWidth === 0 ||
            style.display === 'none' || style.visibility === 'hidden';
    };

    const detect = async () => {
        // Give cosmetic filters time to process a fresh element on every retry.
        if (bait) bait.remove();
        bait = document.createElement('div');
        bait.className = 'adsbox ad-banner ad-unit advertisement adsbygoogle';
        bait.setAttribute('aria-hidden', 'true');
        bait.style.cssText = 'position:fixed;left:-10000px;top:0;width:10px;height:10px;pointer-events:none';
        document.body.appendChild(bait);
        await wait(350);
        if (hidden()) return true;
        if (navigator.onLine === false) return false;
        const results = await Promise.all(endpoints.map(url => reachable(url)));
        if (hidden()) return true;
        // One unavailable ad host is not sufficient evidence. Retry both and
        // require a working same-origin control to avoid offline false positives.
        if (results.some(Boolean) || !await reachable(controlUrl, true)) return false;
        await wait(300);
        const retried = await Promise.all(endpoints.map(url => reachable(url)));
        return hidden() || retried.every(result => !result);
    };

    const createDialog = () => {
        dialog = document.createElement('dialog');
        dialog.className = 'page-access-dialog';
        dialog.setAttribute('aria-labelledby', 'page-access-title');
        dialog.setAttribute('aria-describedby', 'page-access-description');
        dialog.innerHTML = `
            <p class="page-access-eyebrow">Support free keys</p>
            <h2 id="page-access-title">Turn off your ad blocker</h2>
            <p id="page-access-description">Ads help keep these keys free. Please allow ads on this site, then check again to continue.</p>
            <ul>
                <li><strong>Brave:</strong> open the lion icon in the address bar and turn Shields off for this site.</li>
                <li><strong>uBlock Origin / uBlock Origin Lite:</strong> open the extension and disable filtering for this site.</li>
                <li><strong>AdBlock, Adblock Plus or AdGuard:</strong> pause blocking or add this site to your allowlist.</li>
            </ul>
            <p class="page-access-status" role="status" aria-live="polite">Ads appear to be blocked. If your blocker is already off, a network or ad-service problem may be preventing them from loading.</p>
            <button type="button" class="btn primary">I've turned it off — check again</button>
            <a class="page-access-exit" href="/">Back to home</a>`;
        status = dialog.querySelector('.page-access-status');
        retry = dialog.querySelector('button');
        retry.addEventListener('click', recheck);
        dialog.addEventListener('cancel', event => event.preventDefault());
        document.body.appendChild(dialog);
    };

    const recheck = async () => {
        retry.disabled = true;
        status.textContent = 'Checking…';
        try {
            blocked = await detect();
            if (blocked) {
                status.textContent = 'Ads still appear to be blocked. Allow this site in your blocker and try again. A network or ad-service problem can also cause this.';
            } else {
                dialog.close();
                document.documentElement.classList.remove('page-access-paused');
                release();
                pending = null;
            }
        } finally {
            retry.disabled = false;
        }
    };

    const requireClear = () => {
        if (pending) return pending;
        pending = (async () => {
            blocked = await detect();
            if (!blocked) return;
            if (!dialog) createDialog();
            const cleared = new Promise(resolve => { release = resolve; });
            document.documentElement.classList.add('page-access-paused');
            dialog.showModal();
            retry.focus();
            await cleared;
        })();
        // Keep the same promise while blocked, including across repeated calls.
        pending.then(() => { pending = null; });
        return pending;
    };
    window.freeKeyAccess = { requireClear, get blocked() { return blocked; } };
    const start = () => requireClear();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
})();
