'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const html=require('../localized-html.cjs'),builder=require('../build-localized-pages.cjs');
const {tag:languageLoader}=require('../language-loader.cjs');
const root=path.resolve(__dirname,'../..');
function fixture(){
 const dictionary=html.dictionary(root,'es'),source='<!doctype html><html lang="en"><head><title>Home</title><meta name="description" content="Tools"><meta property="og:title" content="Home"><meta property="og:description" content="Tools"><meta property="og:locale" content="en_US"><meta property="og:url" content="https://whatwhatboy.com/"><link rel="canonical" href="https://whatwhatboy.com/"><style>.card{background:url(assets/cover.png)}</style><script defer src="/languages/i18n.js?v=3"></script><script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"Home","description":"Tools","url":"https://whatwhatboy.com/"}</script></head><body><h1>Home</h1><p>Tools</p><code>PS4 5.05 / CUSA00419 / old-v1.27.bin</code><a href="console/ps4/?view=files#guide">Guides</a><a href="downloads/old-v1.27.bin" download>Download</a><img src="assets/cover.png" alt="Game patches"><script>window.exact="../docs/catalog.json";</script></body></html>';
 const page={page:'index.html',canonical:html.origin+'/',sha256:html.hash(source)},other={page:'console/ps4/index.html',canonical:html.origin+'/console/ps4/',sha256:html.hash(source)},strings=new Map();
 for(const s of [...html.spans(source).map(s=>s.source),...html.structuredStrings(source)])strings.set(s,{source:s,dictionary:true});
 const languages=new Map(html.codes.map(code=>[code,{dictionary:html.dictionary(root,code),translations:{}}]));
 return {source,page,ctx:{root,pages:new Map([['index.html',page],['console/ps4/index.html',other]]),routes:new Map([['/',page.canonical],['/console/ps4/',other.canonical]]),strings,languages,shared:new Map()},dictionary};
}
test('every locale has translated HTML before JavaScript, self canonicals, reciprocal alternate URLs and correct writing direction',()=>{
 const {source,page,ctx}=fixture();
 for(const code of html.codes){const result=builder.render(ctx,page,source,code),d=ctx.languages.get(code).dictionary;
  assert.ok(result.includes(languageLoader));
  assert.ok(result.includes('<title>'+html.escape(d.Home)+'</title>'));assert.ok(result.includes('<h1>'+html.escape(d.Home)+'</h1>'));
  assert.ok(result.includes('<meta name="description" content="'+html.escape(d.Tools)+'">'));
  assert.ok(result.includes('lang="'+code+'" dir="'+(['ar','he'].includes(code)?'rtl':'ltr')+'"'));
  assert.ok(result.includes('<link rel="canonical" href="'+html.origin+'/'+code+'/">'));
  assert.equal((result.match(/<link rel="alternate" hreflang=/g)||[]).length,22);
  assert.ok(result.includes(html.alternateLinks(page.canonical)));assert.ok(result.includes('href="/'+code+'/console/ps4/?view=files#guide"'));
  assert.ok(result.includes('href="/downloads/old-v1.27.bin" download'));assert.ok(result.includes('<code>PS4 5.05 / CUSA00419 / old-v1.27.bin</code>'));
  assert.ok(result.includes('<script>window.exact="../docs/catalog.json";</script>'));assert.ok(result.includes('<base href="/">'));
  const schema=JSON.parse(result.match(/application\/ld\+json">([^<]+)<\/script>/)[1]);assert.equal(schema.inLanguage,code);assert.equal(schema.url,html.origin+'/'+code+'/');assert.equal(schema.name,d.Home);
 }
 const english=builder.render(ctx,page,source,'en');assert.ok(english.includes(languageLoader));assert.ok(english.includes('<title>Home</title>'));assert.ok(english.includes(html.alternateLinks(page.canonical)));assert.equal(ctx.shared.size,1);
});
test('HTML tokenization respects technical opt-outs, quoted angle brackets, metadata and immutable code',()=>{
 const source='<html><head><title>Search tools</title><meta name="description" content="Choose PS4 &amp; PS5"></head><body><p title="A > B">Choose files</p><p translate="no">Keep literal</p><section data-i18n-skip><span>Keep nested</span></section><pre>Unchanged source</pre><script>const value="<p>inert</p>";</script></body></html>';
 const spans=html.spans(source),strings=spans.map(row=>row.source);assert.deepEqual(strings,['Search tools','Choose PS4 & PS5','A > B','Choose files']);for(const span of spans)assert.equal(html.normalize(html.decode(source.slice(span.start,span.end))),span.source);
});
test('protected game IDs, firmware versions, hashes, filenames and source URLs survive reordered translations exactly',()=>{
 const protect=html.protection(['Newer Super Mario Bros. Wii']),source='Use Newer Super Mario Bros. Wii with PS4 5.05, CUSA00419, old-v1.27.bin and https://example.com/v1.zip.';
 const record=protect(source),tokens=record.template.match(/ZXQ\d{4}QXZ/g);assert.ok(record.values.includes('Newer Super Mario Bros. Wii'));assert.ok(record.values.includes('5.05'));assert.ok(record.values.includes('CUSA00419'));assert.equal(html.restore(record.template,record.values),source);
 assert.throws(()=>html.restore(tokens.slice(1).join(' '),record.values),/protected literal/);
});
test('new authored text falls back to English while missing catalogued translations fail',()=>{
 const {ctx}=fixture();assert.equal(builder.translate(ctx,'Missing English prose','es'),'Missing English prose');
 ctx.strings.set('New prose',{source:'New prose',id:'missing',values:[]});assert.throws(()=>builder.translate(ctx,'New prose','es'));
});
test('runtime-independent language links and sitemap generation cover all language routes',t=>{
 const {ctx,page,source}=fixture(),folder=fs.mkdtempSync(path.join(os.tmpdir(),'multilingual-seo-'));t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 ctx.pages=new Map([[page.page,page]]);fs.writeFileSync(path.join(folder,'index.html'),source);const out=path.join(folder,'site');fs.mkdirSync(out);
 const report=builder.generate({root:folder,output:out,context:ctx});assert.equal(report.pages,20);assert.equal(report.englishPages,1);
 for(const code of html.codes){assert.ok(fs.existsSync(path.join(out,code,'index.html')));assert.ok(fs.readFileSync(path.join(out,'sitemaps',code+'.xml'),'utf8').includes('<loc>'+html.origin+'/'+code+'/</loc>'));}
 assert.ok(fs.readFileSync(path.join(out,'robots.txt'),'utf8').includes('Sitemap: '+html.origin+'/sitemap-index.xml'));assert.equal((fs.readFileSync(path.join(out,'sitemap-index.xml'),'utf8').match(/<sitemap>/g)||[]).length,21);
});

test('localized PlayStation packages stay in the selected language without entering its sitemap',t=>{
 const {ctx}=fixture();
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'multilingual-playstation-'));
 t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 const base='/console/ps4/game-library/';
 const utility={page:base.slice(1)+'download.html',canonical:html.origin+base+'download.html',noindex:true};
 const library={page:base.slice(1)+'index.html',canonical:html.origin+base};
 const makePage=(page,body)=>`<!doctype html><html lang="en"><head><link rel="canonical" href="${page.canonical}">${page.noindex?'<meta name="robots" content="noindex, follow">':''}</head><body>${body}</body></html>`;
 const source=makePage(library,'<a href="?game=abcdef">View game</a><a href="./download.html?game=abcdef&amp;file=42">Download options</a>');
 const packagePage=makePage(utility,'<a href="./">Game library</a><a href="/downloads/example-v1.pkg" download>Download</a>');
 assert.equal(html.publicSource(utility.page,packagePage),false);
 assert.equal(html.localizedUtility(utility.page,packagePage),true);
 for(const [page,content] of [[library,source],[utility,packagePage]]){
  const file=path.join(folder,page.page);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);
 }
 ctx.pages=new Map([library,utility].map(page=>[page.page,page]));
 ctx.routes=new Map([library,utility].map(page=>[new URL(page.canonical).pathname,page.canonical]));
 const out=path.join(folder,'site');
 builder.generate({root:folder,output:out,context:ctx});
 for(const code of html.codes){
  const localeBase='/'+code+base;
  const rendered=fs.readFileSync(path.join(out,code,library.page),'utf8');
  const download=fs.readFileSync(path.join(out,code,utility.page),'utf8');
  const sitemap=fs.readFileSync(path.join(out,'sitemaps',code+'.xml'),'utf8');
  assert.ok(rendered.includes(`href="${localeBase}?game=abcdef"`));
  assert.ok(rendered.includes(`href="${localeBase}download.html?game=abcdef&amp;file=42"`));
  assert.ok(download.includes(`href="${localeBase}"`));
  assert.ok(download.includes('href="/downloads/example-v1.pkg" download'));
  assert.ok(download.includes('content="noindex, follow"'));
  assert.doesNotMatch(download,/rel="alternate"/);
  assert.ok(sitemap.includes('<loc>'+html.origin+localeBase+'</loc>'));
  assert.ok(!sitemap.includes('download.html'));
 }
});

