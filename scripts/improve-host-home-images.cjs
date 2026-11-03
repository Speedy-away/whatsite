'use strict';
// Improve the migrated home page only. Existing console photos, native hosts,
// download identities and other concurrent migration work are preserved.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root='C:/Users/whatw/Documents/GitHub/WWB-HOST',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const section=`<section class="tool-section" aria-labelledby="tools-title"><h2 id="tools-title">Tools &amp; downloads</h2>
      <div class="tool-gallery">
        <a class="home-tool" href="./hosts/tools/ps4-trainer/"><figure class="tool-art trainer-mosaic"><img src="./assets/images/game-patches/bloodborne-official.jpg" alt="" width="640" height="360" loading="lazy"><img src="./assets/images/game-patches/red-dead-redemption-2-official.jpg" alt="" width="640" height="360" loading="lazy"><img src="./assets/images/game-patches/the-last-of-us-remastered-official.jpg" alt="" width="640" height="360" loading="lazy"></figure><div class="home-tool-copy"><h3>PS4 Offline Trainer <span aria-hidden="true">↗</span></h3><p>Browse games, select the exact update and open its trainer controls.</p><span class="tool-action">Browse trainer games</span></div></a>
        <article class="home-tool"><figure class="tool-art"><img src="./assets/images/expansion-ps4-ps5/payload-manager.png" alt="PS5 Payload Manager interface" width="1280" height="720" loading="lazy" decoding="async"></figure><div class="home-tool-copy"><h3>Payload management</h3><p>Open your console’s payload workspace and autoload controls.</p><nav class="tool-console-links" aria-label="Payload managers"><a href="./hosts/ps4/payload-manager/">PS4 <span aria-hidden="true">↗</span></a><a href="./hosts/ps5/payload-manager/">PS5 <span aria-hidden="true">↗</span></a></nav></div></article>
        <article class="home-tool"><figure class="tool-art"><img src="./assets/images/expansion-ps4-ps5/ps5-ezremote.jpg" alt="ezRemote file manager interface" width="1920" height="1080" loading="lazy" decoding="async"></figure><div class="home-tool-copy"><h3>Files &amp; storage</h3><p>Connect to the native file workspace on your console.</p><nav class="tool-console-links" aria-label="Console file managers"><a href="./hosts/ps4/files/">PS4 <span aria-hidden="true">↗</span></a><a href="./hosts/ps5/files/">PS5 <span aria-hidden="true">↗</span></a></nav></div></article>
        <article class="home-tool"><figure class="tool-art tool-art--diagram"><img src="./assets/images/host-catalog/loaders.svg" alt="" width="640" height="400" loading="lazy"></figure><div class="home-tool-copy"><h3>Firmware &amp; loaders</h3><p>Choose your installed firmware to find a matching route.</p><nav class="tool-console-links" aria-label="Firmware selection"><a href="./hosts/ps4/firmware/">PS4 <span aria-hidden="true">↗</span></a><a href="./hosts/ps5/?view=loaders">PS5 <span aria-hidden="true">↗</span></a></nav></div></article>
      </div>
      <nav class="utility-links home-secondary-links" aria-label="More host tools"><a href="./downloads/helpers/console-payload-sender/">Desktop sender <span aria-hidden="true">↗</span></a><a href="./hosts/karo/versions.html">Retained build versions <span aria-hidden="true">↗</span></a></nav>
    </section>`;
const styles=`
/* BEGIN HOME TOOL IMAGES */
.tool-gallery{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}
.home-tool{display:flex;flex-direction:column;min-width:0;margin:0;border:1px solid var(--line);background:var(--panel);text-decoration:none;transition:border-color .18s ease,background .18s ease}
a.home-tool:hover,.home-tool:focus-within{border-color:#7a9e87;background:#19271e}
.tool-art{margin:0;aspect-ratio:16/10;overflow:hidden;background:#0d1511;flex:none}
.tool-art>img{display:block;width:100%;height:100%;object-fit:cover}
.trainer-mosaic{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:2px}
.trainer-mosaic>img{object-fit:cover}
.tool-art--diagram>img{object-fit:contain}
.home-tool-copy{display:flex;flex-direction:column;padding:18px;flex:1}
.home-tool h3{display:flex;align-items:start;justify-content:space-between;gap:8px;font-size:1rem;font-weight:550;line-height:1.35;letter-spacing:-.015em;margin:0}
.home-tool h3>span{color:var(--accent)}
.home-tool p{font-size:.78rem;line-height:1.65;color:var(--muted);margin:10px 0 16px}
.tool-action{margin-top:auto;color:var(--accent);font-size:.76rem;line-height:1.5}
.tool-console-links{display:flex;gap:8px;margin-top:auto}
.tool-console-links a{display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:42px;padding:8px 12px;border:1px solid var(--line);font-size:.75rem;text-decoration:none;flex:1;color:var(--accent)}
.tool-console-links a:hover{background:#23382a;border-color:#7a9e87}
.home-secondary-links{grid-template-columns:1fr 1fr;margin-top:24px}
@media(max-width:950px){.tool-gallery{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}}
@media(max-width:640px){.tool-gallery{gap:14px}.home-tool-copy{padding:14px}.home-tool h3{font-size:.92rem}.home-tool p{font-size:.75rem}.tool-console-links{gap:6px}.tool-console-links a{padding:7px 9px;gap:8px}.home-secondary-links{gap:24px}}
@media(max-width:380px){.tool-gallery{grid-template-columns:1fr}.home-secondary-links{grid-template-columns:1fr}}
/* END HOME TOOL IMAGES */
`;
function main(){
 const file=path.join(root,'index.html'),cssFile=path.join(root,'assets/host-home.css'),before=fs.readFileSync(file,'utf8'),beforeCSS=fs.readFileSync(cssFile,'utf8');
 if(!before.includes('class="console-visual"')||!before.includes('class="tool-section"'))throw Error('The shared home page changed; review before modifying it.');
 const html=before.replace(/<section class="tool-section"[\s\S]*?<\/section>/,section).replace(/\.\/assets\/host-home\.css(?:\?v=\d+)?/, './assets/host-home.css?v=2');
 const css=beforeCSS.replace(/\n?\/\* BEGIN HOME TOOL IMAGES \*\/[\s\S]*?\/\* END HOME TOOL IMAGES \*\//,'')+styles;
 for(const [name,bytes]of [['index.html',before],['assets/host-home.css',beforeCSS]]){const target=path.join(root,'tmp/home-image-before',name+'.'+sha(bytes).slice(0,16));fs.mkdirSync(path.dirname(target),{recursive:true});if(!fs.existsSync(target))fs.writeFileSync(target,bytes,{flag:'wx'});}
 for(const m of html.matchAll(/(?:href|src)="(\.\/[^"#?]+)(?:[?#][^"]*)?"/g)){let target=path.join(root,m[1]);if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');if(!fs.existsSync(target))throw Error('Missing homepage target: '+m[1]);}
 fs.writeFileSync(file,html);fs.writeFileSync(cssFile,css);
 const report={updatedAt:new Date().toISOString(),scope:'WWB HOST root homepage only',consolePhotosPreserved:2,newIllustratedTools:4,images:(html.match(/<img\b/g)||[]).length,allLocalImageAndPageReferencesExist:true,newRemoteDownloads:0,downloadFilesChanged:0,nativeFilesChanged:0,files:[{name:'index.html',sha256:sha(html)},{name:'assets/host-home.css',sha256:sha(css)}],browserQA:'Not performed; local browser use disabled in Work settings.',published:false};
 fs.writeFileSync(path.join(root,'docs/home-image-polish.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}
if(require.main===module)main();module.exports={main};
