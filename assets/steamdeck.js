// Deep links reveal native guide details; all content remains available without JS.
(() => {
    const openGuide = hash => {
        if (!hash || !hash.startsWith('#guide-')) return;
        let id;
        try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
        const guide = document.getElementById(id);
        if (guide?.matches('details.steamdeck-setup-guide')) {
            guide.open = true;
            return guide;
        }
    };
    document.addEventListener('click', event => {
        const link = event.target.closest('a[data-steamdeck-guide]');
        if (link) openGuide(link.getAttribute('href'));
    });
    window.addEventListener('hashchange', () => openGuide(location.hash));
    // Run after browser scroll restoration so direct guide links work on phones.
    window.addEventListener('pageshow', () => {
        const guide = openGuide(location.hash);
        if (guide) requestAnimationFrame(() => guide.scrollIntoView({block: 'start', behavior: 'instant'}));
    });
    openGuide(location.hash);
})();
