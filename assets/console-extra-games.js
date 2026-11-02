(function () {
  'use strict';
  var input = document.getElementById('extraGameSearch');
  var grid = document.querySelector('[data-extra-game-grid]');
  var status = document.getElementById('extraGameCount');
  var empty = document.getElementById('extraGameEmpty');
  if (!input || !grid || !status || !empty) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.guide-resource'));
  function normalize(value) {
    value = value.toLowerCase();
    if (value.normalize) value = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    return value.replace(/['’]/g, '').replace(/[^a-z0-9.]+/g, ' ').trim();
  }
  function update() {
    var words = normalize(input.value).split(/\s+/).filter(Boolean);
    var count = 0;
    cards.forEach(function (card) {
      var text = normalize(card.getAttribute('data-search') || '');
      var matches = words.every(function (word) { return text.indexOf(word) !== -1; });
      card.hidden = !matches;
      if (matches) count++;
    });
    status.textContent = count + (count === 1 ? ' game collection' : ' game collections');
    empty.hidden = count !== 0;
  }
  input.addEventListener('input', update);
  update();
}());
