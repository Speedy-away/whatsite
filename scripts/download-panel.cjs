'use strict';
// Local authoring tool. No packages, publishing, shell interpolation or payload execution.
const fs=require('node:fs');
const fsp=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const {Readable,Transform}=require('node:stream');
const {pipeline}=require('node:stream/promises');
const {createArchive,contained,hashFile}=require('./console-expansion-archive.cjs');
const data=require('./download-panel-data.cjs');
const {safeName}=require('./download-archive-layout.cjs');
const ROOT=path.resolve(__dirname,'..');
const MAX_FILE=4*1024**3,MAX_IMAGE=12*1024**2;
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function publicUrl(value) {
  let url;try{url=new URL(String(value).trim());}catch{throw Error('Enter a complete HTTPS URL.');}
  if(url.protocol!=='https:'||url.username||url.password)throw Error('Use an HTTPS URL without credentials.');
  if(/(?:^|\/)latest(?:\/|$|[?#])/i.test(url.pathname+url.search))throw Error('Use a version-specific link, rather than a latest URL.');
  return url.href;
}
function sourcePath(value) {return String(value||'').trim().replace(/^"(.*)"$/,'$1');}
function raster(bytes) {
  if(bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))return '.png';
  if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return '.jpg';
  if(/^GIF8[79]a/.test(bytes.subarray(0,6).toString()))return '.gif';
  if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')return '.webp';
  if(bytes.subarray(4,8).toString()==='ftyp'&&/avif|avis/.test(bytes.subarray(8,40).toString()))return '.avif';
  throw Error('Use a PNG, JPG, GIF, WebP or AVIF image.');
}
async function copyUnique(root,source,relative) {
  const target=contained(root,path.join(root,relative));
  await fsp.mkdir(path.dirname(target),{recursive:true});
  try {await fsp.copyFile(source,target,fs.constants.COPYFILE_EXCL);}
  catch(error){if(error.code!=='EEXIST')throw error;const [a,b]=await Promise.all([hashFile(source),hashFile(target)]);if(a.sha256!==b.sha256)throw Error('A different file already exists at '+relative);}
  return '/'+relative.replaceAll('\\','/').split('/').map(encodeURIComponent).join('/');
}
async function download(url,target,max=MAX_FILE) {
  if(/(^|\.)bstlar\./i.test(new URL(url).hostname))throw Error('Bstlar links are skipped. Supply a ready-to-use local file and its original source instead.');
  const response=await fetch(url,{signal:AbortSignal.timeout(20*60*1000)});
  if(!response.ok)throw Error('Download returned HTTP '+response.status+'. Supply a local ready-to-use file if the source requires a browser.');
  if(/text\/html|application\/xhtml/i.test(response.headers.get('content-type')||''))throw Error('That link returned a web page. Use the direct release asset, or provide a local file.');
  let size=0;
  const meter=new Transform({transform(chunk,encoding,next){size+=chunk.length;next(size>max?Error('File exceeds the 4 GiB panel limit.'):null,chunk);}});
  await pipeline(Readable.fromWeb(response.body),meter,fs.createWriteStream(target,{flags:'wx'}));
  if(!size)throw Error('The source returned an empty download.');
  return response.url;
}
function validate(input,pages) {
  if(!input||typeof input!=='object')throw Error('Invalid form data.');
  const page=pages.find(page=>page.file===input.page);
  if(!page)throw Error('Choose an existing destination page.');
  if(!data.TYPES[input.type])throw Error('Choose a download type.');
  const row={page:page.file,type:input.type};
  for(const [name,max] of Object.entries({title:180,description:6000,version:120,gameVersion:160,firmware:160,region:200,variant:30})) {
    row[name]=String(input[name]||'').trim();
    if(row[name].length>max)throw Error(name+' is too long.');
  }
  if(!row.title||!row.description||!row.version)throw Error('Title, description and release version are required.');
  if(!['','DEX','HEN'].includes(row.variant))throw Error('Unknown PS3 variant.');
  if(row.variant&&page.group!=='PS3')throw Error('DEX and HEN variants apply to PS3 pages only.');
  row.sourceUrl=publicUrl(input.sourceUrl);
  row.platform=page.group==='Free cheats'||page.group==='PC game mods'||page.group==='PC / downloads'?'PC':page.group;
  if(input.mirror&&!['menu','cheat','script','payload'].includes(row.type))throw Error('Games, apps, homebrew and tools must retain their upstream download links.');
  return row;
}
function createPanel({root=ROOT,backupRoot=path.resolve('F:/whatsite-backup-downloads-etc')}={}) {
  const token=crypto.randomBytes(32).toString('hex'),uploads=new Map();
  const temp=contained(root,path.join(root,'.tmp/download-panel'));
  const archive=createArchive({workspaceRoot:root,backupRoot});
  let busy=false,base='';
  const pages=()=>data.listPages(root);
  async function reserveTemp() {await fsp.mkdir(temp,{recursive:true});return contained(root,path.join(temp,crypto.randomUUID()));}
  function localInput(input,kind) {
    if(input[kind+'Upload']) {
      const uploaded=uploads.get(input[kind+'Upload']);
      if(!uploaded||uploaded.kind!==kind)throw Error('Selected upload expired. Choose the file again.');
      return uploaded;
    }
    const name=sourcePath(input[kind+'Path']);
    if(!name)return null;
    const resolved=path.resolve(name);
    if(!fs.statSync(resolved).isFile())throw Error('Local file is unavailable: '+name);
    return {path:resolved,name:path.basename(resolved)};
  }
  async function refreshIndex() {
    const inventory=JSON.parse(await fsp.readFile(path.join(backupRoot,'download-inventory.json'),'utf8'));
    const rows=(inventory.items||[]).flatMap(item=>(item.files||[]).map(file=>({title:item.title,file})));
    const existing=path.join(backupRoot,'existing-site-files.json');
    if(fs.existsSync(existing))for(const file of JSON.parse(await fsp.readFile(existing,'utf8')).files||[])rows.push({title:file.sitePath||file.name,file});
    const unique=new Map();for(const row of rows)if(row.file.backupPath)unique.set(row.file.backupPath,row);
    const index=contained(backupRoot,path.join(backupRoot,'index.html'));
    const history=contained(backupRoot,path.join(backupRoot,'archive-history/download-panel'));
    await fsp.mkdir(history,{recursive:true});
    if(fs.existsSync(index))await fsp.copyFile(index,path.join(history,Date.now()+'-'+crypto.randomUUID()+'.html'),fs.constants.COPYFILE_EXCL);
    const entries=[...unique.values()].sort((a,b)=>a.file.backupPath.localeCompare(b.file.backupPath));
    const html='<!doctype html><html lang="en"><meta charset="utf-8"><title>Local download archive</title><style>body{font:16px system-ui;background:#111;color:#eee;margin:32px}a{color:#9edbc4}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #444;text-align:left;padding:12px;overflow-wrap:anywhere}</style><h1>Local download archive</h1><p>'+entries.length+' saved files. All versions preserved.</p><table><tr><th>Resource / version</th><th>File</th><th>Size / SHA-256</th></tr>'+entries.map(({title,file})=>{
      const relative=path.relative(backupRoot,contained(backupRoot,file.backupPath)).replaceAll('\\','/');
      return '<tr><td>'+data.esc(title)+'<br>'+data.esc(file.version||file.releaseTag||'')+'</td><td><a download href="'+data.esc(relative.split('/').map(encodeURIComponent).join('/'))+'">'+data.esc(relative)+'</a></td><td>'+data.esc(file.bytes)+' bytes<br>'+data.esc(file.sha256)+'</td></tr>';
    }).join('')+'</table></html>';
    await fsp.writeFile(index,html);
  }
  async function save(input) {
    const row=validate(input,pages());
    if(!fs.existsSync(backupRoot))throw Error('F: archive is unavailable. Connect the archive drive before saving.');
    let image=localInput(input,'image');
    if(image) {
      if(fs.statSync(image.path).size>MAX_IMAGE)throw Error('Images must be 12 MiB or smaller.');
      const bytes=await fsp.readFile(image.path);image={...image,bytes,ext:raster(bytes)};
    } else if(input.imageUrl)row.image=publicUrl(input.imageUrl);
    let source=localInput(input,'download');
    const direct=row.sourceUrl;
    if(!source) {
      const url=new URL(direct);
      if(url.hostname==='github.com' && !(row.type==='source' ? /\/(?:archive\/|releases\/download\/)/ : /\/releases\/download\/[^/]+\/[^/]+/).test(url.pathname))throw Error('For GitHub, paste the version-specific release asset link, or provide a local build.');
      let filename;try{filename=decodeURIComponent(url.pathname.split('/').pop());}catch{throw Error('Invalid download filename.');}
      if(!filename)throw Error('The download URL needs a filename.');
      source={path:await reserveTemp(),name:safeName(filename)};
      source.resolvedUrl=await download(direct,source.path);
    }
    if(!fs.statSync(source.path).size)throw Error('Download file is empty.');
    if(fs.statSync(source.path).size>MAX_FILE)throw Error('File exceeds the 4 GiB panel limit.');
    const id='download-panel-'+crypto.randomUUID();
    const category=row.type==='source'?['Source Code']:['menu','cheat','script'].includes(row.type)?['Games',data.groupFor(row.page)==='Free cheats'?row.page.split('/').slice(1,-1).join(' / '):pages().find(p=>p.file===row.page).title]:[data.TYPES[row.type]];
    const archived=await archive.archiveFile({scope:'download-panel',item:{id,title:row.title,project:row.title,url:row.sourceUrl,platform:row.platform,category,pages:[row.page]},file:{name:safeName(source.name),sourceUrl:row.sourceUrl,resolvedUrl:source.resolvedUrl||row.sourceUrl,version:row.version,releaseTag:row.version,compatibility:{gameVersion:row.gameVersion,firmware:row.firmware,region:row.region,variant:row.variant},...(row.type==='source'?{archiveRole:['Source Code']}:{})},sourceFile:source.path});
    // Merge the durable sidecar before publishing any new card locally.
    await archive.mergeInventory({inventory:archived.inventory});
    row.id=id;row.createdAt=new Date().toISOString();row.file=archived.publicFile;
    row.downloadUrl=direct;
    if(input.mirror) {
      const folder=['downloads/panel',safeName(row.platform),id,safeName(row.version),safeName(source.name)].join('/');
      row.downloadUrl=await copyUnique(root,archived.file.backupPath,folder);
    }
    if(image) {
      const relative='assets/images/download-panel/'+digest(image.bytes)+image.ext;
      row.image=await copyUnique(root,image.path,relative);
    }
    const target=contained(root,path.join(root,row.page));
    const current=await fsp.readFile(target,'utf8');
    if(!data.allowedPage(row.page,current))throw Error('Destination changed. The archived file is preserved; choose a supported page.');
    const manifest=contained(root,path.join(root,data.MANIFEST));
    const entries=data.readEntries(root);
    const fingerprint=entry=>JSON.stringify([entry.page,entry.title,entry.version,entry.gameVersion,entry.firmware,entry.region,entry.variant,entry.file.sha256]);
    if(entries.some(entry=>fingerprint(entry)===fingerprint(row)))throw Error('This exact download is already on that page. Existing versions were preserved.');
    const history=contained(root,path.join(temp,'history',id));await fsp.mkdir(history,{recursive:true});
    await fsp.writeFile(path.join(history,'page.html'),current,{flag:'wx'});
    if(fs.existsSync(manifest))await fsp.copyFile(manifest,path.join(history,'entries.json'),fs.constants.COPYFILE_EXCL);
    entries.push(row);
    await fsp.mkdir(path.dirname(manifest),{recursive:true});
    const staged=manifest+'.'+crypto.randomUUID()+'.tmp';
    await fsp.writeFile(staged,JSON.stringify({schemaVersion:1,entries},null,2)+'\n',{flag:'wx'});
    await fsp.rename(staged,manifest);
    const warnings=[];
    try{await fsp.writeFile(target,data.apply(row.page,current,entries));}catch(error){warnings.push('Entry saved, but page rendering failed. Run node scripts/download-panel-data.cjs: '+error.message);}
    try{await refreshIndex();}catch(error){warnings.push('Download archived and inventoried; archive index refresh needs retry: '+error.message);}
    return {entry:row,pageUrl:'/site/'+row.page+'#'+row.id,warnings};
  }
  const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));};
  async function body(req) {let size=0;const parts=[];for await(const part of req){size+=part.length;if(size>128*1024)throw Error('Form is too large.');parts.push(part);}return JSON.parse(Buffer.concat(parts).toString());}
  async function staticFile(res,file,type) {res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(await fsp.readFile(file));}
  const server=http.createServer(async(req,res)=>{
    try {
      if(req.headers.host!==new URL(base).host || req.headers.origin && req.headers.origin!==base || req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'This panel accepts same-origin local requests only.'});
      const url=new URL(req.url,base);
      if(url.pathname.startsWith('/api/')) {
        if(req.headers['x-panel-token']!==token)return json(res,403,{error:'Panel session expired. Reopen the panel.'});
        if(req.method==='GET'&&url.pathname==='/api/catalog')return json(res,200,{pages:pages(),types:data.TYPES,entries:data.readEntries(root),archiveReady:fs.existsSync(backupRoot),archiveRoot:backupRoot});
        if(req.method==='POST'&&url.pathname==='/api/upload') {
          const kind=url.searchParams.get('kind');if(!['image','download'].includes(kind))throw Error('Invalid upload type.');
          const name=safeName(decodeURIComponent(req.headers['x-file-name']||'file')),file=await reserveTemp();
          let bytes=0;const meter=new Transform({transform(chunk,encoding,next){bytes+=chunk.length;next(bytes>(kind==='image'?MAX_IMAGE:MAX_FILE)?Error('Upload is too large.'):null,chunk);}});
          await pipeline(req,meter,fs.createWriteStream(file,{flags:'wx'}));
          if(!bytes)throw Error('File is empty.');
          if(kind==='image')raster(await fsp.readFile(file));
          const id=crypto.randomUUID();uploads.set(id,{path:file,name,kind});return json(res,200,{id,name,bytes});
        }
        if(req.method==='POST'&&url.pathname==='/api/image-preview') {
          const input=await body(req),image=localInput(input,'image');if(!image)throw Error('Enter an image path.');
          if(fs.statSync(image.path).size>MAX_IMAGE)throw Error('Image is too large.');
          const bytes=await fsp.readFile(image.path),ext=raster(bytes);
          res.writeHead(200,{'Content-Type':{'.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.avif':'image/avif'}[ext],'Cache-Control':'no-store'});return res.end(bytes);
        }
        if(req.method==='POST'&&url.pathname==='/api/entries') {
          if(busy)return json(res,409,{error:'A download is being saved. Wait for it to finish.'});
          busy=true;try{return json(res,200,await save(await body(req)));}finally{busy=false;}
        }
        return json(res,404,{error:'Unknown action.'});
      }
      if(req.method!=='GET')return json(res,405,{error:'Method not allowed.'});
      if(url.pathname==='/') {
        let html=await fsp.readFile(path.join(__dirname,'download-panel/index.html'),'utf8');
        html=html.replace('__PANEL_TOKEN__',token);
        res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' https: blob: data:; style-src 'self'; script-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(html);
      }
      if(['/panel.js','/panel.css'].includes(url.pathname))return staticFile(res,path.join(__dirname,'download-panel',url.pathname.slice(1)),url.pathname.endsWith('.js')?'text/javascript; charset=utf-8':'text/css; charset=utf-8');
      const fileName=decodeURIComponent(url.pathname.replace(/^\/site(?=\/)/,''));
      if(/^(?:\/assets\/|\/style\.css$|\/script\.js$|\/languages\/|\/console\/|\/games\/|\/mods\/|\/pc\/|\/games-downloads\/)/.test(fileName)) {
        let file=contained(root,path.join(root,'.'+fileName));if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=contained(root,path.join(file,'index.html'));
        const ext=path.extname(file).toLowerCase(),type={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.avif':'image/avif','.svg':'image/svg+xml','.woff2':'font/woff2'}[ext];
        if(type&&fs.existsSync(file)&&fs.statSync(file).isFile())return staticFile(res,file,type);
      }
      return json(res,404,{error:'Not found.'});
    }catch(error){if(!res.headersSent)json(res,400,{error:error.message});else res.destroy();}
  });
  server.requestTimeout=30*60*1000;
  return {server,token,save,refreshIndex,async listen(port=0){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});base='http://127.0.0.1:'+server.address().port;return base;}};
}
async function main() {
  if(Number(process.versions.node.split('.')[0])<22)throw Error('Node.js 22 or newer is required.');
  const panel=createPanel(),url=await panel.listen();
  console.log('\nDownload panel: '+url+'\nKeep this window open. Press Ctrl+C to stop.\nChanges are local; use your normal publishing workflow when ready.\n');
  if(!process.argv.includes('--no-open')&&process.platform==='win32') {
    // Only the internally generated loopback URL is passed to the OS opener.
    const child=spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{windowsHide:true,stdio:'ignore'});child.on('error',()=>console.log('Open the URL above in your browser.'));
  }
}
module.exports={createPanel,publicUrl,raster,validate,copyUnique};
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