test('PlayStation keyword phrases translate individually and deduplicate in metadata and schema',()=>{
 const {ctx}=fixture();
 const page={page:'console/ps4/game-library/index.html',canonical:html.origin+'/console/ps4/game-library/'};
 const original='PS4 game downloads, download PS4 games, CUSA01715, PS5 game updates';
 const terms={'PS4 game downloads':'Descargas de juegos PS4','download PS4 games':'Descargas de juegos PS4','PS5 game updates':'Actualizaciones de juegos PS5'};
 for(const [source,value] of Object.entries(terms)){
  ctx.strings.set(source,{source,id:source,values:[]});
  ctx.languages.get('es').translations[source]=value;
 }
 const expected='Descargas de juegos PS4, CUSA01715, Actualizaciones de juegos PS5';
 const source=`<html><head><link rel="canonical" href="${page.canonical}"><meta name="keywords" content="${original}"><script type="application/ld+json">{"keywords":"${original}"}</script></head><body></body></html>`;
 const output=builder.render(ctx,page,source,'es');
 assert.ok(output.includes('name="keywords" content="'+expected+'"'));
 assert.equal(JSON.parse(output.match(/application\/ld\+json">([^<]+)<\/script>/)[1]).keywords,expected);
});

test('shared search data restores original search fields and includes translated card text before filters run',()=>{
 const {source,page,ctx}=fixture(),card='<article data-search="pinned original 5.05 CUSA00419"><h3>Game patches</h3></article>',input=source.replace('</body>',card+'<script>window.searchReady=true;</script></body>');
 const output=builder.render(ctx,page,input,'es'),id=output.match(/data-localized-search="([^"]+)"/)[1],script=[...ctx.shared].find(([name])=>/search-.*\.js$/.test(name))[1],attrs=new Map([['data-localized-search',id]]),node={textContent:'Parches de juegos',getAttribute:key=>attrs.get(key),setAttribute:(key,value)=>attrs.set(key,value),removeAttribute:key=>attrs.delete(key)};
 const box={window:{}};require('node:vm').runInNewContext(script,box);box.window.WhatsiteLocalizedSearch.apply({querySelectorAll:()=>[node]});
 assert.equal(attrs.get('data-search'),'pinned original 5.05 CUSA00419 Parches de juegos');assert.ok(!attrs.has('data-localized-search'));
 assert.ok(output.includes('WhatsiteLocalizedSearch.apply(document);</script><script>window.searchReady=true;</script>'));
});

test('locale-aware filters and guide controllers preserve scope for non-Latin queries and console routes',()=>{
 const ports=require('../../assets/pc-ports.js'),guides=require('../../assets/console-guide-dialog.js'),setup=require('../../assets/console-setup-popups.js'),topic=require('../../assets/console-topic-entry.js');
 for(const query of ['移植','エミュレーター','محاكيات','эмуляторы','게임'])assert.equal(ports.matches({search:'PC 移植 エミュレーター محاكيات эмуляторы 게임',platform:'windows',availability:'ready'},query,'windows','ready'),true,query);
 assert.equal(guides.isModGuidePath('/ja/console/mods/ps4/gta5/'),true);assert.equal(setup.setupPage('/fr/console/ps3/hen.html'),true);assert.equal(setup.setupPage('/fr/console/ps4/apps.html'),false);
 assert.equal(topic.destination({href:'https://whatwhatboy.com/es/console/nintendo-switch.html',hash:'',search:''},'/console/nintendo-switch/'),'/es/console/nintendo-switch/');
});
