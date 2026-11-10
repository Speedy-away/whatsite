(function () {
    'use strict';
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
