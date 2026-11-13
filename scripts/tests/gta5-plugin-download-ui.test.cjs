const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const decode=value=>value.replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&#39;',"'");
const page=()=>fs.readFileSync(path.join(root,'console/mods/ps4/gta5/index.html'),'utf8');

test('Each menu group has one Download button and a dropdown only when multiple files exist',()=>{
 const html=page(),widgets=[...html.matchAll(/<fieldset class="gta-plugin-download"[\s\S]*?<\/fieldset>/g)];
 assert.equal(widgets.length,21);
 assert.doesNotMatch(html,/data-plugin-bundle|data-plugin-configs|data-plugin-choices|Download menu \+ plugins\.ini|Download menu only|plugins\.ini only|Original menu files|gta5-plugin-downloads\.js/);
 for(const [widget] of widgets){
  assert.doesNotMatch(widget,/<button|<details|<summary|<noscript/);
  const links=[...widget.matchAll(/<a class="btn btn-primary" href="([^"]+)" download="([^"]+)" data-no-file-options data-menu-download[^>]*>[\s\S]*?<\/a>/g)];
  assert.equal(links.length,1);assert.ok(links[0][0].endsWith(' Download</a>'));
  const options=[...widget.matchAll(/<option value="([^"]+)"/g)];
  if(options.length){assert.ok(options.length>1);assert.equal(options[0][1],links[0][1]);const id=widget.match(/<select id="([^"]+)"/)[1];assert.ok(widget.includes('for="'+id+'"'));}
  for(const [,url] of [...links,...options])assert.ok(fs.existsSync(path.join(root,'.'+decode(url))),url);
 }
});

test('Every menu package and game-update variant stays available after removing bundling controls',()=>{
 const {forGame}=require('../build-ps4-ps5-game-imports.cjs').createGameImports();
 const plugin=require('../gta5-plugin-downloads.cjs').createPluginDownloads(),html=page();
 for(const item of forGame('gta5')){
  const rows=plugin.choices(item);if(!rows.length)continue;
  const card=html.match(new RegExp('<article class="guide-resource" id="resource-'+item.id+'"[^>]*>[\\s\\S]*?</article>'))[0];
  const sources=[...new Set(rows.map(row=>row.source.url))];
  const offered=[...card.matchAll(/(?:href|value)="([^"]+)"/g)].map(match=>decode(match[1]));
  for(const url of sources)assert.ok(offered.includes(url),url);
  assert.ok(card.includes(plugin.render(item)),'Generated download block matches '+item.id);
 }
});

test('Direct download links retain exact file URLs after Pages rewriting',()=>{
 const {rewriter,rawURL}=require('../build-pages.cjs'),revision='a'.repeat(40),html=page();
 const links=[...html.matchAll(/(?:href|value)="(\/downloads\/[^\"]+)"/g)];
 const offloaded=new Map(links.map(([,url])=>{const name=decode(url).slice(1);return [name,rawURL(name,revision)];}));
 const published=rewriter(offloaded)(html,'console/mods/ps4/gta5/index.html');
 assert.ok(offloaded.size>20);
 for(const url of offloaded.values())assert.ok(published.includes('="'+url+'"'),url);
 assert.doesNotMatch(published,/data-plugin-bundle|data-plugin-configs/);
});

test('Changing every dropdown option updates the one button to the exact published file and filename',()=>{
 const {rewriter,rawURL}=require('../build-pages.cjs'),html=page(),offloaded=new Map();
 for(const [,url] of html.matchAll(/(?:href|value)="(\/downloads\/[^\"]+)"/g)){const name=decode(url).slice(1);offloaded.set(name,rawURL(name,'a'.repeat(40)));}
 const published=rewriter(offloaded)(html,'console/mods/ps4/gta5/index.html');
 const groups=[...published.matchAll(/<fieldset class="gta-plugin-download"[\s\S]*?<\/fieldset>/g)].filter(([widget])=>widget.includes('data-menu-version')).map(([widget])=>{
  const options=[...widget.matchAll(/<option value="([^"]+)" data-filename="([^"]+)">([^<]+)<\/option>/g)].map(([,url,filename,label])=>({value:decode(url),dataset:{filename:decode(filename)},textContent:decode(label)}));
  const select={options,selectedIndex:0,disabled:true,addEventListener(type,handler){assert.equal(type,'change');this.change=handler;}};
  const link={attrs:{},setAttribute(name,value){this.attrs[name]=value;}};
  return {dataset:{menuName:decode(widget.match(/data-menu-name="([^"]+)"/)[1])},select,link,querySelector(selector){return selector==='[data-menu-version]'?select:link;}};
 });
 const doc={querySelectorAll(){return groups;}},api=require('../../assets/gta5-menu-downloads.js');
 assert.equal(groups.length,11);assert.equal(api.install(doc).length,11);
 for(const group of groups){assert.equal(group.select.disabled,false);for(let i=0;i<group.select.options.length;i++){group.select.selectedIndex=i;group.select.change();const option=group.select.options[i];assert.equal(group.link.attrs.href,option.value);assert.equal(group.link.attrs.download,option.dataset.filename);assert.equal(group.link.attrs['aria-label'],'Download '+group.dataset.menuName+' · '+option.textContent);assert.match(group.link.attrs.href,/^https:\/\/raw\.githubusercontent\.com\/Speedy-away\/whatsite\/[a-f0-9]{40}\/downloads\//);}}
 assert.equal(api.install(doc).length,0);
});
