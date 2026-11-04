const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const {refresh}=require('../refresh-public-sitemap.cjs');
test('sitemap reconciles canonical ownership, redirects and duplicates while preserving priorities and accurate dates',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sitemap-refresh-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.mkdirSync(path.join(root,'docs/qa'),{recursive:true});
 const files={
  'index.html':'<link rel="canonical" href="https://whatwhatboy.com/">',
  'new.html':'<link rel="canonical" href="https://whatwhatboy.com/new.html">',
  'host.html':'<link rel="canonical" href="https://speedy-away.github.io/hosts/">',
  'redirect.html':'<meta http-equiv="refresh" content="0;url=https://speedy-away.github.io/">',
  'private.html':'<meta name="robots" content="noindex, follow">'
 };
 for(const [file,html]of Object.entries(files))fs.writeFileSync(path.join(root,file),html);
 fs.writeFileSync(path.join(root,'sitemap.xml'),'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://whatwhatboy.com/</loc><lastmod>2020-01-01</lastmod><priority>1.0</priority></url><url><loc>https://whatwhatboy.com/</loc></url><url><loc>https://whatwhatboy.com/hosts/</loc></url></urlset>');
 const options={date:'2026-11-04',pageScope:{root,pages:()=>Object.keys(files).map(f=>path.join(root,f)),relativePath:f=>path.relative(root,f)},dates:new Map([['index.html','2026-11-03'],['new.html','2026-11-04']])};
 const report=refresh(true,options),xml=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
 assert.equal(report.canonicalURLs,2);assert.equal(report.duplicatesRemoved,1);assert.deepEqual(report.removed,['https://whatwhatboy.com/hosts/']);
 assert.equal(report.externalCanonicals.length,1);assert.match(xml,/<lastmod>2026-11-03<\/lastmod><priority>1.0<\/priority>/);
 assert.match(xml,/<loc>https:\/\/whatwhatboy.com\/new.html<\/loc><lastmod>2026-11-04<\/lastmod>/);
 assert.equal(refresh(false,options).changed,false);
});
test('all supported dictionaries translate the new public labels and restore English without changing technical values',()=>{
 const root=path.resolve(__dirname,'../..'),pack={...require('../../i18n-tools/public-navigation-translations.cjs'),...require('../../i18n-tools/public-guide-translations.cjs')};
 const runtime=fs.readFileSync(path.join(root,'languages/i18n.js'),'utf8'),fixture=fs.readFileSync(path.join(__dirname,'i18n-runtime.test.cjs'),'utf8');
 const from=fixture.indexOf('function fixture(options = {}) {'),to=fixture.indexOf('\ntest(',from),box={source:runtime,vm,Intl};
 vm.createContext(box);vm.runInContext(fixture.slice(from,to),box);const f=box.fixture();
 const nodes=Object.keys(pack).map(key=>[key,f.element('span',key)]),pin=f.element('code','PS4 5.05 / CUSA00419 / 1.27');
 for(const file of fs.readdirSync(path.join(root,'languages')).filter(name=>/^[a-z]{2}\.js$/.test(name))){
  const code=file.slice(0,2),locale={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'languages',file),'utf8'),locale);
  const table=locale.window.__scoobyI18nQueue.find(row=>row[0]===code)[1];f.api.register(code,table);f.api.set(code);
  for(const [key,node]of nodes)assert.equal(node.textContent,pack[key][code],code+': '+key);
  assert.equal(pin.textContent,'PS4 5.05 / CUSA00419 / 1.27');assert.equal(f.doc.documentElement.getAttribute('dir'),['ar','he'].includes(code)?'rtl':'ltr');
  f.api.set('en');for(const [key,node]of nodes)assert.equal(node.textContent,key);
 }
});
