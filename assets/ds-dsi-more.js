(function () {
  'use strict';

  var root = document.querySelector('[data-ds-library]');
  if (!root) return;

  var input = document.getElementById('dsSearch');
  var category = document.getElementById('dsCategory');
  var reset = root.querySelector('[data-ds-reset]');
  var count = document.querySelector('[data-ds-count]');
  var empty = document.querySelector('[data-ds-empty]');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-ds-card]'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-ds-group-section]'));
  if (!input) return;

  function normalize(value) {
    value = String(value || '').toLowerCase();
    if (value.normalize) value = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return value.replace(/\s+/g, ' ').trim();
  }

  function translate(source, values) {
    var i18n = window.__scoobyI18n;
    var result = i18n && typeof i18n.t === 'function' ? i18n.t(source, values) : source;
    return result.replace(/\{(\w+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match;
    });
  }

  function update() {
    var terms = normalize(input.value).split(' ').filter(Boolean);
    var group = category ? category.value : 'all';
    var visible = 0;

    cards.forEach(function (card) {
      var searchable = normalize(card.getAttribute('data-search') || card.textContent);
      var groups = (card.getAttribute('data-ds-group') || '').split(/\s+/);
      var show = (group === 'all' || groups.indexOf(group) !== -1) && terms.every(function (term) {
        return searchable.indexOf(term) !== -1;
      });
      card.hidden = !show;
      if (show) visible += 1;
    });

    sections.forEach(function (section) {
      section.hidden = !section.querySelector('[data-ds-card]:not([hidden])');
    });
    if (count) {
      count.textContent = translate('{count} resources shown', { count: visible });
      count.setAttribute('data-visible-count', String(visible));
      count.setAttribute('data-total-count', String(cards.length));
    }
    if (empty) empty.hidden = visible !== 0;
  }

  function clear() {
    input.value = '';
    if (category) category.value = 'all';
    update();
    input.focus();
  }

  input.addEventListener('input', update);
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && (input.value || (category && category.value !== 'all'))) {
      event.preventDefault();
      clear();
    }
  });
  if (category) category.addEventListener('change', update);
  if (reset) reset.addEventListener('click', clear);
  window.addEventListener('scooby:langchange', update);
  update();
}());
