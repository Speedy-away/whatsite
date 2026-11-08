(() => {
  const buttons = document.querySelectorAll('[data-copy-title-id]');
  if (!buttons.length) return;
  buttons.forEach(button => {
    button.addEventListener('click', async () => {
      const value = button.dataset.copyTitleId || button.textContent.trim();
      try {
        await navigator.clipboard.writeText(value);
        const original = button.textContent;
        button.textContent = 'Copied';
        button.dataset.copyState = 'copied';
        window.setTimeout(() => {
          button.textContent = original;
          delete button.dataset.copyState;
        }, 1200);
      } catch {
        button.textContent = 'Copy failed';
        window.setTimeout(() => { button.textContent = value; }, 1200);
      }
    });
  });
})();
