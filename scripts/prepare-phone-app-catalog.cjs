'use strict';
// Public store metadata only; no accounts, purchases or app execution.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const seeds=[
 ['firefox','Firefox','Web browser','989804926','org.mozilla.firefox'],
 ['brave','Brave','Web browser','1052879175','com.brave.browser'],
 ['duckduckgo','DuckDuckGo','Web browser','663592361','com.duckduckgo.mobile.android'],
 ['signal','Signal','Private messaging','874139669','org.thoughtcrime.securesms'],
 ['telegram','Telegram','Messaging and channels','686449807','org.telegram.messenger'],
 ['bitwarden','Bitwarden','Password manager','1137397744','com.x8bit.bitwarden'],
 ['proton-mail','Proton Mail','Email','979659905','ch.protonmail.android'],
 ['proton-vpn','Proton VPN','VPN client','1437005085','ch.protonvpn.android'],
 ['localsend','LocalSend','Local file transfers','1661733229','org.localsend.localsend_app'],
 ['kde-connect','KDE Connect','Phone and desktop integration','1580245991','org.kde.kdeconnect_tp'],
 ['organic-maps','Organic Maps','Offline maps','1567437057','app.organicmaps'],
 ['joplin','Joplin','Notes and to-do lists','1315599797','net.cozic.joplin']
];
function curl(url,file){return new Promise((resolve,reject)=>{const p=spawn('curl.exe',['-L','--fail','--silent','--show-error','--max-time','35',url,'-o',file]);let error='';p.stderr.on('data',b=>error+=b);p.on('error',reject);p.on('close',c=>c?reject(Error(error.trim())):resolve());});}
async function main(){
 const dir=path.join(root,'tmp/phone-stores');fs.mkdirSync(dir,{recursive:true});
 const appleURL='https://itunes.apple.com/lookup?country=gb&id='+seeds.map(s=>s[3]).join(',');await curl(appleURL,path.join(dir,'apple.json'));
 const apple=JSON.parse(fs.readFileSync(path.join(dir,'apple.json'))).results,apps=[],failures=[];let cursor=0;
 async function worker(){while(cursor<seeds.length){const [id,name,description,appleId,androidId]=seeds[cursor++];
  const row=apple.find(a=>String(a.trackId)===appleId);if(row)apps.push({id:'ios-'+id,name,platform:'ios',description,url:row.trackViewUrl,source:appleURL,store:'App Store',publisher:row.sellerName,storeTitle:row.trackName,minimumOS:row.minimumOsVersion,checkedAt:new Date().toISOString()});else failures.push({id:'ios-'+id,error:'Not found in GB App Store lookup'});
  try{const url='https://play.google.com/store/apps/details?id='+androidId+'&hl=en&gl=GB',file=path.join(dir,id+'.html');await curl(url,file);const html=fs.readFileSync(file,'utf8'),title=html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];if(!title||!title.includes('Google Play')||!html.includes(androidId))throw Error('App identity missing from store response');apps.push({id:'android-'+id,name,platform:'android',description,url,source:url,store:'Google Play',package:androidId,storeTitle:title,checkedAt:new Date().toISOString()});}catch(e){failures.push({id:'android-'+id,error:e.message});}
 }}
 await Promise.all([worker(),worker(),worker()]);
 const output=path.join(root,'docs/phone-app-catalog.json');
 const previous=fs.existsSync(output)?JSON.parse(fs.readFileSync(output)).apps:[];
 const merged=new Map(previous.map(app=>[app.id,app]));for(const app of apps)merged.set(app.id,app);
 const result={checkedAt:new Date().toISOString(),apps:[...merged.values()].sort((a,b)=>a.id.localeCompare(b.id)),failures};fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({ios:apps.filter(a=>a.platform==='ios').length,android:apps.filter(a=>a.platform==='android').length,failures}));
}
module.exports={seeds};if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
