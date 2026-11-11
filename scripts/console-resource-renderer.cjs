const fs = require('node:fs');
const path = require('node:path');
const {resourceTags, resourceTerms} = require('./console-resource-tags.cjs');
const {section, guideSection, grid, steps, videoEmbed, link, guideLink, ext, esc} = require('./build-console-guides.cjs');

const categories = {
  menu: 'Mod menus', client: 'Server clients', injector: 'Injectors', pack: 'Menu packs', script: 'Scripts', cfg: 'CFG resources',
  rtm: 'RTM tools', cheat: 'Cheat files', dlc: 'DLC resources', reference: 'DLC compatibility references', fpkg: 'FPKG resources', source: 'Source codes'
};

function createResourceRenderer({root = path.resolve(__dirname, '..'), files = []} = {}) {
  const storedFiles = files;
const pluginBundles=require('./gta5-plugin-downloads.cjs').createPluginDownloads();
const pluginDownloads=(item,downloads,legacy)=>pluginBundles.render(item,downloads,legacy);
const requirementsMarkup=item=>(item?.requiredResources||[]).filter(r=>/^#guide-[a-z0-9-]+$/.test(r.href||'')).map(r=>`<p class="guide-required-resource">${guideLink(r.href,h(r.label))}</p>`).join('');
const h = value => esc(String(value ?? ''));
const lines = value => h(value).replace(/\r?\n/g, '<br>');

function localFile(value, directory) {
  if (typeof value !== 'string' || !value.startsWith('/' + directory + '/') || /[?#\\]/.test(value)) return null;
  const allowed = path.resolve(root, directory) + path.sep;
  const target = path.resolve(root, '.' + value);
  return target.startsWith(allowed) && fs.existsSync(target) && fs.statSync(target).isFile() ? value : null;
}
function localImage(value) {
  return /\.(?:png|jpe?g|webp|avif|gif)$/i.test(value || '') ? localFile(value, 'assets/images') : null;
}
function httpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
function youtubeVideo(value) {
  const safe = httpsUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  const host = url.hostname.toLowerCase();
  let id;
  if (host === 'youtu.be') id = url.pathname.match(/^\/([A-Za-z0-9_-]{11})\/?$/)?.[1];
  else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host) && url.pathname === '/watch') id = url.searchParams.get('v');
  if (!/^[A-Za-z0-9_-]{11}$/.test(id || '')) return null;
  const target = new URL('https://www.youtube.com/watch');
  target.searchParams.set('v', id);
  const time = url.searchParams.get('t') || url.searchParams.get('start');
  if (time && /^(?:\d+|(?:\d+h)?(?:\d+m)?(?:\d+s)?)$/.test(time)) target.searchParams.set('t', time);
  let startSeconds = 0;
  if (time && /^\d+$/.test(time)) startSeconds = Number(time);
  else if (time) {
    const parts = time.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    if (parts) startSeconds = Number(parts[1] || 0) * 3600 + Number(parts[2] || 0) * 60 + Number(parts[3] || 0);
  }
  if (!Number.isSafeInteger(startSeconds)) return null;
  return {id, url: target.href, startSeconds};
}
function videoSource(clip) {
  if (!clip || typeof clip.url !== 'string') return null;
  const local = localFile(clip.url, 'assets/videos');
  if (local && /\.(?:mp4|webm)$/i.test(local)) return {kind: 'local', url: local, mime: /\.webm$/i.test(local) ? 'video/webm' : 'video/mp4'};
  const youtube = youtubeVideo(clip.url);
  return youtube ? {kind: 'youtube', ...youtube} : null;
}

const hasDetails = (item, excludedImage) => (item.guideBlocks || []).length || (item.controls || []).length || (item.images || []).some(image => image !== excludedImage && (localImage(image.display) || localImage(image.original))) || (item.videos || []).length;
const primaryImage = item => (item.images || []).find(image => image.role !== 'guide' && (localImage(image.display) || localImage(image.original)));
const screenshotId = (item, image) => 'guide-' + item.id + (hasDetails(item, image) ? '-screenshot' : '');
const legacyAnchors = (item, prefix) => (item.mergedResourceIds || []).map(id => `<span id="${prefix}-${h(id)}"${prefix === 'guide' ? ` data-guide-alias="guide-${h(item.id)}"` : ''}></span>`).join('');

function imageMarkup(image, name, naturalSize = false, popupId = '') {
  const source = localImage(image.display) || localImage(image.original);
  if (!source) return '';
  const caption = image.caption || name;
  if (popupId) {
    return `<a href="#${h(popupId)}" class="guide-screenshot-trigger" data-guide-open aria-label="Enlarge ${h(caption)}"><img src="${h(source)}" alt="${h(caption)}" loading="lazy"><i class="fas fa-expand" aria-hidden="true"></i></a>`;
  }
  const fullSize = naturalSize || image.role === 'guide';
  return `<a href="${h(source)}" target="_blank" rel="noopener noreferrer" aria-label="View ${h(caption)}"${fullSize ? ' style="display:block;width:100%;max-width:100%"' : ''}><img src="${h(source)}" alt="${h(caption)}" loading="lazy"${fullSize ? ' style="aspect-ratio:auto;height:auto;max-width:100%"' : ''}></a>`;
}
function downloadButton(file, item) {
  const stored = storedFiles.find(entry => entry.downloadId === file.id && entry.status === 'downloaded' && localFile(entry.local, 'downloads'));
  let url = stored ? stored.local : httpsUrl(file.url);
  let label = file.label || 'Download';
  if (!stored && url && new URL(url).hostname === 'cdn.discordapp.com') {
    const post = httpsUrl(item?.source?.postUrl);
    if (post && new URL(post).hostname === 'discord.com') {
      // Discord renews its signed attachment URL when a member opens the post.
      url = post;
      label += ' via Discord';
    }
  }
  return `<a href="${h(url)}" class="btn btn-primary" ${stored ? 'download' : 'target="_blank" rel="noopener noreferrer"'}><i class="fas fa-download" aria-hidden="true"></i> ${h(label)}</a>`;
}
function card(item) {
  const cardImage=require('./ps4-ps5-card-images.cjs').resourceImage(item);
  const cardMedia=require('./ps4-ps5-card-images.cjs').markup(cardImage);
  if(item.compactDownload===true){
    const files=(item.downloads||[]).filter(file=>file.distribution==='include');
    const actions=files.map(file=>{
      const stored=storedFiles.find(entry=>entry.downloadId===file.id&&entry.status==='downloaded'&&localFile(entry.local,'downloads'));
      return stored?`<div class="guide-links"><a class="btn btn-outline" href="${h(stored.local)}" download="${h(file.filename)}" aria-label="Download ${h(file.filename)}" data-no-file-options>Download</a><a class="btn btn-primary" href="/console/ps4/downloads.html?file=${encodeURIComponent(file.id)}#files">Save on PS4</a></div>`:downloadButton(file,item);
    }).join('');
    return `<article class="guide-resource multicod-card" id="resource-${h(item.id)}" data-search="${h(resourceTerms(item).join(' ').toLowerCase())}">${cardMedia}<h3>${h(item.name)}</h3><p>${h(item.version)}</p>${actions}<details class="multicod-details"><summary>Setup &amp; source</summary><p>${lines(item.compatibilityText)}</p>${guideLink('#guide-'+item.id,'Full setup & cheat conditions')}<p><a href="${h(httpsUrl(item.source?.postUrl))}" target="_blank" rel="noopener noreferrer">Publisher source</a></p></details></article>`;
  }
  const image = primaryImage(item);
  const screenshot = item.screenshotPopup ? image : undefined;
  const includedDownloads=(item.downloads || []).filter(file => file.distribution === 'include');
  const pairedDownloads=pluginDownloads(item,includedDownloads);
  const extras=includedDownloads.filter(file=>!pluginBundles.has(file.id)).filter(file=>{const stored=storedFiles.find(entry=>entry.downloadId===file.id);return !pluginBundles.choices(item,includedDownloads).some(row=>stored?.sha256===row.source.sha256);});
  const directDownloads = () => includedDownloads.map(file => downloadButton(file, item)).join('');
  const buttons = item.mergedResourceIds?.length ? directDownloads() + pairedDownloads : pairedDownloads ? pairedDownloads+(extras.length?'<div class="gta-plugin-separate">'+extras.map(file=>downloadButton(file,item).replace('class="btn btn-primary"','class="gta-plugin-extra"')).join('')+'</div>':'') : directDownloads();
  const cleanGta=item.gameIds?.includes('gta5') && !['client', 'rtm'].includes(item.category);
  const repository = httpsUrl(item.source?.repositoryUrl);
  const sourceLink = repository ? `<a href="${h(repository)}" target="_blank" rel="noopener noreferrer">Source code <i class="fas fa-external-link-alt" aria-hidden="true"></i></a>` : '';
  const videoGuide = youtubeVideo(item.videoButton?.url);
  const videoLink = videoGuide ? `<a class="btn btn-outline" href="${h(videoGuide.url)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-youtube" aria-hidden="true"></i> Watch video guide</a>` : '';
  const detailLink = (!cleanGta || item.mergedResourceIds?.length) && hasDetails(item, screenshot) ? guideLink('#guide-' + item.id, h(item.guideLabel || 'Guide & media')) : '';
  const search = resourceTerms(item).join(' ').toLowerCase();
  const tags = resourceTags(item).slice(0, 6);
  const tagMarkup = cleanGta ? '' : tags.length ? `<ul class="guide-resource-tags" aria-label="Tags">${tags.map(tag => `<li class="feature-tag">${h(tag)}</li>`).join('')}</ul>` : '';
  const relatedLinks = (item.relatedLinks || []).flatMap(({url, label}) => {
    const href = httpsUrl(url);
    return href && label ? [ext(href, h(label))] : [];
  }).join('');
  const actions = buttons + sourceLink + videoLink + detailLink + relatedLinks;
  const version = !item.hideCardBuildDetails && item.version ? `<p>${h(item.version)}</p>` : '';
  const compatibility = !cleanGta && !item.hideCardBuildDetails && item.compatibilityText ? `<p>${lines(item.compatibilityText)}</p>` : '';
  return `<article class="guide-resource" id="resource-${item.id}" data-search="${h(search)}">${legacyAnchors(item,'resource')}${image ? imageMarkup(image, item.name, false, screenshot ? screenshotId(item, screenshot) : '') : cardMedia}<h3>${h(item.name)}</h3>${version}${!cleanGta && item.description ? `<p>${lines(item.description)}</p>` : ''}${compatibility}${requirementsMarkup(item)}${tagMarkup}${actions ? `<div class="guide-links">${actions}</div>` : ''}</article>`;
}
function guideBlock(block) {
  const title = block.title ? `<h3>${h(block.title)}</h3>` : '';
  if (block.type === 'code') return title + `<pre class="guide-code"><code>${h(block.text)}</code></pre>`;
  if (block.type === 'steps') return title + steps(block.items.map(step => [lines(step.title), lines(step.text)]));
  if (block.type === 'list') return title + `<ul class="guide-source-list">${block.items.map(text => `<li>${lines(text)}</li>`).join('')}</ul>`;
  return title + `<p>${lines(block.text)}</p>`;
}
function videoMarkup(clip, name) {
  const parsed = videoSource(clip);
  const title = clip.title || name + ' video';
  if (parsed.kind === 'local') {
    const poster = localImage(clip.poster);
    return `<figure class="guide-local-video"><video controls playsinline preload="metadata"${poster ? ` poster="${h(poster)}"` : ''}><source src="${h(parsed.url)}" type="${parsed.mime}"><a href="${h(parsed.url)}">Open video</a></video><figcaption>${h(title)}</figcaption></figure>`;
  }
  return videoEmbed(parsed.id, title, parsed.startSeconds);
}
function details(item) {
  if (!hasDetails(item)) return '';
  const screenshot = item.screenshotPopup ? primaryImage(item) : undefined;
  const screenshotPanel = screenshot ? guideSection(screenshotId(item, screenshot), item.name,
    `<img class="guide-screenshot-image" src="${h(localImage(screenshot.original) || localImage(screenshot.display))}" alt="${h(screenshot.caption || item.name)}" loading="lazy">`
  ).replace('<section ', '<section data-guide-screenshot ') : '';
  const anchors = legacyAnchors(item, 'guide');
  if (!hasDetails(item, screenshot)) return anchors + screenshotPanel;
  const guide = (item.guideBlocks || []).map(guideBlock).join('\n');
  const controls = (item.controls || []).length ? `<h3>Controls</h3><dl>${item.controls.map(control => `<dt><strong>${lines(control.input)}</strong></dt><dd>${lines(control.action)}</dd>`).join('')}</dl>` : '';
  const images = (item.images || []).filter(image => image !== screenshot && image.role !== 'guide').map(image => imageMarkup(image, item.name, true)).filter(Boolean);
  const figures = images.map(markup => `<figure class="guide-resource">${markup}</figure>`);
  const gallery = images.length === 1 ? figures[0] : images.length ? grid(...figures) : '';
  const guideImages = (item.images || []).filter(image => image.role === 'guide').map(image => {
    const markup = imageMarkup(image, item.name);
    return markup ? `<figure class="guide-resource" style="margin-top:24px">${markup}<figcaption>${h(image.caption || item.name)}</figcaption></figure>` : '';
  }).join('\n');
  const clips = (item.videos || []).length ? '<h3>Videos</h3>' + item.videos.map(clip => videoMarkup(clip, item.name)).join('\n') : '';
  const downloads = item.mergedResourceIds?.length ? '<div class="guide-links">' + (item.downloads || []).filter(file => file.distribution === 'include').map(file => downloadButton(file, item)).join('') + '</div>' : '';
  return anchors + guideSection('guide-' + item.id, item.name, downloads + guide + controls + gallery + guideImages + clips) + screenshotPanel;
}
function gameContent(items, prefix = '', categoryHeadings = {}) {
  const collections = Object.entries(categories).map(([id, title]) => {
    const matching = items.filter(item => item.category === id);
    return matching.length ? section(prefix + id, h(categoryHeadings[id] ?? title), grid(...matching.map(card))) : '';
  }).join('\n');
  return collections + items.map(details).join('\n');
}

return {categories, h, lines, localFile, localImage, httpsUrl, youtubeVideo, videoSource, hasDetails, imageMarkup, downloadButton, pluginDownloads, requirementsMarkup, card, guideBlock, videoMarkup, details, gameContent};
}
module.exports = {createResourceRenderer, categories};
