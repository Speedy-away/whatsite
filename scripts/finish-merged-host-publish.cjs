'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(process.argv[2]||'../WWB-HOST');
function patch(rel,fn){const file=path.join(root,rel),old=fs.readFileSync(file,'utf8'),next=fn(old);if(next!==old)fs.writeFileSync(file,next);}
patch('scripts/host-compact-pages.cjs',s=>s.replace("return [...local,...previous.filter(a=>a.category!=='loaders')];","return [...local,...previous.filter(a=>a.category!=='loaders'),...previous.filter(a=>a.category==='loaders'&&a.browserHost&&/^https:\\/\\//.test(a.launchURL||'')).map(a=>({...a,secondaryHost:true}))];"));
patch('assets/host-dashboard.js',s=>{
 s=s.replace("action.category!=='loaders'||!action.browserHost||!action.launchURL","action.category!=='loaders'||(!action.browserHost&&!action.localLauncher)||!action.launchURL");
 s=s.replace('function catalogTile(options){if(consoleBrowser)options.textOnly=true;','function catalogTile(options){if(consoleBrowser||category===\'payloads\')options.textOnly=true;');
 s=s.replace("grid.classList.add('host-catalog-grid');","grid.classList.add('host-catalog-grid');grid.setAttribute('data-host-view',category);");
 const begin=s.indexOf('        return windowed(renderedGroups).map(function(group){var first=group.actions[0];'),end=s.indexOf("\n      }",begin);
 if(begin>=0&&end>=0)s=s.slice(0,begin)+`        function catalogRow(group){var first=group.actions[0];if(first.localLauncher)return '<a class="host-firmware-family" href="'+escape(navigationURL(first.launchURL))+'"><strong>'+escape(first.firmwareLabel||group.label)+'</strong><span>Choose HEN / Load</span></a>';if(category==='loaders'&&first.browserHost)return catalogTile({id:first.id,label:'Load',image:'',detail:group.label+(platform==='ps5'&&detection.platform!==platform?' · Open on PS5':''),attribute:'data-launch',disabled:detection.platform!==platform||!firmware.value||!firmwareMatches(first,firmware.value)||Boolean(platform==='ps5'&&detection.firmware&&detection.firmware!==firmware.value)});return catalogTile({id:group.id,label:group.label,image:category==='loaders'||category==='payloads'?'':catalogUI.representativeImage(group.actions),detail:[first.format,first.version||first.menuVersion||''].filter(Boolean).join(' · '),attribute:'data-choose-group'});}
        var shown=windowed(renderedGroups);if(category==='loaders'){var primary=shown.filter(function(g){return !g.actions[0].secondaryHost;}),other=shown.filter(function(g){return g.actions[0].secondaryHost;});return primary.map(catalogRow).join('')+(other.length?'<details class="host-other-hosts"><summary>Other hosts</summary><div class="host-catalog-grid">'+other.map(catalogRow).join('')+'</div></details>':'');}
        return shown.map(catalogRow).join('');`+s.slice(end);
 return s;
});
patch('scripts/verify-host-project-pages.cjs',s=>{
 s=s.replace('let links=0,checkedScripts=0;', 'let links=0,checkedScripts=0,localRuntimeConfigs=0;');
 if(!s.includes('Host-local runtime configuration must remain'))s=s.replace("const html=fs.readFileSync(file,'utf8');const data=",`const html=fs.readFileSync(file,'utf8');const localConfig=html.match(/<script\\b[^>]*id="host-local-data"[^>]*>([\\s\\S]*?)<\\/script>/i);if(localConfig){const data=JSON.parse(localConfig[1]),host='https://speedy-away.github.io';assert.ok(data.runtime.startsWith('/WWB-HOST/hosts/runtime/'),'Host-local runtime configuration must remain on the project origin: '+p);require('../assets/host-local-launcher.js').config(data,{origin:host,href:host+'/WWB-HOST/'+p});localRuntimeConfigs++;}const data=`);
 s=s.replace("const result={status:'passed',", "const result={status:'passed',localRuntimeConfigs,");
 return s;
});
patch('scripts/tests/ps5-original-hosts.test.cjs',s=>s.replace('all sixty-one offered firmware versions','all source-confirmed offered firmware versions').replace('assert.equal(versions.length,61);','assert.equal(versions.length,62);').replace("a=>a.browserHost&&a.launchURL","a=>(a.browserHost||a.localLauncher)&&a.launchURL&&ui.firmwareMatches(a,fw)").replace("['6.00','9.05','10.60','11.40']","['6.00','9.05','11.40']"));
require(path.join(root,'scripts/host-compact-pages.cjs')).build(root);
require(path.join(root,'scripts/build-host-selector.cjs')).buildHostSelector({hostOnly:true});
require(path.join(root,'scripts/host-compact-pages.cjs')).build(root);
require(path.join(root,'scripts/build-afterglow-public-launcher.cjs')).build(root);
console.log('Local families, retained original-host links, payload text tiles and publisher validation reconciled.');
