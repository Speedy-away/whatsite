'use strict';

const screenshotPreview = document.getElementById('gta-screenshot-preview');
if (typeof screenshotPreview?.showModal === 'function') {
  const previewImage = screenshotPreview.querySelector('img');
  let trigger;
  let backdropPress = false;

  for (const link of document.querySelectorAll('#content .guide-resource > a[href]')) {
    const thumbnail = link.querySelector(':scope > img, :scope > picture > img');
    if (!thumbnail) continue;
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', screenshotPreview.id);
    link.setAttribute('data-no-file-options', '');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      previewImage.alt = thumbnail.alt;
      previewImage.src = link.href;
      screenshotPreview.showModal();
    });
  }

  screenshotPreview.addEventListener('pointerdown', event => {
    backdropPress = event.target === screenshotPreview;
  });
  screenshotPreview.addEventListener('click', event => {
    if (backdropPress && event.target === screenshotPreview) screenshotPreview.close();
    backdropPress = false;
  });
  screenshotPreview.addEventListener('close', () => {
    previewImage.removeAttribute('src');
    trigger?.focus({preventScroll: true});
    trigger = null;
  });
}
