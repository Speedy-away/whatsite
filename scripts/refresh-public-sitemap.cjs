// Reconcile against real, canonical, indexable pages. Runtime/download HTML is excluded.
const fs=require('node:fs'),path=require('node:path'),scope=require('./site-public-pages.cjs');
const {execFileSync}=require('node:child_process');
function pageDates(date){
 const git=args=>execFileSync('git',['-c','core.safecrlf=false','-c','core.quotepath=false',...args],{cwd:scope.root,encoding:'utf8',maxBuffer:64*1024*1024,stdio:['ignore','pipe','pipe']});
 const dates=new Map();let current;
 for(const line of git(['log','--format=@@%cs','--name-only','--','*.html']).split(/\r?\n/)){
  if(line.startsWith('@@'))current=line.slice(2);else if(line&&!dates.has(line))dates.set(line,current);
 }
 // A cache revision alone does not change the page content described by lastmod.
 const {apply:normalizeLoader}=require('./language-loader.cjs');
 for(const patch of git(['diff','--no-color','--unified=0','HEAD','--','*.html']).split(/^diff --git /m)){
  const file=patch.match(/^\+\+\+ b\/(.+)$/m)?.[1].trimEnd();
  if(!file)continue;
  const hunks=patch.split(/^@@ .*@@.*$/m).slice(1);
  const changed=hunks.some(hunk=>{
   const lines=hunk.split(/\r?\n/);
   const content=marker=>normalizeLoader(lines.filter(line=>line.startsWith(marker)).map(line=>line.slice(1)).join('\n'));
   return content('-')!==content('+');
  });
  if(changed)dates.set(file,date);
 }
 return dates;
}
function refresh(write=false,{date=new Date().toISOString().slice(0,10),pageScope=scope,dates=pageDates(date)}={}){
 const scope=pageScope;
 const target=path.join(scope.root,'sitemap.xml'),before=fs.readFileSync(target,'utf8');
 const old=[...before.matchAll(/<url>\s*([\s\S]*?)<\/url>/g)].map(m=>({xml:m[0],url:m[1].match(/<loc>([^<]+)<\/loc>/)?.[1]}));
 const expected=new Set(),externalCanonicals=[],lastmods=new Map();
 for(const file of scope.pages()){const html=fs.readFileSync(file,'utf8');if(/http-equiv=["']refresh["']/i.test(html)||/<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*\bnoindex\b/i.test(html))continue;
  const url=html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];if(!url)throw Error('Missing canonical: '+file);
  const parsed=new URL(url);if(parsed.search||parsed.hash)throw Error('Invalid canonical: '+file);
  if(parsed.origin!=='https://whatwhatboy.com'){externalCanonicals.push({page:scope.relativePath(file),canonical:url});continue;}expected.add(url);
  const modified=dates.get(scope.relativePath(file))||date;
  if(!lastmods.has(url)||modified>lastmods.get(url))lastmods.set(url,modified);
 }
 const added=[...expected].filter(url=>!old.some(x=>x.url===url));const removed=old.filter(x=>!expected.has(x.url)).map(x=>x.url);const seen=new Set();let duplicates=0;
 let updatedDates=0;
 const rows=[];for(const entry of old){if(!expected.has(entry.url))continue;if(seen.has(entry.url)){duplicates++;continue;}seen.add(entry.url);
  const tag='<lastmod>'+lastmods.get(entry.url)+'</lastmod>';
  const xml=/<lastmod>[^<]*<\/lastmod>/.test(entry.xml)?entry.xml.replace(/<lastmod>[^<]*<\/lastmod>/,tag):entry.xml.replace('</loc>','</loc>'+tag);
  if(xml!==entry.xml)updatedDates++;rows.push(xml);
 }
 for(const url of added)rows.push('<url><loc>'+url+'</loc><lastmod>'+lastmods.get(url)+'</lastmod></url>');
 const first=before.indexOf('<url>'),headerEnd=first<0?before.indexOf('</urlset>'):first;
 if(headerEnd<0)throw Error('Sitemap urlset missing');
 const after=before.slice(0,headerEnd).trimEnd()+'\n'+rows.map(x=>'  '+x).join('\n')+'\n</urlset>\n';
 if(write&&after!==before){if(fs.readFileSync(target,'utf8')!==before)throw Error('Concurrent sitemap edit');fs.writeFileSync(target,after);}
 const report={mode:write?'write':'check',canonicalURLs:expected.size,previousEntries:old.length,added,removed,externalCanonicals,updatedDates,duplicatesRemoved:duplicates,changed:after!==before};
 if(write)fs.writeFileSync(path.join(scope.root,'docs/qa/all-pages-sitemap-refresh.json'),JSON.stringify(report,null,2)+'\n');return report;
}
if(require.main===module){const write=process.argv.includes('--write'),report=refresh(write);console.log(JSON.stringify(report,null,2));if(!write&&report.changed)process.exitCode=1;}
module.exports={refresh};
