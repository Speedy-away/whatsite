(function () {
    'use strict';
    // Use the existing direct sponsor URL instead of installing a publisher's
    // document-wide click interceptor. Do not cancel or change the download.
    const sponsorURL = 'https://araplhn.org/4/ac85b864baf2e2322b99cd2ad051fbc2';
    document.addEventListener('click', event => {
        if (!event.isTrusted || event.defaultPrevented || event.button > 0 ||
            event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const link = event.target.closest?.('a[href]');
        if (!link || link.closest('nav, .sidebar, header, footer, .site-ad, [aria-disabled="true"], .disabled') ||
            link.matches('[data-receiver-file], [data-receiver-open], [data-client-open], [data-webman-file]')) return;
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        let url;
        try { url = new URL(href, document.baseURI); } catch (_) { return; }
        if (!/^https?:$/.test(url.protocol)) return;
        const options = {explicitDownload: link.hasAttribute('download'), label: link.textContent};
        const file = window.PhoneDownloads
            ? window.PhoneDownloads.describeDownload(href, document.baseURI, options)
            : (options.explicitDownload || /\.(?:zip|7z|rar|bin|elf|pkg|vpk|pup|nro|nsp|cia|3dsx|dol|nds|iso|exe|msi|apk|sprx|gsc|lua|asi)$/i.test(url.pathname));
        if (!file) return;
        try { window.open(sponsorURL, '_blank', 'noopener,noreferrer'); } catch (_) { /* Download still proceeds. */ }
    });
    const ad = document.getElementById('page-advertisement');
    const box = document.getElementById('container-fd0a4dcec74a63f4d2662af5273f9d5b');
    const stage = ad?.querySelector('.site-ad-stage');
    if (!box || !stage) return;

    const hasSponsor = !!ad.querySelector('.site-ad-sponsored');
    let timedOut = false;
    function update() {
        const filled = !!box.querySelector('a[href], img, iframe');
        stage.hidden = timedOut && !filled;
        ad.hidden = stage.hidden && !hasSponsor;
        stage.dataset.adStatus = filled ? 'filled' : timedOut ? 'empty' : 'pending';
    }

    new MutationObserver(update).observe(box, {childList: true, subtree: true, attributes: true});
    window.setTimeout(() => {
        timedOut = true;
        update();
    }, 8000);
    update();
}());
