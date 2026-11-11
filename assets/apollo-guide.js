/* Image links remain usable without JavaScript; dialog adds an in-page preview. */
(() => {
  'use strict';
  const links = [...document.querySelectorAll('[data-apollo-zoom]')];
  if (links.length && typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal === 'function') {
    const dialog = document.createElement('dialog');
    dialog.className = 'apollo-zoom';
    dialog.setAttribute('aria-label', 'Apollo screenshot preview');
    const bar = document.createElement('div');
    bar.className = 'apollo-zoom__bar';
    const label = document.createElement('p');
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close image';
    const image = document.createElement('img');
    bar.append(label, close);
    dialog.append(bar, image);
    document.body.append(dialog);
    let opener;
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
    dialog.addEventListener('close', () => { if (opener) opener.focus(); });
    for (const link of links) link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      image.src = link.href;
      const figure = link.closest('figure');
      image.alt = figure?.querySelector('img')?.alt || 'Apollo Save Tool screenshot';
      label.textContent = image.alt;
      dialog.showModal();
      close.focus();
    });
  }
  if ('IntersectionObserver' in window) {
    const toc = [...document.querySelectorAll('.apollo-outline a')];
    const observer = new IntersectionObserver(entries => {
      const active = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!active) return;
      for (const link of toc) { if (link.hash === '#' + active.target.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); }
    }, {rootMargin: '-5% 0px -65% 0px', threshold: 0});
    document.querySelectorAll('.apollo-section').forEach(section => observer.observe(section));
  }
})();
