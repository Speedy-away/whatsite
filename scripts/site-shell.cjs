'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {eligible, relativePath} = require('./site-public-pages.cjs');
const {attributes, canonical, mapTokens, origin} = require('./localized-html.cjs');
const {tag: languageScript, apply: refreshLanguageScript} = require('./language-loader.cjs');

const stylesheet = '<link rel="stylesheet" href="/assets/site-shell.css?v=4">';
const themeScript = '<script src="/assets/playstation-library-theme.js?v=3"></script>';
const navigationScript = '<script defer src="/assets/home-navigation.js?v=20261110-phone"></script>';
const critical = '<style data-critical-bg>html,body{background:#000;color-scheme:dark}html[data-theme="light"],html[data-theme="light"] body{background:#f5f5f5;color-scheme:light}</style>';
const skipLink = '<a class="skip-link" href="#main-content">Skip to content</a>';

function mode(file, html) {
  if (!eligible(file) || /^(?:hosts|api|free-keys)\//.test(file) || /^(?:scooby|nenyoo)ontop2?\.html$/.test(file) ||
      file === 'console/ps3/browser-downloads.html' || /http-equiv=["']refresh/i.test(html) ||
      /\bid=["']receiver-catalog["']/.test(html)) return '';
  if (html.includes('id="sidebar"')) return 'sidebar';
  if (/\bclass=["'][^"']*\bps-library\b/.test(html)) return 'library';
  if (file === '404.html' || file === 'cheats/index.html' || (file.startsWith('games/') && /<main\b/i.test(html))) return 'standalone';
  return '';
}

function currentHeader(header, file, html) {
  const clean = value => new URL(value, origin).pathname.replace(/\/index\.html$/, '/');
  const current = clean(canonical(html) || '/' + file);
  return header.replace(/<a\b[^>]*>/g, tag => {
    const href = attributes(tag).href;
    if (!href || !href.startsWith('/') || href.includes('#') || clean(href) !== current) return tag;
    return tag.replace(/>$/, ' aria-current="page">');
  }).replace(/<details\b[^>]*>[\s\S]*?<\/details>/g, menu =>
    menu.includes('aria-current="page"') ? menu.replace(/<details\b/, '<details data-current') : menu);
}

function create(root) {
  const index = path.join(root, 'index.html');
  const home = fs.existsSync(index) ? fs.readFileSync(index, 'utf8') : '';
  const header = home.match(/<header class="home-taskbar">[\s\S]*?<\/header>/)?.[0];
  if (!header) return (_file, html) => html;
  return (file, html) => {
    file = relativePath(file);
    if (html.includes('class="home-taskbar"')) return html;
    const layout = mode(file, html);
    if (!layout) return html;
    const language = html.includes('languages/i18n.js') ? '' : languageScript;
    const firstVisit = html.includes('data-language-first-visit');
    const hasSkip = [...html.matchAll(/<a\b[^>]*>/gi)].some(([tag]) => {
      const {href, class: classes} = attributes(tag);
      return href?.startsWith('#') && /\b(?:skip-link|skip)\b/.test(classes || '');
    });
    const markup = currentHeader(firstVisit ? header.replace('data-language-switcher', 'data-language-switcher data-language-first-visit') : header, file, html);
    let hiddenTag = '', depth = 0;
    return mapTokens(refreshLanguageScript(html), token => {
      const element = /^<(\/?)([\w-]+)\b/i.exec(token);
      const name = element?.[2].toLowerCase();
      if (hiddenTag) {
        if (name === hiddenTag) depth += element[1] ? -1 : 1;
        if (!depth) hiddenTag = '';
        return '';
      }
      if (!element) return;
      if (element[1]) {
        if (name === 'head') return critical + themeScript + stylesheet + language + navigationScript + token;
        return;
      }
      const attrs = attributes(token.slice(0, token.indexOf('>') + 1));
      const classes = (attrs.class || '').split(/\s+/);
      if (attrs.id === 'sidebar' || classes.includes('library-header') || classes.includes('mobile-site-header') ||
          (name === 'button' && classes.includes('text-button') && /\bdata-language-picker\b/.test(token))) {
        hiddenTag = name;
        depth = 1;
        return attrs.id === 'sidebar' || classes.includes('library-header') ? (hasSkip ? '' : skipLink) + markup : '';
      }
      if (name === 'body') {
        let body = token.replace(/\s+data-background-theme=["'][^"']*["']/i, '');
        const names = [...classes.filter(value => value && value !== 'site-atmosphere'), 'site-shell'].join(' ');
        body = attrs.class === undefined ? body.replace(/>$/, ' class="' + names + '">') :
          body.replace(/\bclass=(["'])[^"']*\1/i, 'class="' + names + '"');
        body = body.replace(/>$/, ' data-home-taskbar>');
        return layout === 'standalone' ? body + (hasSkip ? '' : skipLink) + markup : body;
      }
      if ((name === 'main' && layout === 'standalone') || classes.includes('error-container')) {
        return attrs.id ? token : token.replace(/>$/, ' id="main-content" tabindex="-1">');
      }
      if (name === 'style' && /^<style\b[^>]*\bdata-critical-bg\b/i.test(token)) return '';
      if (name === 'script') {
        const src = attrs.src || '';
        if (/^\/assets\/(?:site-background|playstation-library-theme)\.js(?:\?|$)/.test(src)) return '';
        if (/^(?:\/|\.\.\/|\.\/)*script\.js(?:\?|$)/.test(src)) {
          return token.replace(src, src.split('?')[0] + '?v=20261110-shell');
        }
      }
      if (name === 'link' && /^\/assets\/site-background\.css(?:\?|$)/.test(attrs.href || '')) return '';
    });
  };
}

module.exports = {create};
