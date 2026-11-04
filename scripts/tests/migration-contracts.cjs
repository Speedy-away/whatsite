'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
function hostRedirect(file){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 const target=require('../host-webhost-navigation.cjs').hostDestination('/'+file.replace(/index\.html$/,''));
 assert.ok(html.includes('href="'+target+'"'),file+' canonical destination');
 assert.ok(html.includes('content="0;url='+target+'"'),file+' refresh destination');
 assert.ok(html.includes('location.replace("'+target+'"+location.search+location.hash)'),file+' preserves query and fragment');
 assert.doesNotMatch(html,/id="host-actions-data"|src="[^\"]*runtime\//,file+' stays a redirect');
 return html;
}
// Test retained authored components in memory; never regenerate migrated pages.
function hostMarkup(file){
 hostRedirect(file);
 const platform=file.split('/')[1],actions=require('../build-host-selector.cjs').hostActions(platform);
 const {dashboard,workspaceDashboard}=require('../host-dashboard-markup.cjs');
 if(file.includes('/payload-manager/'))return workspaceDashboard(platform,actions,'payloads');
 const scope=file.match(/\/(gta5|rdr2|other-games)\//)?.[1];
 const markup=dashboard(platform,actions,scope?{gameScope:scope}:{gamesLanding:true});
 const document='<html><head><link rel="canonical" href="https://whatwhatboy.com/'+file+'"></head><body class="host-dashboard-page"><main class="main-content">'+markup+'</main></body></html>';
 return scope?require('../host-page-shell.cjs').apply(file,document):require('../host-folder-markup.cjs').shell(document);
}
function deliveryEntry(local){return require('../../docs/download-source-links.json').entries.find(e=>e.local===local);}
function visibleDownload(html,file){
 if(html.includes(file.local))return;
 const entry=deliveryEntry(file.local);assert.ok(entry,file.local+' has an approved publisher mapping');
 assert.equal(entry.bytes,file.bytes);assert.equal(entry.sha256,file.sha256);
 assert.ok(html.includes(entry.url.replaceAll('&','&amp;'))||html.includes(entry.url),file.local+' publisher download stays visible');
}
function downloadExists(url){
 const parsed=new URL(url,'https://whatwhatboy.com');
 if(parsed.origin!=='https://whatwhatboy.com'){
  const entry=require('../../docs/download-source-links.json').entries.find(e=>e.url===url);
  assert.ok(entry,'External download has verified delivery mapping: '+url);
  const bytes=fs.readFileSync(path.join(root,entry.local));
  assert.equal(bytes.length,entry.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);
  return true;
 }
 let name=decodeURIComponent(parsed.pathname);if(name.endsWith('/'))name+='index.html';
 return fs.existsSync(path.join(root,name));
}
module.exports={hostRedirect,hostMarkup,visibleDownload,downloadExists};
