'use strict';
(() => {
  const key = 'playstation-library-theme';
  const root = document.documentElement;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const colorScheme = document.querySelector('meta[name="color-scheme"]');
  function apply(theme) {
    root.dataset.theme = theme;
    themeColor.content = theme === 'light' ? '#f5f5f5' : '#000000';
    colorScheme.content = theme;
  }
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  apply(saved === 'light' ? 'light' : 'dark');
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('library-theme-toggle');
    button.addEventListener('click', () => {
      const theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      apply(theme);
      try { localStorage.setItem(key, theme); } catch {}
    });
    button.hidden = false;
  });
})();
