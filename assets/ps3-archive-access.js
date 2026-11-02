(function () {
  'use strict';
  var form = document.getElementById('ps3ArchiveAccess');
  var host = document.getElementById('ps3ArchiveHost');
  var link = document.getElementById('ps3ArchiveOpen');
  var status = document.getElementById('ps3ArchiveStatus');
  if (!form || !host || !link || !status) return;
  var match = window.location.search.match(/[?&]resource=([a-z0-9-]{1,100})(?:&|$)/);
  var query = match ? '?resource=' + encodeURIComponent(match[1]) : '';
  link.href = 'http://127.0.0.1:8766/' + query;
  form.onsubmit = function (event) {
    if (event && event.preventDefault) event.preventDefault();
    var value = host.value.replace(/^\s+|\s+$/g, '');
    var parts = value.split('.');
    var valid = parts.length === 4;
    for (var i = 0; i < parts.length; i += 1) if (!/^\d{1,3}$/.test(parts[i]) || Number(parts[i]) > 255 || String(Number(parts[i])) !== parts[i]) valid = false;
    if (valid) valid = value === '127.0.0.1' || parts[0] === '10' || parts[0] === '192' && parts[1] === '168' || parts[0] === '172' && Number(parts[1]) >= 16 && Number(parts[1]) <= 31;
    if (!valid) {
      status.textContent = 'Enter the archive computer’s private IPv4 address without a port or path.';
      host.setAttribute('aria-invalid', 'true');
      link.removeAttribute('href');
      return false;
    }
    host.removeAttribute('aria-invalid');
    link.href = 'http://' + value + ':8766/' + query;
    status.textContent = 'Archive link prepared. Keep the server running on the computer before opening it.';
    return false;
  };
}());
