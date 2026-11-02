(function () {
  'use strict';
  var data = document.getElementById('console-route-data');
  if (!data) return;
  var routes;
  try { routes = JSON.parse(data.textContent); } catch (error) { return; }
  var anchor = '';
  try { anchor = decodeURIComponent(window.location.hash.slice(1)); } catch (error) { /* Use the landing page. */ }
  var target = Object.prototype.hasOwnProperty.call(routes.anchors, anchor) ? routes.anchors[anchor] : routes.home;
  if (typeof target !== 'string' || !/^\/console\/(?:ps3|xbox360)\//.test(target)) return;
  window.location.replace(target);
}());
