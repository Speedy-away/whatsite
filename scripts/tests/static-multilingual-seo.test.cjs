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
