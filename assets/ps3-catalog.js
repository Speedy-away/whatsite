(function () {
  'use strict';
  var search = document.getElementById('ps3Search');
  var game = document.getElementById('ps3Game');
  var type = document.getElementById('ps3Type');
  var count = document.getElementById('ps3Count');
  var empty = document.getElementById('ps3Empty');
  if (!search || !count) return;
  var cards = document.querySelectorAll('[data-ps3-entry]');
  function update() {
    var words = search.value.toLowerCase().replace(/^\s+|\s+$/g, '').split(/\s+/);
    var shown = 0;
    for (var n = 0; n < cards.length; n += 1) {
      var card = cards[n];
      var text = card.getAttribute('data-search').toLowerCase();
      var gameIds=' '+(card.getAttribute('data-games') || card.getAttribute('data-game'))+' ';
      var visible = (!game || !game.value || gameIds.indexOf(' '+game.value+' ') !== -1) && (!type || !type.value || card.getAttribute('data-type') === type.value);
      for (var i = 0; i < words.length; i += 1) if (text.indexOf(words[i]) === -1) visible = false;
      card.hidden = !visible;
      card.style.display = visible ? '' : 'none';
      if (visible) shown += 1;
    }
    count.innerHTML = shown + ' of ' + cards.length + ' resources';
    if (empty) empty.hidden = shown !== 0;
  }
  search.oninput = update;
  search.onkeyup = update;
  if (game) game.onchange = update;
  if (type) type.onchange = update;
  update();
}());
