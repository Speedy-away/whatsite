// Sequential file-manager illustrations, not exact app screenshots.
// USB-to-internal copies stay separate from local/remote two-pane transfers.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'assets', 'images', 'transfer-guides');
const localeDirectory = path.join(root, 'i18n-tools', 'transfer-guide-locales');
const requiredKeys = ['sourceFolder', 'destinationFolder', 'copyAction', 'pasteAction', 'managerCaption', 'illustration'];
const c = { background:'#101619', panel:'#192327', line:'#34464c', muted:'#81969c', text:'#edf6f4', accent:'#76e0cf' };
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const rect = (x,y,w,h,attributes='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${attributes}/>`;
const line = (x1,y1,x2,y2,color=c.line,width=2) => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
const text = (value,x,y,size=24,attributes='') => `<text x="${x}" y="${y}" font-size="${size}" fill="${c.text}" ${attributes}>${esc(value)}</text>`;
function wrapLabel(value, maximum) {
  const hasSpaces = /\s/.test(value);
  const units = hasSpaces ? value.trim().split(/\s+/) : [...value];
  const separator = hasSpaces ? ' ' : '';
  const lines = [''];
  for (const unit of units) {
    const last = lines.length-1;
    const candidate = lines[last]+(lines[last]?separator:'')+unit;
    if (lines[last] && [...candidate].length>maximum) lines.push(unit);
    else lines[last]=candidate;
  }
  return lines;
}
function label(value,x,y,width,rtl,size=25,maximum=27,centered=false) {
  const lines=wrapLabel(value,maximum);
  const startX=centered?x+width/2:rtl?x+width:x;
  const anchor=centered?'middle':'start';
  const content=lines.map((value,index)=>`<tspan x="${startX}" dy="${index?size*1.2:0}">${esc(value)}</tspan>`).join('');
  return `<text x="${startX}" y="${y}" fill="${c.text}" font-size="${size}" text-anchor="${anchor}"${rtl?' direction="rtl" unicode-bidi="plaintext"':''}>${content}</text>`;
}
function badge(x,y,number) {
  return `<circle cx="${x}" cy="${y}" r="23" fill="${c.accent}" stroke="${c.background}" stroke-width="5"/><text x="${x}" y="${y+8}" font-size="25" font-weight="700" fill="${c.background}" text-anchor="middle">${number}</text>`;
}
function folder(x,y) {
  return `<path d="M${x} ${y+10}V${y+4}Q${x} ${y} ${x+5} ${y}H${x+24}L${x+33} ${y+10}H${x+54}Q${x+60} ${y+10} ${x+60} ${y+16}V${y+40}Q${x+60} ${y+46} ${x+54} ${y+46}H${x+6}Q${x} ${y+46} ${x} ${y+40}Z" fill="${c.line}"/>`;
}
function file(x,y,color=c.accent) {
  return `<path d="M${x} ${y}H${x+30}L${x+45} ${y+15}V${y+58}H${x}Z" fill="${color}"/><path d="M${x+30} ${y}V${y+15}H${x+45}" fill="none" stroke="${c.background}" stroke-width="2"/>`+line(x+9,y+31,x+32,y+31,c.background)+line(x+9,y+40,x+27,y+40,c.background);
}
function check(x,y) {
  return `<circle cx="${x}" cy="${y}" r="17" fill="${c.accent}"/><path d="M${x-7} ${y}L${x-1} ${y+6}L${x+9} ${y-7}" fill="none" stroke="${c.background}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
}
function snapshot(x,t,rtl,destination) {
  const width=466;
  const directory=destination?'/data/transfer':'/mnt/usb0';
  const heading=destination?t.destinationFolder:t.sourceFolder;
  const action=destination?t.pasteAction:t.copyAction;
  const step=destination?3:1;
  return rect(x,148,width,365,`rx="16" fill="${c.panel}" stroke="${c.line}" stroke-width="2"`)+
    badge(x+28,150,step)+label(heading,x+30,198,width-60,rtl,25,26)+
    line(x+24,238,x+width-24,238)+folder(x+29,254)+text(directory,x+106,286,25,'font-family="monospace"')+
    rect(x+23,322,width-46,91,`rx="11" fill="${c.background}" stroke="${c.accent}" stroke-width="3"`)+
    file(x+43,338)+text('example.zip',x+108,376,26,'font-family="monospace"')+
    (destination?check(x+width-48,346):'')+
    // Keep the USB original visible after the copy; this is not a move.
    rect(x+80,438,width-111,54,`rx="10" fill="${c.background}" stroke="${c.accent}" stroke-width="3"`)+
    badge(x+34,464,step+1)+label(action,x+90,474,width-131,rtl,25,24,true);
}
function illustration(platform,t,rtl) {
  const product=platform==='ps4'?'PS4-Xplorer':'PS5 · ezRemote Client';
  const description=t.managerCaption+' '+t.illustration;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="600" viewBox="0 0 1120 600" role="img" aria-labelledby="manager-title manager-description"><title id="manager-title">${esc(product)}</title><desc id="manager-description">${esc(description)}</desc>`+
    rect(0,0,1120,600,`rx="24" fill="${c.background}"`)+`<g font-family="Arial, Helvetica, sans-serif">`+
    text(product,48,58,31,'font-weight="700"')+label(t.illustration,48,95,1024,rtl,19,85)+
    snapshot(45,t,rtl,false)+
    // A visible progression between separate snapshots, not simultaneous panes.
    `<path d="M531 326H582M570 314L582 326L570 338" fill="none" stroke="${c.accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`+
    `<path d="M541 365H560L568 373V395H541Z" fill="${c.background}" stroke="${c.accent}" stroke-width="2"/><path d="M549 356H569L578 365V386" fill="none" stroke="${c.accent}" stroke-width="2"/>`+
    snapshot(609,t,rtl,true)+
    `<path d="M100 548H1018M1006 538L1018 548L1006 558" fill="none" stroke="${c.line}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`+
    file(65,530,c.muted)+file(1033,530)+'</g></svg>\n';
}
function build() {
  const source=JSON.parse(fs.readFileSync(path.join(root,'i18n-tools','transfer-guide-source.json'),'utf8'));
  const codes=require('./localized-html.cjs').codes;
  const built=[],skipped=[];
  for(const code of ['en',...codes]) {
    const localeFile=path.join(localeDirectory,code+'.json');
    if(code!=='en'&&!fs.existsSync(localeFile)){skipped.push(code);continue;}
    const t=code==='en'?source:JSON.parse(fs.readFileSync(localeFile,'utf8'));
    if(requiredKeys.some(key=>typeof t[key]!=='string'||!t[key].trim())){skipped.push(code);continue;}
    const folderPath=code==='en'?output:path.join(output,code);
    fs.mkdirSync(folderPath,{recursive:true});
    for(const platform of ['ps4','ps5']) fs.writeFileSync(path.join(folderPath,platform+'-file-manager.svg'),illustration(platform,t,['ar','he'].includes(code)));
    built.push(code);
  }
  console.log(`Built file-manager illustrations for ${built.length} languages: ${built.join(', ')}.`);
  if(skipped.length)console.log(`Skipped languages awaiting translated labels: ${skipped.join(', ')}.`);
  return {built,skipped};
}
if(require.main===module)build();
module.exports={build};
