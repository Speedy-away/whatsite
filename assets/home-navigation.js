'use strict';

const taskbar = document.querySelector('.home-taskbar');
if (taskbar && typeof ResizeObserver === 'function') {
    new ResizeObserver(() => {
        document.documentElement.style.setProperty('--home-header-height', taskbar.offsetHeight + 'px');
    }).observe(taskbar);
}

const homeMenus = [...document.querySelectorAll('.home-task-links .home-menu')];

function closeHomeMenus(activeMenu) {
    for (const menu of homeMenus) {
        if (menu !== activeMenu) menu.open = false;
    }
}

taskbar?.querySelector('[data-language-picker]')?.addEventListener('click', event => {
    event.currentTarget.closest('details').querySelector('summary').focus();
}, { capture: true });

document.addEventListener('click', event => {
    const menu = event.target.closest('.home-menu');
    const selection = event.target.closest('.home-menu-panel :is(a, button)');
    closeHomeMenus(selection ? null : menu);
});

document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    const openMenu = homeMenus.find(menu => menu.open);
    if (!openMenu) return;
    const restoreFocus = openMenu.contains(document.activeElement);
    openMenu.open = false;
    if (restoreFocus) openMenu.querySelector('summary').focus();
});
