// Annotated menu illustrations. All labels also ship in the site's 20 languages.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=require('../i18n-tools/transfer-guide-source.json');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function label(value,x,y,max=25,size=27){
  // Bound lines without shrinking non-Latin scripts into unreadable text.
  const words=/\s/.test(value)?value.split(' '):[...value];
  const joiner=/\s/.test(value)?' ':'';let lines=[''];
  for(const word of words){let last=lines.length-1;if(lines[last]&&(lines[last]+joiner+word).length>max)lines.push(word);else lines[last]+=(lines[last]?joiner:'')+word;}
  return `<text x="${x}" y="${y}" fill="#edf6f4" font-size="${size}">${lines.map((line,i)=>`<tspan x="${x}" dy="${i?size*1.2:0}">${esc(line)}</tspan>`).join('')}</text>`;
}
const box=(x,y,w,h)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#192327" stroke="#76e0cf" stroke-width="3"/>`;
const badge=(x,y,n)=>`<circle cx="${x}" cy="${y}" r="21" fill="#76e0cf"/><text x="${x}" y="${y+8}" fill="#101619" font-size="25" font-weight="700" text-anchor="middle">${n}</text>`;
function wrap(body,rtl){return `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="600" viewBox="0 0 1120 600"><rect width="1120" height="600" rx="24" fill="#101619"/><g font-family="Arial, Helvetica, sans-serif"${rtl?' style="unicode-bidi:plaintext"':''}>${body}</g></svg>\n`;}
function ip(platform,t,rtl){
  const keys=platform==='ps4'?['settings','network','viewConnection']:['settings','network','connectionStatus','viewConnection'];
  return wrap(label(platform.toUpperCase(),52,60,30,30)+keys.map((key,i)=>{
    const y=90+i*116;
    return box(56,y,520,96)+badge(84,y+47,i+1)+label(t[key],124,y+42,24,26)+(i<keys.length-1?`<path d="M315 ${y+99}v12m-6-6 6 6 6-6" stroke="#76e0cf" stroke-width="3" fill="none"/>`:'');
  }).join('')+`<path d="M597 300h40m-10-8 10 8-10 8" stroke="#76e0cf" stroke-width="4" fill="none"/>`+box(663,195,405,192)+label(t[platform==='ps4'?'ipAddress':'ipv4Address'],686,235,22,25)+label('192.168.1.50',686,338,24,33)+badge(1055,195,keys.length+1),rtl);
}
function goldhen(t,rtl){
  const names=['GoldHEN',t.serverSettings,t.enableFtp];
  return wrap(label('PS4 · GoldHEN',52,61,35,30)+names.map((value,i)=>{
    const y=101+i*140;
    return box(58,y,1003,114)+badge(88,y+53,i+1)+label(value,128,y+50,46,29)+(i===2?'<rect x="920" y="418" width="94" height="44" rx="22" fill="#76e0cf"/><circle cx="990" cy="440" r="17" fill="#101619"/>':`<path d="M551 ${y+119}v14m-7-7 7 7 7-7" stroke="#76e0cf" stroke-width="3" fill="none"/>`);
  }).join('')+label('FTP · 2121',796,557,30,28),rtl);
}
function build(){
 const codes=require('./localized-html.cjs').codes;
 for(const code of ['en',...codes]){
  const locale=path.join(root,'i18n-tools/transfer-guide-locales',code+'.json');
  if(code!=='en'&&!fs.existsSync(locale))continue;
  const t=code==='en'?source:JSON.parse(fs.readFileSync(locale,'utf8'));
  if(['settings','network','connectionStatus','viewConnection','ipAddress','ipv4Address','serverSettings','enableFtp'].some(key=>!t[key]))continue;
  const folder=path.join(root,'assets/images/transfer-guides',code==='en'?'':code);fs.mkdirSync(folder,{recursive:true});
  const rtl=['ar','he'].includes(code);
  for(const platform of ['ps4','ps5'])fs.writeFileSync(path.join(folder,platform+'-ip-address.svg'),ip(platform,t,rtl));
  fs.writeFileSync(path.join(folder,'ps4-goldhen-ftp.svg'),goldhen(t,rtl));
 }
 console.log('Built highlighted IP and GoldHEN menu illustrations.');
}
if(require.main===module)build();
module.exports={build};
