(function () {
  'use strict';
  var form = document.querySelector('[data-theme-manager]');
  if (!form) return;
  var input = form.querySelector('input');
  var status = form.querySelector('[role="status"]');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var host = input.value.trim();
    var parts = host.split('.');
    var valid = parts.length === 4 && parts.every(function (part) {
      return /^\d{1,3}$/.test(part) && Number(part) <= 255;
    });
    var first = Number(parts[0]), second = Number(parts[1]);
    valid = valid && (first === 10 || (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) || (first === 169 && second === 254) || host === '127.0.0.1');
    if (!valid) {
      status.textContent = 'Enter the PS5’s local IPv4 address, for example 192.168.1.50.';
      input.focus();
      return;
    }
    var url = 'http://' + parts.map(Number).join('.') + ':8095/';
    var target = window.open(url, '_blank');
    if (target) target.opener = null;
    status.replaceChildren();
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = 'Open ' + url;
    status.appendChild(anchor);
    status.appendChild(document.createTextNode(' — the theme payload must already be running.'));
  });
}());
