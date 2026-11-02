(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.HostDashboard = api; api.install(document, root); }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function escape(value) { return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function firmwareNumber(value) { var m = /^(\d+)(?:\.(\d+))?/.exec(String(value)); if (!m) return null; var minor = (m[2] || '0').slice(0, 2); if (minor.length < 2) minor += '0'; return Number(m[1]) * 100 + Number(minor); }
  function firmwareMatches(action, firmware) {
    if (firmware && action.firmwareMax && firmwareNumber(firmware) > firmwareNumber(action.firmwareMax)) return false;
    if (!firmware || !action.firmwares || !action.firmwares.length) return true;
    var selected = firmwareNumber(firmware);
    if (selected === null) return false;
    return action.firmwares.some(function (rule) {
      var range = String(rule).match(/^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
      if (range) return selected >= firmwareNumber(range[1]) && selected <= firmwareNumber(range[2]);
      return firmwareNumber(rule) === selected;
    });
  }
  function browserFirmware(ua, platform) {
    var pattern = platform === 'ps4' ? /PlayStation\s*4[ /]+(\d+\.\d+)/i : /PlayStation\s*5[ /]+(\d+\.\d+)/i;
    var match = pattern.exec(ua || '');
    if (!match) return '';
    var parts = match[1].split('.'); return Number(parts[0]) + '.' + (parts[1] + '0').slice(0, 2);
  }
  function detectBrowser(ua) {
    ua = String(ua || '');
    var platform = /PlayStation\s*5\b/i.test(ua) ? 'ps5' : /PlayStation\s*4\b/i.test(ua) ? 'ps4' : '';
    return {platform: platform, firmware: platform ? browserFirmware(ua, platform) : '',
      device: platform ? platform.toUpperCase() : /Android|iPhone|iPad|Mobile/i.test(ua) ? 'Phone / tablet' : 'Computer / other browser',
      source: platform ? 'Console browser' : 'No console browser detected'};
  }
  function compareGameVersions(a, b) {
    var av = String(a.gameVersion || '').split('.').map(Number), bv = String(b.gameVersion || '').split('.').map(Number);
    for (var i = 0; i < Math.max(av.length, bv.length); i++) { var diff = (bv[i] || 0) - (av[i] || 0); if (diff) return diff; }
    return String(a.label || '').localeCompare(String(b.label || ''));
  }
  function firmwareLabel(action) {
    var versions = action.firmwares || [];
    if (!versions.length) return 'See requirements';
    if (versions.length <= 3) return versions.join(', ');
    return versions[0] + ' … ' + versions[versions.length - 1] + ' (' + versions.length + ' listed versions)';
  }
  function requiresFirmware(action) { return Boolean(action.run) || action.category === 'loaders' && Boolean(action.launchURL); }
  function consoleDownloadURL(platform, address, fileId, normalize) {
    if (platform !== 'ps4' && platform !== 'ps5') throw Error('Choose PS4 or PS5.');
    if (!/^[a-z0-9][a-z0-9._-]{0,159}$/i.test(fileId || '')) throw Error('Choose a file from the console catalogue.');
    return 'http://' + normalize(address) + ':6701/' + (platform === 'ps4' ? 'data/' : '') + 'whatsite-' + platform + '.html?file=' + encodeURIComponent(fileId);
  }
  function targetAddress(value, platform, detected, normalize) {
    var address = normalize(value);
    if ((address === 'localhost' || /^127\./.test(address)) && detected.platform !== platform) throw Error('Enter the ' + platform.toUpperCase() + ' LAN address when using a PC, phone or another console.');
    return address;
  }
  function managerURL(address, route, normalize) {
    if (['','autoload','storage','sources','processes','settings'].indexOf(route) < 0) throw Error('Choose a supported Payload Manager screen.');
    return 'http://' + normalize(address) + ':8084/#/' + route;
  }
  function workspaceURL(platform,address,view,normalize) {
    if (['files','payloads','autoload'].indexOf(view) < 0 || ['ps4','ps5'].indexOf(platform) < 0) throw Error('Choose a supported console workspace.');
    return 'http://' + normalize(address) + (platform === 'ps4' ? ':8080/data/' : ':9090/data/homebrew/ezremote-client/assets/') + 'whatsite-workspace-' + platform + '.html?view=' + view;
  }
  function actionImage(action) {
    var value = String(action.image || '');
    return /^\/assets\/images\/[a-z0-9._/ -]+\.(?:png|jpe?g|webp|svg)$/i.test(value) && value.indexOf('..') < 0 ? value : '';
  }
  function menuFamily(action) {
    return String(action.menuFamily || action.family || action.label || '').replace(/\s+v?\d+(?:\.\d+)+$/i, '').trim();
  }
  function versionOrder(a, b) {
    if (!a || !b) return a ? -1 : b ? 1 : 0;
    var av = String(a).replace(/^v/i, '').split('.').map(Number), bv = String(b).replace(/^v/i, '').split('.').map(Number);
    for (var i = 0; i < Math.max(av.length, bv.length); i++) { var difference = (bv[i] || 0) - (av[i] || 0); if (difference) return difference; }
    return 0;
  }
  function groupActions(actions) {
    var groups = [], byKey = Object.create(null);
    actions.forEach(function (action) {
      var family = action.category === 'mods' && action.game ? menuFamily(action) : action.label;
      var key = action.category === 'mods' && action.game ? [action.platform,action.game,family].join('|').toLowerCase() : 'action|' + action.id;
      if (!byKey[key]) { byKey[key] = {id:'host-group-' + groups.length,label:action.resourceType === 'cheat-definitions' ? action.label : family,game:action.game,platform:action.platform,actions:[]}; groups.push(byKey[key]); }
      byKey[key].actions.push(action);
    });
    groups.forEach(function (group) { group.actions.sort(function (a,b) { return versionOrder(a.gameVersion,b.gameVersion) || versionOrder(a.menuVersion,b.menuVersion) || String(a.id).localeCompare(String(b.id)); }); });
    return groups;
  }
  function variantLabel(action) {
    return ['Game update: ' + (action.gameVersion || 'Not provided'), (action.resourceType === 'cheat-definitions' ? 'Trainer version: ' : 'Menu version: ') + (action.menuVersion || 'Not provided'), String(action.format || '').toUpperCase(), action.variantLabel || action.hostVariant, (action.titleIds || []).join(', ')].filter(Boolean).join(' · ');
  }
  function imageCaption(action) {
    return /menu cover/i.test(action.imageRole || '') ? 'Menu cover' : /game artwork/i.test(action.imageRole || '') || /^(?:MC4|JSON|SHN|XML)$/i.test(action.format || '') ? 'Game artwork' : action.game ? 'Menu preview' : 'Project preview';
  }
  function scopeActions(actions, scope) {
    if (!scope) return actions;
    return actions.filter(function (action) {
      if (action.category !== 'mods') return true;
      var game = String(action.game || '');
      var gta = /^(?:GTA\s*(?:V|5)|Grand Theft Auto\s*(?:V|5))$/i.test(game);
      var rdr = /^(?:RDR\s*2|Red Dead Redemption\s*2)$/i.test(game);
      return scope === 'gta5' ? gta : scope === 'rdr2' ? rdr : scope === 'other-games' ? !gta && !rdr : false;
    });
  }
  function loadCapability(action) {
    var type = action.run && action.run.type, format = String(action.format || '').toUpperCase();
    if (['goldhen-http','elf-http','elf-tcp','ps5-manager'].indexOf(type) !== -1 || type === 'bin-tcp' && action.platform === 'ps4' && format === 'BIN' && action.run.port === 9020) return {available:true,kind:'payload',reason:''};
    if (action.runtimeId && /^\/hosts\/runtime\//.test(action.launchURL || '')) return {available:true,kind:'browser',reason:'Open this host on the matching console to use its built-in browser loader.'};
    if (/^(PRX|SPRX)$/.test(format)) return {available:false,kind:'plugin',reason:'This plugin loads through the console’s native plugin manager. Web loading is not available for this build.'};
    if (/^(JSON|MC4|SHN|XML)$/.test(format)) return {available:false,kind:'data',reason:'Install this file in the native cheat or patch manager, then enable it in the game.'};
    return {available:false,kind:'unsupported',reason:'No verified built-in loading method is available for this build. Setup and original sources are under Requirements.'};
  }
  function downloadPlan(action, platform, address, detected, normalize) {
    if (!action.downloadURL) throw Error('This entry does not provide a downloadable file.');
    if (String(address || '').trim() || detected.platform === platform) {
      var target = targetAddress(address || '127.0.0.1',platform,detected,normalize);
      if (!action.consoleFileId) throw Error('Update the console downloader catalogue before saving this file to the console.');
      return {destination:'console',address:target,url:consoleDownloadURL(platform,target,action.consoleFileId,normalize)};
    }
    return {destination:'device',address:'',url:action.downloadURL};
  }
  function connectionState() {
    var generation = 0, warnings = Object.create(null);
    return {
      invalidate:function () { generation++; },
      beginCheck:function (address) { return {generation:++generation,address:address}; },
      accepts:function (ticket,address) { return ticket.generation === generation && ticket.address === address; },
      warning:function (address) { return warnings[address] || null; },
      markUncertain:function (address,actionId) { warnings[address] = {actionId:actionId,at:Date.now()}; },
      clearWarning:function (address) { delete warnings[address]; },
      serialize:function () { return warnings; },
      restore:function (value,normalize) {
        warnings = Object.create(null);
        Object.keys(value || {}).slice(0,32).forEach(function (address) {
          try {
            var item = value[address];
            if (normalize(address) !== address || !item || !/^[a-z0-9][a-z0-9._-]{0,127}$/i.test(item.actionId || '') || !isFinite(item.at)) return;
            warnings[address] = {actionId:item.actionId,at:Number(item.at)};
          } catch (_) {}
        });
      }
    };
  }
  function filterActions(actions, category, firmware, query, game, showLegacy) {
    var words = String(query || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    return actions.filter(function (action) {
      var text = [action.label, action.menuFamily, action.game, action.gameVersion, action.menuVersion, action.version, action.format, (action.titleIds || []).join(' '), (action.tags || []).join(' '), (action.requirements || []).join(' ')].join(' ').toLowerCase();
      return (showLegacy || !action.legacy) && (category === 'all' || action.category === category || (action.categories || []).indexOf(category) !== -1) && (!game || action.game === game) && firmwareMatches(action, firmware) && words.every(function (word) { return text.indexOf(word) !== -1; });
    }).sort(function (a, b) { return a.game && b.game && a.game === b.game ? compareGameVersions(a, b) : 0; });
  }
  function safeURL(value, base) {
    if (!value || !String(value).trim()) return '';
    try { var url = new URL(value, base); return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : ''; } catch (_) { return ''; }
  }
  function install(doc, win) {
    var chooser = doc.querySelector('#host-auto-detect');
    if (chooser) {
      var browser = detectBrowser(win.navigator.userAgent), detectedLink = doc.querySelector('#host-detected-link');
      chooser.textContent = browser.platform ? 'Detected console: ' + browser.device + (browser.firmware ? ' · Browser firmware: ' + browser.firmware : '') : 'Open this page in your console browser for automatic firmware detection.';
      if (browser.platform && detectedLink) { detectedLink.href = '/hosts/' + browser.platform + '/'; detectedLink.textContent = 'Open ' + browser.device + ' host'; detectedLink.hidden = false; }
    }
    var source = doc.querySelector('#host-actions-data'); if (!source) return;
    var catalog; try { catalog = JSON.parse(source.textContent); } catch (_) { return; }
    var actions = catalog.actions || [], platform = catalog.platform;
    var gameScope = catalog.gameScope || '', gamesLanding = Boolean(catalog.gamesLanding);
    var client = win.HostConsoleClient, category = catalog.managerView ? 'payloads' : 'mods', bridge = null, loading = false;
    var initialCategory = String(win.location.hash || '').replace(/^#/, '');
    if (['mods','payloads','loaders','tools'].indexOf(initialCategory) !== -1) category = initialCategory;
    var firmware = doc.querySelector('#host-firmware'), search = doc.querySelector('#host-search'), game = doc.querySelector('#host-game'), legacy = doc.querySelector('#host-show-legacy');
    var firmwareSource = doc.querySelector('#host-firmware-source'), detection = detectBrowser(win.navigator.userAgent);
    var address = doc.querySelector('#host-console-address'), status = doc.querySelector('#host-status');
    var grid = doc.querySelector('#host-action-grid'), count = doc.querySelector('#host-action-count');
    var overlay = doc.querySelector('#host-version-overlay'), versionChoices = doc.querySelector('#host-version-choices'), versionDetail = doc.querySelector('#host-version-detail');
    var renderedGroups = [], activeGroup = null, selectedActionId = '', returnFocus = null;
    if (overlay) doc.body.appendChild(overlay);
    var bridgeURL = doc.querySelector('#host-bridge-url'), token = doc.querySelector('#host-bridge-token');
    var storageKey = 'whatwhatboy.host.' + platform, connection = connectionState(), pairingGeneration = 0;
    function each(nodes, callback) { Array.prototype.forEach.call(nodes, callback); }
    function refresh(node) { if (win.__scoobyI18n && win.__scoobyI18n.refresh) win.__scoobyI18n.refresh(node); }
    function tell(message, error) { status.textContent = message; status.setAttribute('data-error', error ? 'true' : 'false'); refresh(status); var modalStatus = doc.querySelector('#host-version-status'); if (modalStatus && overlay && !overlay.hidden) { modalStatus.textContent = message; modalStatus.setAttribute('data-error',error ? 'true' : 'false'); refresh(modalStatus); } }
    function currentAddress() {
      if (!client) throw Error('The console connection helper is unavailable. Reload this page.');
      return targetAddress(address.value, platform, detection, client.normalizeAddress);
    }
    function remember() { try { win.localStorage.setItem(storageKey, JSON.stringify({address: address.value, firmware: firmware.value,uncertainTransfers:connection.serialize()})); } catch (_) {} }
    function configuredAddress() { try { return currentAddress(); } catch (_) { return ''; } }
    function invalidateChecks() {
      connection.invalidate();
      doc.querySelector('#host-service-status').textContent = 'Service: not verified';
      var checks = doc.querySelector('#host-service-checks'); if (checks) { checks.hidden = true; checks.innerHTML = ''; }
      var checkButton = doc.querySelector('#host-check-services'); checkButton.disabled = false; checkButton.removeAttribute('aria-busy');
    }
    function actionById(id) { return actions.filter(function (a) { return a.id === id; })[0]; }
    function launchURL(action) {
      var raw = action.launchURL || '';
      if (raw.indexOf('{address}') !== -1) raw = raw.replace(/\{address\}/g, currentAddress());
      return navigationURL(raw);
    }
    function navigationURL(value) {
      var url = safeURL(value, win.location.href);
      if (url && doc.querySelector('meta[name="whatwhatboy-local-sender"]')) {
        var parsed = new URL(url);
        if (parsed.origin === win.location.origin && (/^\/(?:console|guides|docs)\//.test(parsed.pathname) || /^\/hosts\/runtime\//.test(parsed.pathname) || /^\/downloads\//.test(parsed.pathname) && !actions.some(function (action) { return action.downloadURL === parsed.pathname; }))) return 'https://whatwhatboy.com' + parsed.pathname + parsed.search + parsed.hash;
      }
      return url;
    }
    function requestDownload(action, event, plan) {
      if (!plan) plan = downloadPlan(action,platform,address.value,detection,client && client.normalizeAddress);
      if (plan.destination === 'console') {
        if (event) event.preventDefault();
        win.open(plan.url,'_blank','noopener');
        tell('Opening the console downloader. It must be installed and running; its native page checks the queue and destination before saving.');
      } else {
        if (!event) {
          var url = safeURL(plan.url,win.location.href); if (!url) throw Error('The file URL is invalid.');
          var anchor = doc.createElement('a'); anchor.href = url; anchor.setAttribute('download',''); anchor.setAttribute('data-no-file-options',''); anchor.hidden = true;
          doc.body.appendChild(anchor); anchor.click(); doc.body.removeChild(anchor);
        }
        tell('Download requested to this device.');
      }
      return plan;
    }
    function actionMarkup(action) {
        var download = safeURL(action.downloadURL || '', win.location.href);
        var launch = Boolean(action.launchURL), capability = loadCapability(action);
        var canBridge = bridge && bridge.actions && bridge.actions.some(function (a) { return a.id === action.id && a.platform === platform && a.available; });
        var needsFirmware = requiresFirmware(action) && !firmware.value;
        var isMenu = action.category === 'mods';
        var label = isMenu || action.run || capability.kind === 'browser' ? 'Load' : launch ? 'Open host' : '';
        var requiresSender = action.run && (action.run.type === 'elf-tcp' || action.run.type === 'bin-tcp') && !canBridge;
        var uncertain = action.run && connection.warning(configuredAddress());
        var disabled = isMenu && !capability.available || needsFirmware || requiresSender || capability.kind === 'browser' && detection.platform !== platform || loading || uncertain;
        var meta = [action.format ? String(action.format).toUpperCase() : '', action.game ? '' : action.version, firmwareLabel(action)].filter(Boolean).join(' · ');
        var details = (action.requirements || []).map(function (text) { return '<li>' + escape(text) + '</li>'; }).join('');
        var links = [['source','Project source'],['licenseURL','Licence'],['instructionsURL','Instructions'],['sourceArchiveURL','Corresponding source']].map(function (entry) { var url = navigationURL(action[entry[0]]); return url ? '<a href="' + escape(url) + '" target="_blank" rel="noopener noreferrer">' + entry[1] + '</a>' : ''; }).filter(Boolean).join(' · ');
        var originalHost = action.hostURL || action.launchURL || '';
        if (originalHost.indexOf('{address}') !== -1) originalHost = '';
        originalHost = navigationURL(originalHost);
        var artwork = actionImage(action), imageLabel = imageCaption(action), releaseLabel = action.resourceType === 'cheat-definitions' ? 'Trainer version' : 'Menu version';
        return '<article class="host-action' + (artwork ? ' host-action-with-art' : '') + '">' + (artwork ? '<figure class="host-action-art"><img src="' + escape(artwork) + '" alt="' + escape(action.label + ' · ' + imageLabel) + '" loading="lazy"></figure>' : '') + '<div class="host-action-content"><div class="host-action-title"><h3>' + escape(action.label) + '</h3>' + (action.game ? '<span>' + escape(action.game) + '</span>' : '') + '</div>' + (action.game ? '<dl class="host-version-facts"><div><dt>Game update</dt><dd>' + escape(action.gameVersion || 'Not provided') + '</dd></div><div><dt>' + releaseLabel + '</dt><dd>' + escape(action.menuVersion || 'Not provided') + '</dd></div></dl>' : '') + '<p class="host-action-meta">' + escape(meta) + '</p>' + (action.variantLabel || action.hostVariant ? '<p class="host-action-meta">' + escape(action.variantLabel || action.hostVariant) + '</p>' : '') + (action.titleIds && action.titleIds.length ? '<p class="host-action-meta">' + escape(action.titleIds.join(', ')) + '</p>' : '') + (action.supportArchiveURL ? '<p class="host-file-note">Plugin update file. First installation also needs its support files.</p>' : '') + '<div class="host-action-buttons">' +
          (download ? '<a class="host-download" data-no-file-options data-download-action="' + escape(action.id) + '" href="' + escape(download) + '" download>Download</a>' : '') +
          (label ? '<button type="button" class="host-launch" data-launch="' + escape(action.id) + '"' + (disabled ? ' disabled title="' + escape(!capability.available && isMenu ? capability.reason : 'Choose compatible firmware and a running console loader.') + '"' : '') + '>' + escape(label) + '</button>' : '') + '</div>' +
          (download ? '<p class="host-download-destination">Download destination: ' + escape(String(address.value || '').trim() || detection.platform === platform ? platform.toUpperCase() : 'This device') + '</p>' : '') +
          (isMenu && !capability.available ? '<p class="host-load-note">' + escape(capability.reason) + '</p>' : '') +
          (capability.kind === 'browser' && detection.platform !== platform ? '<p class="host-load-note">' + escape(capability.reason) + '</p>' : '') +
          (requiresSender ? '<p class="host-load-note">' + (action.run.type === 'bin-tcp' ? 'Connect the paired desktop sender to load this BIN.' : 'Connect the paired desktop sender to load this ELF.') + '</p>' : '') +
          (uncertain ? '<p class="host-load-note">A previous transfer has an unknown result. Check the console and clear its transfer warning before loading again.</p>' : '') +
          '<details><summary>Requirements</summary><ul>' + details + '</ul>' + (action.firmwares && action.firmwares.length ? '<p>Firmware: ' + escape(action.firmwares.join(', ')) + '</p>' : '') + (action.license ? '<p>' + escape(action.license) + '</p>' : '') + links + (action.supportArchiveURL ? ' · <a href="' + escape(navigationURL(action.supportArchiveURL)) + '">Full setup files</a>' : '') + (!action.run && originalHost ? ' · <a href="' + escape(originalHost) + '" target="_blank" rel="noopener noreferrer">Original host</a>' : '') + '</details></div></article>';
    }
    function groupMarkup(group) {
      if (group.actions[0].category !== 'mods') return actionMarkup(group.actions[0]);
      var first = group.actions[0], artwork = actionImage(first), caption = imageCaption(first);
      var gameVersions = group.actions.map(function (a) { return a.gameVersion || 'Not provided'; }).filter(function (v,i,all) { return all.indexOf(v) === i; });
      var menuVersions = group.actions.map(function (a) { return a.menuVersion || 'Not provided'; }).filter(function (v,i,all) { return all.indexOf(v) === i; });
      var releaseLabel = first.resourceType === 'cheat-definitions' ? 'Trainer versions' : 'Menu versions';
      return '<article class="host-action host-menu-group">' + (artwork ? '<figure class="host-action-art"><img src="' + escape(artwork) + '" alt="' + escape(group.label + ' · ' + caption) + '" loading="lazy"></figure>' : '') + '<div class="host-action-content"><div class="host-action-title"><h3>' + escape(group.label) + '</h3><span>' + escape(group.game) + '</span></div><dl class="host-version-facts"><div><dt>Game updates</dt><dd>' + escape(gameVersions.join(', ')) + '</dd></div><div><dt>' + releaseLabel + '</dt><dd>' + escape(menuVersions.join(', ')) + '</dd></div></dl><p class="host-action-meta">' + group.actions.length + ' variants · ' + escape(group.platform.toUpperCase()) + '</p><button type="button" class="host-choose-version" data-choose-group="' + escape(group.id) + '">Choose version</button></div></article>';
    }
    function collectionMarkup(actions) {
      var collections = [['gta5','GTA 5','/assets/images/gta52.png'],['rdr2','RDR2','/assets/images/rdr2.png'],['other-games','Other games','/assets/images/custom-mod-art/mods-ps4-ps5.jpg']];
      return collections.map(function (collection) {
        var items = scopeActions(actions,collection[0]), groups = groupActions(items);
        return '<a class="host-action host-game-collection" href="/hosts/' + platform + '/' + collection[0] + '/" target="_blank" rel="noopener"><figure class="host-action-art"><img src="' + collection[2] + '" alt="' + escape(collection[1]) + '" loading="lazy"></figure><div class="host-action-content"><h3>' + escape(collection[1]) + '</h3><p>' + groups.length + ' menus · ' + items.length + ' variants</p><span>Open game page →</span></div></a>';
      }).join('');
    }
    function renderVariant() {
      var action = activeGroup && activeGroup.actions.filter(function (a) { return a.id === selectedActionId; })[0];
      versionDetail.innerHTML = action ? actionMarkup(action) : '';
      each(versionChoices.querySelectorAll('[data-version-id]'),function (button) { button.setAttribute('aria-pressed',button.getAttribute('data-version-id') === selectedActionId ? 'true' : 'false'); });
      refresh(versionDetail);
    }
    function closeVersions() {
      if (!overlay || overlay.hidden) return;
      var groupId = activeGroup && activeGroup.id;
      overlay.hidden = true; doc.body.classList.remove('host-dialog-open'); activeGroup = null; selectedActionId = '';
      if (returnFocus && doc.documentElement.contains(returnFocus)) returnFocus.focus();
      else { var firstChoice = groupId && grid.querySelector('[data-choose-group="' + groupId + '"]') || grid.querySelector('[data-choose-group]'); if (firstChoice) firstChoice.focus(); }
    }
    function openVersions(group, trigger) {
      if (!group || !overlay) return;
      activeGroup = group; returnFocus = trigger;
      doc.querySelector('#host-version-title').textContent = group.label;
      doc.querySelector('#host-version-game').textContent = group.game + ' · ' + platform.toUpperCase();
      selectedActionId = group.actions[0].id;
      versionChoices.innerHTML = group.actions.map(function (action) { return '<button type="button" data-version-id="' + escape(action.id) + '" aria-label="' + escape(variantLabel(action)) + '" aria-pressed="' + (action.id === selectedActionId ? 'true' : 'false') + '"><span>Game update <strong>' + escape(action.gameVersion || 'Not provided') + '</strong></span><span>' + (action.resourceType === 'cheat-definitions' ? 'Trainer version' : 'Menu version') + ' <strong>' + escape(action.menuVersion || 'Not provided') + '</strong></span><small>' + escape([String(action.format || '').toUpperCase(),action.variantLabel || action.hostVariant,(action.titleIds || []).join(', ')].filter(Boolean).join(' · ')) + '</small></button>'; }).join('');
      doc.querySelector('#host-version-status').textContent = 'Choose the game update and menu version before downloading or loading.';
      overlay.hidden = false; doc.body.classList.add('host-dialog-open'); renderVariant(); refresh(overlay); versionChoices.querySelector('button').focus();
    }
    function render() {
      var firmwareNote = doc.querySelector('#host-firmware-note');
      if (firmwareNote) firmwareNote.hidden = firmware.value !== '14.00';
      if (grid) {
      var visible = filterActions(scopeActions(actions,gameScope), category, firmware.value, search.value, category === 'mods' ? game.value : '', legacy.checked);
      doc.querySelector('#host-game-filter').hidden = category !== 'mods' || gamesLanding || gameScope === 'gta5' || gameScope === 'rdr2';
      if (category === 'mods' && gamesLanding) grid.classList.add('host-game-collections'); else grid.classList.remove('host-game-collections');
      renderedGroups = groupActions(visible);
      count.textContent = renderedGroups.length + ' cards · ' + visible.length + ' variants';
      if (category === 'mods' && gamesLanding) {
        count.textContent = '3 game pages';
        grid.innerHTML = collectionMarkup(visible);
      } else if (category === 'loaders') {
        var localGroups = [], otherGroups = [];
        renderedGroups.forEach(function (group) { (group.actions[0].runtimeId ? localGroups : otherGroups).push(group); });
        grid.innerHTML = localGroups.map(groupMarkup).join('') + (otherGroups.length ? '<details class="host-other-hosts"><summary>Other hosts</summary><p>These links open the original external hosts and setup pages.</p><div class="host-action-grid">' + otherGroups.map(groupMarkup).join('') + '</div></details>' : '');
      } else grid.innerHTML = renderedGroups.map(groupMarkup).join('');
      if (activeGroup) {
        var selectedId = selectedActionId;
        var updated = renderedGroups.filter(function (g) { return g.actions.some(function (a) { return a.id === selectedId; }); })[0];
        if (updated) { activeGroup = updated; renderVariant(); } else closeVersions();
      }
      doc.querySelector('#host-empty').hidden = visible.length !== 0 || category === 'mods' && gamesLanding;
      refresh(grid); refresh(count);
      }
      var managerLoad = doc.querySelector('#host-load-manager'); if (managerLoad) managerLoad.disabled = loading || !firmware.value;
      var warning = connection.warning(configuredAddress()), recovery = doc.querySelector('#host-transfer-warning');
      if (recovery) {
        recovery.hidden = !warning;
        if (warning) {
          var uncertainAction = actionById(warning.actionId);
          doc.querySelector('#host-transfer-warning-target').textContent = platform.toUpperCase() + ' · ' + configuredAddress() + ' · ' + (uncertainAction ? uncertainAction.label : warning.actionId);
          if (managerLoad) managerLoad.disabled = true;
        }
      }
    }
    function service(name) {
      try { var selector = doc.querySelector('#host-file-service'); var selected = name === 'files' ? selector ? selector.value : platform === 'ps4' ? 'ps4-files' : 'files' : name; var destination = currentAddress(); var url = client.serviceURL(destination, selected); win.open(url, '_blank', 'noopener'); tell('Opening ' + platform.toUpperCase() + ' ' + (name === 'files' ? 'file manager' : name) + ' at ' + destination + '. Start the named console service first.'); }
      catch (error) { tell(error.message, true); }
    }
    function result(value) {
      tell(value.message || value.status || 'Request finished.', /error|blocked|unavailable|uncertain/.test(value.status || ''));
      var url = safeURL(value.launchURL, win.location.href);
      if (url && /^(?:blocked|error)$/.test(value.status || '')) { var link = doc.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = ' Send using console loader'; status.appendChild(link); refresh(status); }
    }
    function runAction(action) {
      if (!action || !action.run) return;
      if (requiresFirmware(action) && !firmware.value || !firmwareMatches(action,firmware.value)) { tell('Choose a payload matching the installed firmware.',true); return; }
      if (loading) { tell('A payload transfer is already in progress. Check its result before sending another.',true); return; }
      var destination; try { destination = currentAddress(); } catch (error) { tell(error.message, true); return; }
      if (connection.warning(destination)) { tell('A previous transfer has an unknown result. Check the console and clear its transfer warning before loading again.',true); return; }
      var bridgeAction = bridge && bridge.actions && bridge.actions.some(function (a) { return a.id === action.id && a.platform === platform && a.available; });
      if (bridgeAction && (!bridge.capabilities || !bridge.capabilities.uncertainOutcomes)) { tell('Update the desktop sender before loading. This version cannot report uncertain transfer results.',true); return; }
      var confirmation = action.confirmBeforeLoad;
      if (confirmation && win.__scoobyI18n && win.__scoobyI18n.t) confirmation = win.__scoobyI18n.t(confirmation);
      if (confirmation && (!win.confirm || !win.confirm(confirmation))) { tell('Load cancelled. Nothing was sent.'); return; }
      var copyControl = doc.querySelector('#host-download-on-run'), copy = copyControl && copyControl.checked;
      if (copy) {
        try { requestDownload(action,null,downloadPlan(action,platform,destination,detection,client.normalizeAddress)); }
        catch (error) { tell(error.message,true); return; }
      }
      loading = true; render(); tell('Sending the selected payload to ' + platform.toUpperCase() + ' at ' + destination + '…');
      var request;
      try {
      if (bridgeAction) request = client.runViaBridge(destination, action.id, token.value, platform, {bridgeURL: bridgeURL.value, origin: win.location.origin, firmware: firmware.value, gameVersion: action.gameVersion || ''});
      else if (action.run.type === 'goldhen-http') request = client.sendGoldHEN(destination, action, {origin: win.location.origin});
      else if (action.run.type === 'elf-http') request = client.sendPS5ELF(destination, action, {origin: win.location.origin});
      else if (action.run.type === 'ps5-manager') request = client.launchInstalled(destination, action.run.path, {origin: win.location.origin});
      else { loading = false; render(); tell('Connect the local sender to run this payload. You can download it now.', true); return; }
      } catch (error) { loading = false; render(); tell(error.message, true); return; }
      Promise.resolve(request).then(function (value) {
        if (value.status === 'uncertain' || value.mayHaveExecuted) { connection.markUncertain(destination,action.id); remember(); }
        loading = false; render();
        result(value);
      }).catch(function (error) { if (error.mayHaveExecuted) { connection.markUncertain(destination,action.id); remember(); } loading = false; render(); tell(error.message, true); });
    }
    function handleActionClick(event) {
      var button = event.target;
      var container = event.currentTarget;
      while (button && button !== container && !button.hasAttribute('data-launch') && !button.hasAttribute('data-open-action') && !button.hasAttribute('data-download-action') && !button.hasAttribute('data-choose-group')) button = button.parentNode;
      if (!button || button === container) return;
      if (button.hasAttribute('data-choose-group')) { openVersions(renderedGroups.filter(function (g) { return g.id === button.getAttribute('data-choose-group'); })[0],button); return; }
      var action = actionById(button.getAttribute('data-launch') || button.getAttribute('data-open-action') || button.getAttribute('data-download-action')); if (!action) return;
      if (button.hasAttribute('data-download-action')) {
        try {
          if (!client && (String(address.value || '').trim() || detection.platform === platform)) throw Error('The console connection helper is unavailable. Reload this page.');
          requestDownload(action,event);
        } catch (error) { event.preventDefault(); tell(error.message,true); }
        return;
      }
      if (button.hasAttribute('data-open-action')) { try { win.open(launchURL(action), '_blank', 'noopener'); tell('Opening the installed service. Its availability has not been verified.'); } catch (error) { tell(error.message, true); } return; }
      if (requiresFirmware(action) && !firmware.value) { tell('Choose your installed firmware first.', true); return; }
      if (!firmwareMatches(action, firmware.value)) { tell('Choose a payload matching the installed firmware.', true); return; }
      if (action.run && (action.run.type === 'goldhen-http' || action.run.type === 'elf-http' || action.run.type === 'ps5-manager' || bridge)) { runAction(action); return; }
      if (action.run && (action.run.type === 'elf-tcp' || action.run.type === 'bin-tcp') && !action.launchURL) { doc.querySelector('.host-sender').open = true; tell(action.run.type === 'bin-tcp' ? 'Connect the paired desktop sender to load this BIN.' : 'Start the local sender, open its host page, and connect with the pairing token to run ELF files.'); return; }
      if (action.category === 'mods' && !loadCapability(action).available) { tell(loadCapability(action).reason,true); return; }
      if (loadCapability(action).kind === 'browser' && detection.platform !== platform) { tell(loadCapability(action).reason,true); return; }
      var url; try { url = launchURL(action); } catch (error) { tell(error.message, true); return; }
      if (url) { win.open(url, '_blank', 'noopener'); tell('Opening ' + action.label + '. Follow the loader status on that page.'); }
      else service('files');
    }
    if (grid) grid.addEventListener('click', handleActionClick);
    if (overlay) {
      versionDetail.addEventListener('click',handleActionClick);
      versionChoices.addEventListener('click',function (event) {
        var button = event.target;
        while (button && button !== versionChoices && !button.hasAttribute('data-version-id')) button = button.parentNode;
        if (!button || button === versionChoices) return;
        selectedActionId = button.getAttribute('data-version-id');
        doc.querySelector('#host-version-status').textContent = 'Choose the game update and menu version before downloading or loading.';
        renderVariant();
      });
      doc.querySelector('#host-version-close').addEventListener('click',closeVersions);
      overlay.addEventListener('click',function (event) { if (event.target === overlay) closeVersions(); });
      overlay.addEventListener('keydown',function (event) {
        if (event.key === 'Escape' || event.keyCode === 27) { event.preventDefault(); closeVersions(); return; }
        if (event.key !== 'Tab' && event.keyCode !== 9) return;
        var focusable = Array.prototype.filter.call(overlay.querySelectorAll('button:not([disabled]),a[href],select,input,summary,[tabindex="0"]'),function (node) {
          var ancestor = node.parentNode;
          while (ancestor && ancestor !== overlay) {
            if (ancestor.hidden || ancestor.tagName === 'DETAILS' && !ancestor.open && node !== ancestor.querySelector('summary')) return false;
            ancestor = ancestor.parentNode;
          }
          return node.offsetWidth || node.offsetHeight || node === doc.activeElement;
        });
        var first = focusable[0], last = focusable[focusable.length-1];
        if (!first) return;
        if (event.shiftKey && (doc.activeElement === first || !overlay.contains(doc.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (doc.activeElement === last || !overlay.contains(doc.activeElement))) { event.preventDefault(); first.focus(); }
      });
    }
    function useAddress(event) {
      if (event) event.preventDefault(); try { var value = currentAddress(); address.value = value; invalidateChecks(); remember(); doc.querySelector('#host-address-display').textContent = value; tell('Console address configured. Service availability has not been checked.'); render(); refresh(doc.querySelector('.host-connection-info')); } catch (error) { invalidateChecks(); tell(error.message, true); }
    }
    doc.querySelector('#host-address-form').addEventListener('submit', useAddress);
    address.addEventListener('input',function () {
      invalidateChecks();
      doc.querySelector('#host-address-display').textContent = configuredAddress() || 'Not configured';
      each(doc.querySelectorAll('.host-download-destination'),function (node) {
        node.textContent = 'Download destination: ' + (String(address.value || '').trim() || detection.platform === platform ? platform.toUpperCase() : 'This device'); refresh(node);
      });
      render();
    });
    doc.querySelector('#host-loopback').addEventListener('click', function () { address.value = '127.0.0.1'; useAddress(); });
    each(doc.querySelectorAll('[data-host-category]'), function (button) { button.setAttribute('aria-pressed', button.getAttribute('data-host-category') === category ? 'true' : 'false'); button.addEventListener('click', function () { category = button.getAttribute('data-host-category'); each(doc.querySelectorAll('[data-host-category]'), function (item) { item.setAttribute('aria-pressed', item === button ? 'true' : 'false'); }); render(); }); });
    firmware.addEventListener('change', function () { firmwareSource.textContent = 'Firmware selection: manual'; remember(); render(); refresh(firmwareSource); }); if (search) search.addEventListener('input', render); if (game) game.addEventListener('change', render); if (legacy) legacy.addEventListener('change', render);
    function detectConsole(manualRequest) {
      invalidateChecks();
      detection = detectBrowser(win.navigator.userAgent);
      var loopback = doc.querySelector('#host-loopback'); loopback.hidden = detection.platform !== platform; loopback.disabled = detection.platform !== platform;
      doc.querySelector('#host-detected-device').textContent = detection.device;
      doc.querySelector('#host-browser-firmware').textContent = detection.firmware ? 'Browser firmware: ' + detection.firmware : 'Browser firmware: not detected';
      var other = doc.querySelector('#host-other-console'); other.hidden = !detection.platform || detection.platform === platform;
      if (!other.hidden) { other.href = '/hosts/' + detection.platform + '/'; other.textContent = 'Open ' + detection.platform.toUpperCase() + ' host'; }
      if (detection.platform === platform && detection.firmware) {
        if (!Array.prototype.some.call(firmware.options, function (option) { return option.value === detection.firmware; })) {
          var option = doc.createElement('option'); option.value = detection.firmware; option.textContent = detection.firmware; firmware.appendChild(option);
        }
        firmware.value = detection.firmware;
        firmwareSource.textContent = 'Firmware selection: console browser';
        if (!address.value && !doc.querySelector('meta[name="whatwhatboy-local-sender"]')) address.value = '127.0.0.1';
        if (manualRequest) tell('Console browser firmware detected. Check the matching loader requirements.');
      } else if (manualRequest) tell('Open this page in the console browser to detect its firmware. On a computer or phone, select firmware manually.');
      doc.querySelector('#host-address-display').textContent = address.value || 'Not configured';
      remember(); render(); refresh(doc.querySelector('.host-connection-info'));
    }
    doc.querySelector('#host-detect').addEventListener('click', function () { detectConsole(true); });
    doc.querySelector('#host-check-services').addEventListener('click', function () {
      var target; try { target = currentAddress(); } catch (error) { tell(error.message, true); return; }
      if (!bridge || bridge.status !== 'connected') { doc.querySelector('.host-sender').open = true; tell('Connect the local sender to check console services. This does not run a payload.', true); return; }
      var ticket = connection.beginCheck(target), checkButton = doc.querySelector('#host-check-services');
      checkButton.disabled = true; checkButton.setAttribute('aria-busy','true');
      tell('Checking console services…');
      client.inspectConsole(target, platform, {bridgeURL:bridgeURL.value, token:token.value, origin:win.location.origin}).then(function (value) {
        if (!connection.accepts(ticket,configuredAddress())) return;
        checkButton.disabled = false; checkButton.removeAttribute('aria-busy');
        result(value);
        doc.querySelector('#host-service-status').textContent = value.status === 'connected' ? 'Service: ' + value.service + (value.version ? ' ' + value.version : '') : 'Service: not verified';
        if (value.reportedAddress) doc.querySelector('#host-address-display').textContent = value.reportedAddress + ' (service-reported)';
        var checks = doc.querySelector('#host-service-checks');
        if (checks && Array.isArray(value.checks)) {
          var labels = {goldhen:'GoldHEN loader','payload-manager':'Payload Manager',downloader:'Console downloader','ps4-files':'PS4 file manager',files:'PS5 websrv',ezremote:'PS5 ezRemote'};
          checks.hidden = false;
          checks.innerHTML = value.checks.map(function (check) { return '<div class="host-service-result" data-state="' + escape(check.status) + '"><strong>' + escape(labels[check.service || check.id] || check.service || check.id) + '</strong><span>' + escape(check.status === 'connected' ? 'Responding' : 'Not verified') + '</span><p>' + escape(check.message) + '</p></div>'; }).join('');
          refresh(checks);
        } else if (checks) {
          checks.hidden = false;
          checks.innerHTML = '<p>Update the desktop sender to check the downloader and file-manager services.</p>';
          refresh(checks);
        }
        refresh(doc.querySelector('.host-connection-info'));
      }).catch(function (error) { if (!connection.accepts(ticket,configuredAddress())) return; checkButton.disabled = false; checkButton.removeAttribute('aria-busy'); tell(error.message, true); });
    });
    var clearTransfer = doc.querySelector('#host-clear-transfer-warning'); if (clearTransfer) clearTransfer.addEventListener('click',function () {
      var target = configuredAddress(); if (!target) return;
      connection.clearWarning(target); remember(); render();
      tell('Transfer warning cleared for this address. Nothing was sent or retried.');
    });
    each(doc.querySelectorAll('[data-open-service]'), function (button) { button.addEventListener('click', function () { service(button.getAttribute('data-open-service')); }); });
    each(doc.querySelectorAll('[data-open-workspace]'),function (button) { button.addEventListener('click',function () {
      try { var destination = currentAddress(); win.open(workspaceURL(platform,destination,button.getAttribute('data-open-workspace'),client.normalizeAddress),'_blank','noopener'); tell('Opening the installed console workspace. Keep ezRemote Client running and install the helper at the displayed path first.'); } catch (error) { tell(error.message,true); }
    }); });
    each(doc.querySelectorAll('[data-manager-route]'), function (button) { button.addEventListener('click', function () {
      try { if (platform !== 'ps5') throw Error('PS5 Payload Manager requires a PS5.'); var destination = currentAddress(); win.open(managerURL(destination,button.getAttribute('data-manager-route'),client.normalizeAddress),'_blank','noopener'); tell('Opening PS5 Payload Manager at ' + destination + '. The manager ELF must already be running.'); } catch (error) { tell(error.message,true); }
    }); });
    var loadManager = doc.querySelector('#host-load-manager'); if (loadManager) loadManager.addEventListener('click', function () { runAction(actionById('ps5-payload-manager')); });
    doc.querySelector('#host-connect-bridge').addEventListener('click', function () {
      if (!client) return;
      var generation = ++pairingGeneration, pairedURL = bridgeURL.value, pairedToken = token.value;
      bridge = null; invalidateChecks(); render();
      tell('Checking local sender…');
      client.inspectBridge(pairedURL, pairedToken, {origin: win.location.origin}).then(function (value) { if (generation !== pairingGeneration || pairedURL !== bridgeURL.value || pairedToken !== token.value) return; bridge = value.status === 'connected' ? value : null; result(value); render(); }).catch(function (error) { if (generation === pairingGeneration) tell(error.message, true); });
    });
    [bridgeURL,token].forEach(function (field) { field.addEventListener('input',function () { pairingGeneration++; bridge = null; invalidateChecks(); render(); }); });
    if (win.addEventListener) win.addEventListener('storage',function (event) {
      if (event.key !== storageKey || !client) return;
      try { var saved = JSON.parse(event.newValue || '{}'); connection.restore(saved.uncertainTransfers,client.normalizeAddress); render(); } catch (_) {}
    });
    doc.querySelector('#host-open-bridge').addEventListener('click', function () {
      var url = safeURL(bridgeURL.value, win.location.href); if (!url) { tell('Enter the local sender address.', true); return; }
      var parsed = new URL(url); parsed.pathname = '/hosts/' + platform + '/'; parsed.search = ''; parsed.hash = '';
      win.open(parsed.href, '_blank', 'noopener');
    });
    try { var saved = JSON.parse(win.localStorage.getItem(storageKey) || '{}'); address.value = saved.address || ''; firmware.value = saved.firmware || ''; if (client) connection.restore(saved.uncertainTransfers,client.normalizeAddress); } catch (_) {}
    firmwareSource.textContent = firmware.value ? 'Firmware selection: saved choice' : 'Firmware selection: not selected';
    if (doc.querySelector('meta[name="whatwhatboy-local-sender"]')) bridgeURL.value = win.location.origin;
    detectConsole(false);
  }
  return {firmwareNumber: firmwareNumber, firmwareMatches: firmwareMatches, firmwareLabel: firmwareLabel, requiresFirmware: requiresFirmware, consoleDownloadURL: consoleDownloadURL, targetAddress:targetAddress, managerURL:managerURL,workspaceURL:workspaceURL, actionImage:actionImage, menuFamily:menuFamily, groupActions:groupActions, variantLabel:variantLabel, imageCaption:imageCaption,scopeActions:scopeActions, loadCapability:loadCapability,downloadPlan:downloadPlan,connectionState:connectionState,browserFirmware: browserFirmware, detectBrowser: detectBrowser, compareGameVersions: compareGameVersions, filterActions: filterActions, safeURL: safeURL, install: install};
}));
