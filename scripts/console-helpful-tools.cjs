// Additive console helpers, shared by every page generator.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),data=require('../docs/cod-plugin-template-regions.json');
const {renderSection,addTitleIdCopy}=require('./ps4-user-plugin-templates.cjs');
function prepare(){const files=data.games.map(game=>{const unique=[...new Set(Object.values(game.regions))];const text='; '+game.name+' - regional GoldHEN template\r\n; Merge into /data/GoldHEN/plugins.ini; retain existing entries.\r\n; Add only the exact compatible plugin filename. Regional IDs do not confirm menu support.\r\n\r\n'+unique.map(id=>'; '+Object.keys(game.regions).filter(r=>game.regions[r]===id).join(' / ')+'\r\n['+id+']\r\n; /data/GoldHEN/plugins/YOUR_PLUGIN_FILENAME.prx\r\n').join('\r\n');const bytes=Buffer.from(text),sha256=crypto.createHash('sha256').update(bytes).digest('hex'),local='/downloads/ps4/plugin-templates/call-of-duty/'+game.id+'/'+sha256.slice(0,12)+'/plugins.ini';const dest=path.join(root,'.'+local);fs.mkdirSync(path.dirname(dest),{recursive:true});if(fs.existsSync(dest)&&!fs.readFileSync(dest).equals(bytes))throw Error('Refusing overwrite');if(!fs.existsSync(dest))fs.writeFileSync(dest,bytes,{flag:'wx'});return {...game,local,name:'plugins.ini',bytes:bytes.length,sha256,version:'Regional template 2026-11-04',sourceUrl:'https://whatwhatboy.com'+local};});fs.writeFileSync(path.join(root,'downloads/ps4/plugin-templates/call-of-duty/manifest.json'),JSON.stringify({files},null,2)+'\n');return files;}
function apply(file,html){
  const match=/^console\/mods\/ps4\/call-of-duty\/([^/]+)\/index.html$/.exec(file);
  if (match) {
    const manifest=path.join(root,'downloads/ps4/plugin-templates/call-of-duty/manifest.json');
    const game=fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest)).files.find(g=>g.id===match[1]):null;
    if (game) {
      const section=renderSection({id:'cod-regional-plugin-template', game:game.name, local:game.local,
        regions:Object.entries(game.regions),
        instructions:'<p>Add the exact compatible plugin filename under your installed title ID. Merge into <code>/data/GoldHEN/plugins.ini</code>, keeping existing entries. Plugin files are downloaded separately. Check the game update and region required by your menu.</p>'});
      html=html.replace(/<section\b[^>]*\bid="cod-regional-plugin-template"[^>]*>[\s\S]*?<\/section>/,'');
      html=html.replace('<div id="content">',()=>'<div id="content">'+section);
    }
  }

  if (/^console\/(ps3|ps4|ps5|psvita|xbox360)\/(index|transfer-tools)\.html$/.test(file)) {
    html = html.replace(/<section\b[^>]*\bid="helpful-desktop-tools"[^>]*>[\s\S]*?<\/section>/g, '');
    const consolePlatform=/^console\/(ps[45])\//.exec(file)?.[1];
    const card = consolePlatform
      ? `<section id="helpful-desktop-tools" class="section"><div class="container"><h2 class="section-title">Transfer files to your console</h2><article class="guide-resource tg-guide-entry" data-search="${require('./transfer-guide-seo.cjs').keywords(consolePlatform).join(' ')}"><h3>${consolePlatform.toUpperCase()} · FTP / USB</h3><p>Choose FTP or USB for a simple guide with pictures, phone apps and file management steps.</p><div class="guide-links" style="justify-content:center;width:100%"><a class="btn btn-primary" href="/console/${consolePlatform}/file-transfer-guide.html">Open transfer guide</a><a class="btn btn-outline" href="/console/download-center/">Download Center <span>·</span> <span>Not finished</span></a></div></article></div></section>`
      : '<section id="helpful-desktop-tools" class="section"><div class="container"><h2 class="section-title">Helpful computer tools</h2><article class="guide-resource"><h3>FileZilla Client · FTP transfers</h3><p>Transfer files between your computer and a console running an FTP server. Enable the console’s FTP service, then enter its local IP address and the port shown by that service in FileZilla. Use the credentials shown by the console tool. FileZilla runs on your computer.</p><div class="guide-links"><a class="btn btn-primary" href="https://filezilla-project.org/download.php?show_all=1" target="_blank" rel="noopener noreferrer">Download FileZilla Client · official site</a></div></article></div></section>';
    const firmware = /<section\b[^>]*\bid="(?:firmware-jailbreak|console-hub-setup)"[^>]*>/;
    const setup = /<div\b[^>]*\bid="console-hub-setup"[^>]*>/;
    const before = /^console\/ps[45]\/index\.html$/.test(file) && (html.match(firmware) || html.match(setup));
    html = before ? html.replace(before[0], card + before[0]) : html.replace('<div id="content">', '<div id="content">' + card);
  }
return addTitleIdCopy(html);}
module.exports={apply,prepare};if(require.main===module)console.log('Prepared '+prepare().length+' regional templates');
