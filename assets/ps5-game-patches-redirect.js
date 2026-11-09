(function () {
  'use strict';
  var hash = window.location.hash;
  if (hash === '#setup') hash = '#ps5-setup';
  if (hash === '#persona-3-reload-standalone') hash = '#persona-3-reload-standalone-ps5';
  window.location.replace('/console/ps4/game-patches.html' + window.location.search + (hash || '#native-ps5-patches'));
}());
