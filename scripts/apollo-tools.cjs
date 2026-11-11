const image='/assets/images/consoles/apollo-save-tool.png';
const tools={
 ps4:{name:'PS4',repo:'apollo-ps4',description:'Manage, export, import, patch and resign PS4 saves directly on your homebrew-enabled console.'},
 ps3:{name:'PS3',repo:'apollo-ps3',description:'Back up, manage, patch and resign PS3 saves, with trophy and virtual-memory-card tools.'},
 vita:{name:'PS Vita',repo:'apollo-vita',description:'Manage PS Vita, PSP/Adrenaline and PS1 saves, with import, export, patches and resigning tools.'}
};
function guideLink(platform){
 if(!['ps3','ps4','vita'].includes(platform))return '';
 const route = platform === 'vita' ? 'psvita' : platform;
 return '<a href="/console/'+route+'/apollo-guide.html">Read illustrated guide <i class="fas fa-book-open" aria-hidden="true"></i></a>';
}
function withGuide(html,platform){
 const guide=guideLink(platform);if(!guide||html.includes(guide))return html;
 const title=html.indexOf('<h3>Apollo Save Tool');if(title<0)throw Error('Apollo card missing');
 const at=html.indexOf('<div class="guide-links">',title);if(at<0)throw Error('Apollo card links missing');
 return html.slice(0,at)+'<div class="guide-links">'+guide+html.slice(at+'<div class="guide-links">'.length);
}
function section(platform){
 const tool=tools[platform];if(!tool)throw Error('Unknown Apollo platform');
 const repo='https://github.com/bucanero/'+tool.repo;
 return `<!-- BEGIN APOLLO ${platform.toUpperCase()} -->
<section class="section" id="save-tools"><div class="container"><div class="section-header"><h2 class="section-title">Save tools</h2></div><div class="games-grid"><article class="guide-resource" data-search="apollo save tool ${tool.name.toLowerCase()} backup restore patch resign"><img src="${image}" alt="Apollo Save Tool interface" loading="lazy"><h3>Apollo Save Tool · ${tool.name}</h3><p>${tool.description}</p><div class="guide-links">${guideLink(platform)}<a href="${repo}/releases" class="btn btn-primary" target="_blank" rel="noopener noreferrer"><i class="fas fa-download" aria-hidden="true"></i> Download for ${tool.name}</a><a href="${repo}" target="_blank" rel="noopener noreferrer">Project <i class="fas fa-external-link-alt" aria-hidden="true"></i></a></div></article></div></div></section>
<!-- END APOLLO ${platform.toUpperCase()} -->`;
}
function writeWithSiteShell(file, html) {
 const fs = require('node:fs');
 const path = require('node:path');
 const {root} = require('./site-public-pages.cjs');
 const target = path.join(root, file);
 const applyShell = require('./site-shell.cjs').create(root);
 const output = applyShell(file, html ?? fs.readFileSync(target, 'utf8'), {materialize: true});
 fs.writeFileSync(target, output.replace(/^[ \t]+(?=\r?$)/gm, ''));
}
module.exports={tools,image,section,guideLink,withGuide,writeWithSiteShell};
