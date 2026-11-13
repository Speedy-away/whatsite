const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const decode=value=>value.replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&#39;',"'");
const page=()=>fs.readFileSync(path.join(root,'console/mods/ps4/gta5/index.html'),'utf8');

test('All menu groups use normal download links with no combined or config-only controls',()=>{
 const html=page(),widgets=[...html.matchAll(/<fieldset class="gta-plugin-download"[\s\S]*?<\/fieldset>/g)];
 assert.equal(widgets.length,21);
 assert.doesNotMatch(html,/data-plugin-bundle|data-plugin-configs|data-plugin-choices|Download menu \+ plugins\.ini|Download menu only|plugins\.ini only|Original menu files|gta5-plugin-downloads\.js/);
 for(const [widget] of widgets){
  assert.doesNotMatch(widget,/<button|<details|<summary|<noscript/);
  const links=[...widget.matchAll(/<a class="btn btn-primary" href="([^"]+)" download data-no-file-options>[\s\S]*?<\/a>/g)];
  assert.ok(links.length>0);assert.ok(links.every(([link])=>link.includes('Download')));
  for(const [,url] of links)assert.ok(fs.existsSync(path.join(root,'.'+decode(url))),url);
 }
});

test('Every menu package and game-update variant stays available after removing bundling controls',()=>{
 const {forGame}=require('../build-ps4-ps5-game-imports.cjs').createGameImports();
 const plugin=require('../gta5-plugin-downloads.cjs').createPluginDownloads(),html=page();
 for(const item of forGame('gta5')){
  const rows=plugin.choices(item);if(!rows.length)continue;
  const card=html.match(new RegExp('<article class="guide-resource" id="resource-'+item.id+'"[^>]*>[\\s\\S]*?</article>'))[0];
  const sources=[...new Set(rows.map(row=>row.source.url))];
  for(const url of sources)assert.equal((card.match(/href="([^"]+)"/g)||[]).filter(link=>decode(link)==='href="'+url+'"').length,1,url);
  assert.ok(card.includes(plugin.render(item)),'Generated download block matches '+item.id);
 }
});

test('Direct download links retain exact file URLs after Pages rewriting',()=>{
 const {rewriter,rawURL}=require('../build-pages.cjs'),revision='a'.repeat(40),html=page();
 const links=[...html.matchAll(/<a class="btn btn-primary" href="(\/downloads\/[^\"]+)" download data-no-file-options>/g)];
 const offloaded=new Map(links.map(([,url])=>{const name=decode(url).slice(1);return [name,rawURL(name,revision)];}));
 const published=rewriter(offloaded)(html,'console/mods/ps4/gta5/index.html');
 assert.ok(offloaded.size>20);
 for(const url of offloaded.values())assert.ok(published.includes('href="'+url+'" download data-no-file-options>'),url);
 assert.doesNotMatch(published,/data-plugin-bundle|data-plugin-configs/);
});
