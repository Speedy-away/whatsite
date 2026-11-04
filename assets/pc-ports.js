(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.PCPorts = api; api.mount(root.document); }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  var marks,nonletters;try{marks=new RegExp('\\p{M}','gu');nonletters=new RegExp('[^\\p{L}\\p{N}]+','gu');}catch(error){marks=/[\u0300-\u036f]/g;nonletters=/[^a-z0-9\u00c0-\uffff]+/g;}
  function normalize(value) { return String(value || '').normalize('NFKD').replace(marks, '').toLowerCase().replace(nonletters, ' ').trim(); }
  function matches(entry, query, platform, availability) {
    var text = normalize(entry.search), tokens = normalize(query).split(' ').filter(Boolean);
    return tokens.every(function (token) { return text.indexOf(token) !== -1; }) && (!platform || entry.platform === platform) && (!availability || entry.availability === availability);
  }
  function mount(document) {
    if (!document) return;
    var directory = document.querySelector('[data-ports-directory]');
    if (!directory) return;
    var input = directory.querySelector('[data-ports-query]'), platform = directory.querySelector('[data-ports-platform]'), availability = directory.querySelector('[data-ports-availability]');
    var cards = Array.prototype.slice.call(directory.querySelectorAll('[data-port-card]')), count = directory.querySelector('[data-ports-count]'), empty = directory.querySelector('[data-ports-empty]');
    function update() {
      var visible = 0;
      cards.forEach(function (card) { var show = matches({search: card.getAttribute('data-search'), platform: card.getAttribute('data-platform'), availability: card.getAttribute('data-availability')}, input.value, platform.value, availability.value); card.hidden = !show; if (show) visible++; });
      count.textContent = visible + ' of ' + cards.length + ' projects'; empty.hidden = visible !== 0;
    }
    input.addEventListener('input', update); platform.addEventListener('change', update); availability.addEventListener('change', update);
    directory.querySelector('[data-ports-reset]').addEventListener('click', function () { input.value = ''; platform.value = ''; availability.value = ''; update(); input.focus(); });
    directory.querySelectorAll('[data-port-keyword]').forEach(function (button) { button.addEventListener('click', function () { input.value = button.getAttribute('data-port-keyword'); update(); }); });
    update();
  }
  return {normalize: normalize, matches: matches, mount: mount};
});
