(function () {
  'use strict';
  var form = document.getElementById('ps3DownloadForm');
  var address = document.getElementById('ps3Host');
  var base = document.getElementById('ps3FileBase');
  var status = document.getElementById('ps3LinkStatus');
  if (!form || !address || !base || !status) return;
  function host(value) {
    value = value.replace(/^\s+|\s+$/g,'');
    if (value === 'localhost' || value === '127.0.0.1') return value;
    var p = value.split('.');
    if (p.length !== 4) return null;
    for (var n = 0; n < 4; n += 1) if (!/^\d{1,3}$/.test(p[n]) || Number(p[n]) > 255 || String(Number(p[n])) !== p[n]) return null;
    return p[0] === '10' || p[0] === '192' && p[1] === '168' || p[0] === '172' && Number(p[1]) >= 16 && Number(p[1]) <= 31 ? value : null;
  }
  function prepare(event) {
    if (event && event.preventDefault) event.preventDefault();
    var ps3 = host(address.value), server = base.value.replace(/\/+$/,'');
    var parsed = document.createElement('a');
    parsed.href = server;
    if (!ps3 || !/^https?:\/\//i.test(server) || !parsed.hostname || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname && parsed.pathname !== '/') {
      status.innerHTML = 'Enter a private PS3 IPv4 address and a file-server URL without a path, credentials or query.';
      return false;
    }
    var links = document.querySelectorAll('[data-webman-file]');
    for (var n = 0; n < links.length; n += 1) {
      // webMAN preserves the original query when it contains percent escapes.
      // Its url= value must retain a literal scheme; only escape path segments.
      var path = links[n].getAttribute('data-webman-file').split('/');
      for (var i = 0; i < path.length; i += 1) {
        try { path[i] = encodeURIComponent(decodeURIComponent(path[i])); }
        catch (error) { path[i] = encodeURIComponent(path[i]); }
      }
      var source = server + path.join('/');
      var url = 'http://' + ps3 + '/xmb.ps3/download.ps3?url=' + source;
      if (source.length >= 360 || url.length >= 1900) {
        links[n].removeAttribute('href');
        links[n].innerHTML = 'Use FTP for this long file path';
      } else {
        links[n].href = url;
        links[n].innerHTML = 'Save with webMAN';
      }
    }
    status.innerHTML = 'Links prepared for ' + ps3 + '. Selecting Save with webMAN starts a download to /dev_hdd0/packages.';
    return false;
  }
  base.value = window.location.protocol + '//' + window.location.host;
  form.onsubmit = prepare;
  prepare();
}());
