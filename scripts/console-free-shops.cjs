// Shared Free Shops pages and navigation. Source compatibility stays explicit.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const artwork='/assets/images/free-shops/free-shops-20261104.jpg';
const gameArtwork='/assets/images/free-shops/game-downloads-20261104.jpg';
const sources={infinity:'https://drive.google.com/file/d/1UnS-7mR9QSObVWgHRXkjfGrWixJQ4-NW/view',nova:'https://drive.google.com/file/d/1gZoNjmH6uOvQ4uvbfzeah27EWWTGVIaf/view',website:'https://infinitydev.shop/Orbis-Helper/'};
const ext=(url,label)=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${label} <i class="fas fa-external-link-alt" aria-hidden="true"></i></a>`;
const jobeesLair={
 ps4:{repo:'JobeesLair-PS4',tag:'v0.1.5',version:'0.1.5 Beta 5',asset:'JobeesLair-PS4-0.1.5-Beta-5.pkg',format:'PKG',
  description:'Store and download manager for a PS4 running GoldHEN. The publisher tested firmware 11.00. Install the PKG with GoldHEN’s Package Installer or Itemzflow.'},
 ps5:{repo:'JobeesLair',tag:'v0.5.6',version:'0.5.6',asset:'JobeesLair.exfat',format:'exFAT image',
  description:'Homebrew browser and download manager for a jailbroken PS5 running ShadowMount+. Copy JobeesLair.exfat to the homebrew folder on an exFAT USB drive or to /data/homebrew over FTP.'}
};
function cards(platform='all'){
 const g=require('./build-console-guides.cjs');
 const infinity=g.resource('Infinitykkj STORE · v0.0.11 Beta','PS4 store. The supplied ZIP is v0.0.11 Beta. The publisher’s guide lists GoldHEN / jailbreak through firmware 13.52 and requires an active free account; PS5 support is not confirmed.',ext(sources.infinity,'Download v0.0.11 Beta (Google Drive)')+ext(sources.website,'Store website')+ext(sources.website+'tutorial.php','Installation guide'),'/assets/images/free-shops/infinitykkj-logo.png').replace('<article ','<article id="infinitykkj-store" ');
 const nova=g.resource('Nova Store','User-supplied store ZIP. Its release version, firmware requirements and PS4 / PS5 compatibility have not been confirmed by a publisher source.',ext(sources.nova,'Download Nova Store (Google Drive)'),gameArtwork).replace('<article ','<article id="nova-store" ');
 const orbit=require('./console-game-directories.cjs').orbitStoreCard().replace('PS5 download manager and store interface.','PS5 only · download manager and store interface.');
 const jobees=Object.entries(jobeesLair).filter(([id])=>platform==='all'||platform===id).map(([id,release])=>{
  const repo=`https://github.com/JVK3R/${release.repo}/releases`;
  const label=id.toUpperCase();
  const download=`<a class="btn btn-primary" href="${repo}/download/${release.tag}/${release.asset}"><i class="fas fa-download" aria-hidden="true"></i> Download ${label} ${release.format}</a>`;
  return g.resource(`JobeesLair · ${label} · ${release.version}`,release.description,download+ext(`${repo}/tag/${release.tag}`,'Release notes'),artwork)
   .replace('<article ',`<article id="jobeeslair-${id}" `);
 });
 return [infinity,nova,orbit,...jobees];
}
function storeSection(platform){return require('./build-console-guides.cjs').section('free-shops','Free shops',require('./build-console-guides.cjs').grid(...cards(platform)),'Infinitykkj STORE, Nova Store, Orbit and JobeesLair. Check the platform and setup requirements on each entry.');}
function hubCard(platform){return `<article class="guide-resource" data-free-shops-card="${platform}"><img src="${artwork}" alt="Free shops with PlayStation game covers and shopping bag artwork" width="960" height="540" loading="lazy"><h3>Free shops</h3><p>Infinitykkj STORE, Nova Store and Orbit downloads, with console compatibility and setup links.</p><div class="guide-links"><a href="/console/${platform}/free-shops.html">Browse free shops <i class="fas fa-arrow-right" aria-hidden="true"></i></a></div></article>`;}
function apply(file,html){
 file=file.replaceAll('\\','/').replace(/^\//,'');
 if(require('./console-game-directories.cjs').protectedFile(file,html))return html;
 if(['console/game-downloads/index.html','games-downloads/index.html'].includes(file)){
  return html.replace(/<section\b[^>]*\bid="free-shops-directory"[^>]*>[\s\S]*?<\/section>/g,'');
 }
 const platform=file.match(/^console\/(ps[45])\//)?.[1];
 if(!platform)return html;
 const destination=`/console/${platform}/free-shops.html`;
 html=html.replace(/<nav\b(?=[^>]*class="[^"]*\bguide-nav\b)[^>]*>[\s\S]*?<\/nav>/g,nav=>{
  if(file==='console/ps4/jailbreaks.html') {
   // Game downloads already leads to the PS4 page that lists the shops.
   return nav.replace(/<a\b[^>]*\bdata-free-shops-(?:index-)?nav(?=\s|=|>)[^>]*>[\s\S]*?<\/a>/g,'');
  }
  if(nav.includes(`href="${destination}"`))return nav;
  return nav.replace('</nav>',`<a data-free-shops-nav href="${destination}">Free shops</a><a data-free-shops-index-nav href="/console/free-shops/">All free shops</a></nav>`);
 });
 if(file===`console/${platform}/index.html`){
  html=html.replace(/<article\b[^>]*\bdata-free-shops-card="[^"]*"[^>]*>[\s\S]*?<\/article>/g,'');
  html=html.replace(/<article\b[^>]*\bdata-console-game-card="[^"]*"[^>]*>[\s\S]*?<\/article>/,card=>card+hubCard(platform));
 }
 if(file===`console/${platform}/game-downloads.html`){
  // The store section owns Orbit here, preventing a duplicate card.
  html=html.replace(/<article\b[^>]*\bid="orbit-store"[^>]*>[\s\S]*?<\/article>/g,'');
  const directories=/<section\b[^>]*\bid="game-directories"[^>]*>[\s\S]*?<\/section>/;
  if(directories.test(html)){
   html=html.replace(/<section\b[^>]*\bid="free-shops"[^>]*>[\s\S]*?<\/section>/g,'');
   html=html.replace(directories,section=>section+storeSection(platform));
  }
 }
 return html;
}
function build(){
 const g=require('./build-console-guides.cjs');
 const pages=[];
 for(const platform of ['ps4','ps5','all']){
  const all=platform==='all',file=all?'console/free-shops/index.html':`console/${platform}/free-shops.html`,title=all?'Free Shops':`${platform.toUpperCase()} Free Shops`;
  const nav=[['/console/free-shops/','All free shops'],['/console/ps4/free-shops.html','PS4 free shops'],['/console/ps5/free-shops.html','PS5 free shops'],['/console/ps4/game-downloads.html','PS4 game downloads'],['/console/ps5/game-downloads.html','PS5 game downloads']];
  const intro=g.section('compatibility','Choose the right store','<p>Infinitykkj’s publisher documents PS4 installation. Orbit is a PS5 application. Nova Store’s platform and firmware requirements remain unconfirmed. Listings here do not establish cross-console support.</p><p>The supplied Google Drive files currently report a download quota limit. Their original links remain available for retrying later.</p>');
  g.page(file,title,'Browse Infinitykkj STORE, Nova Store, Orbit and JobeesLair downloads with platform requirements and installation links.',artwork,nav,storeSection(platform)+intro,'#free-shops','Browse free shops');
  const target=path.join(root,file);
  fs.writeFileSync(target,fs.readFileSync(target,'utf8').replace('<a class="btn btn-outline" href="/pc/">PC</a>','<a class="btn btn-outline" href="/console/">Console hub</a>'));
  pages.push(file);
 }
 let sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
 for(const file of pages){const url='https://whatwhatboy.com/'+file.replace(/index\.html$/,'');if(!sitemap.includes('<loc>'+url+'</loc>'))sitemap=sitemap.replace('</urlset>',`  <url><loc>${url}</loc><lastmod>2026-11-04</lastmod></url>\n</urlset>`);}
 fs.writeFileSync(path.join(root,'sitemap.xml'),sitemap);
 return pages;
}
module.exports={apply,build,cards,sources,artwork,gameArtwork};
if(require.main===module)console.log(JSON.stringify(build()));
