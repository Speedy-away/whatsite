'use strict';
const catalogue = require('../docs/console-exploit-hosts.json');
const origin = 'https://speedy-away.github.io';
const destinations = {ps4: origin + '/hosts/ps4/', ps5: origin + '/hosts/ps5/'};
const launchURLs = {
  ps4: new Set(catalogue.platforms.ps4.map(host => host.url).concat([
    'https://gamerhack.github.io/', 'https://gamerhack.github.io/g2all/',
    'https://raw13g.github.io/', 'https://aminegold0.github.io/silverps4hen/',
    'https://aminegold0.github.io/silverps4hen/raw13/jb.html?log=1&hx1400=1&v=6'
  ])),
  ps5: new Set(catalogue.platforms.ps5.map(host => host.url).filter(url => url !== 'https://store.playstation.com/').concat([
    'https://soniciso1.github.io/relapse/', 'https://umtx2.pages.dev/'
  ]))
};
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');

function apply(file, html) {
  const platform = file.replaceAll('\\', '/').match(/^console\/(ps[45])\//)?.[1];
  if (!platform || /whatsite-ps[45]\.html$/.test(file)) return html;
  const destination = destinations[platform];
  if (file.replaceAll('\\', '/') === 'console/ps4/jailbreak-13-52.html') {
    const originalStep = require('../docs/ps4-1352-guide.json').steps.find(step => step.title === 'Open and cache the matching host').text;
    html = html.replace(originalStep, 'Open ' + destination + ' in the PS4 browser and select your exact installed firmware. Choose the compatible browser entry and follow its displayed loading and cache instructions. Bookmark the selected entry if it supports offline use; cache preparation and restart steps depend on that build. This guide page is separate from the exploit host.')
      .replaceAll('Browser addresses from the video', 'Open your PS4 host')
      .replace(/<p><strong>GamerHack · combined firmware host<\/strong>[\s\S]*?<\/p><p><strong>RAW GAME · alternative host<\/strong>[\s\S]*?<\/p>/, '<p><strong>whatwhatboy’s PS4 host</strong><br><a href="' + destination + '" target="_blank" rel="noopener noreferrer">' + destination + '</a></p>');
  }
  if (file.replaceAll('\\', '/') === 'console/ps4/jailbreak.html') {
    html = html.replace('The supplied SilverPS4HEN link requests a 14.00 route. Its availability and payload support must be checked on the exact firmware.', 'Open whatwhatboy’s PS4 host below and select 14.00. Check the selected entry’s requirements and payload support for that exact firmware.');
  }
  if (file.replaceAll('\\', '/') === 'console/ps5/umtx2.html') {
    html = html.replace('Open this address on the console:', 'Open your PS5 host on the console, select your exact firmware from the listed 1.00–5.50 versions, then choose UMTX2:');
  }
  // Project documentation and image credits retain their original references.
  return html.split(/(<ul\b[^>]*class="guide-source-list"[^>]*>[\s\S]*?<\/ul>)/g).map((part, index) => {
    if (index % 2) return part;
    return part.replace(/<a\b([^>]*\shref="([^"]+)"[^>]*)>([\s\S]*?)<\/a>/g, (all, attrs, href, content) => {
      const url = href.replaceAll('&amp;', '&');
      if (/\sdownload(?:\s|=|$)/.test(attrs)) return all;
      const ownEntry = /^(?:https:\/\/(?:whatwhatboy\.com|speedy-away\.github\.io)(?:\/(?:WWB-HOST|wwb-host))?)?\/hosts\/(?:ps[45]\/)?$/.test(url);
      const hostCard = /\sclass="(?:[^"]*\s)?guide-host(?:\s|")/.test(attrs);
      if (hostCard) {
        // Previously generated cards kept their real destination in this attribute.
        const previous = attrs.match(/\sdata-original-host-url="([^"]+)"/);
        const cardURL = (ownEntry && previous ? previous[1] : href).replaceAll('&amp;', '&');
        const external = catalogue.platforms[platform].some(host => !host.firstParty && !host.requiresSourceDns && host.url === cardURL);
        if (external) {
          attrs = attrs.replace(/\shref="[^"]*"/, ' href="' + escape(cardURL) + '"');
          if (ownEntry && previous) {
            attrs = attrs.replace(previous[0], '').replace(/\saria-label="[^"]*"/, '');
            content = content.replace('<span class="guide-host-destination">Open WWB Host →</span>', '');
          }
          if (!content.includes('class="guide-host-destination"')) {
            content += '<span class="guide-host-destination">Open host →</span>';
          }
          return '<a' + attrs + '>' + content + '</a>';
        }
        if (!ownEntry) return all;
      }
      if (!ownEntry && !launchURLs[platform].has(url)) return all;
      const target = ownEntry ? destinations[url.match(/\/hosts\/(ps[45])\//)?.[1] || platform] : destination;
      if (url === target) return all;
      attrs = attrs.replace(/\shref="[^"]*"/, ' href="' + target + '"');
      if (!ownEntry && !attrs.includes('data-original-host-url=')) attrs += ' data-original-host-url="' + escape(url) + '"';
      const label = 'whatwhatboy’s ' + platform.toUpperCase() + ' host';
      if (hostCard) {
        attrs = attrs.replace(/\saria-label="[^"]*"/g, '') + ' aria-label="Open ' + label + ' and choose your exact firmware"';
      } else if (!ownEntry) {
        // Keep the external-link icon, but do not display the old launch address.
        const visible = content.replace(/<[^>]*>/g, '').trim().replaceAll('&amp;', '&');
        content = (visible === url ? destination : label) + (content.match(/\s*<i\b[\s\S]*?<\/i>/)?.[0] || '');
      }
      return '<a' + attrs + '>' + content + '</a>';
    });
  }).join('');
}

module.exports = {apply, destinations};
