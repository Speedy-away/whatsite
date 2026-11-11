// Language-neutral instructional diagrams, not screenshots of console/app interfaces.
const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, '..', 'assets', 'images', 'transfer-guides');
const c = {bg:'#101619',panel:'#192327',line:'#34464c',muted:'#81969c',text:'#edf6f4',accent:'#76e0cf',blue:'#9abfff'};
const rect = (x,y,w,h,opts='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${opts}/>`;
const text = (x,y,value,size=24,opts='') => `<text x="${x}" y="${y}" ${/\bfill=/.test(opts)?'':`fill="${c.text}"`} font-size="${size}" ${opts}>${value}</text>`;
const badge = (x,y,n) => `<circle cx="${x}" cy="${y}" r="25" fill="${c.accent}" stroke="${c.bg}" stroke-width="5"/>${text(x,y+8,n,24,'text-anchor="middle" font-weight="700" fill="#101619"')}`;
const outline = (x,y,w,h) => rect(x,y,w,h,`rx="12" fill="none" stroke="${c.accent}" stroke-width="3"`);
const row = (x,y,w) => rect(x,y,w,7,`rx="3.5" fill="${c.line}"`);
const folder = (x,y,fill=c.line) => `<path d="M${x} ${y+9}V${y+4}Q${x} ${y} ${x+5} ${y}H${x+28}L${x+37} ${y+9}H${x+61}Q${x+66} ${y+9} ${x+66} ${y+15}V${y+45}Q${x+66} ${y+50} ${x+60} ${y+50}H${x+6}Q${x} ${y+50} ${x} ${y+44}Z" fill="${fill}"/>`;
const file = (x,y,scale=1,fill=c.line) => `<path transform="translate(${x} ${y}) scale(${scale})" d="M0 0H36L52 16V68H0Z" fill="${fill}"/><path transform="translate(${x} ${y}) scale(${scale})" d="M36 0V16H52" fill="none" stroke="${c.muted}" stroke-width="2"/>`;
const arrow = (x1,y1,x2,y2,color=c.accent) => `<path d="M${x1} ${y1}H${x2-14}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/><path d="M${x2-14} ${y2-9}L${x2} ${y2}L${x2-14} ${y2+9}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
const check = (x,y) => `<circle cx="${x}" cy="${y}" r="19" fill="${c.accent}"/><path d="M${x-8} ${y}L${x-2} ${y+6}L${x+9} ${y-7}" fill="none" stroke="${c.bg}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="600" viewBox="0 0 1120 600" fill="none"><g font-family="Arial, Helvetica, sans-serif">${rect(0,0,1120,600,`rx="24" fill="${c.bg}"`)}${body}</g></svg>\n`;

const network = wrap(
  // One shared local network; the console hosts the service, the other device connects.
  `<path d="M240 270H470M650 270H855" stroke="${c.line}" stroke-width="4" stroke-dasharray="9 9"/>`+
  `<circle cx="560" cy="270" r="87" fill="${c.panel}" stroke="${c.line}" stroke-width="2"/>`+
  `<path d="M511 255Q560 209 609 255M526 274Q560 242 594 274M543 293Q560 277 577 293" stroke="${c.accent}" stroke-width="8" stroke-linecap="round"/><circle cx="560" cy="311" r="6" fill="${c.accent}"/>`+
  badge(560,158,1)+
  rect(70,182,265,173,`rx="15" fill="${c.panel}" stroke="${c.line}" stroke-width="3"`)+
  rect(88,201,229,132,`rx="5" fill="${c.bg}"`)+
  `<path d="M50 367H355L337 387H68Z" fill="${c.line}"/>`+
  text(203,276,'FTP',36,'text-anchor="middle" font-weight="700"')+
  badge(319,183,4)+
  rect(858,173,130,210,`rx="17" fill="${c.panel}" stroke="${c.line}" stroke-width="3"`)+
  `<path d="M881 192V363M964 192V363" stroke="${c.line}" stroke-width="3"/><circle cx="922" cy="351" r="5" fill="${c.accent}"/>`+
  text(923,268,'PS4',26,'text-anchor="middle" font-weight="700"')+
  text(923,302,'/ PS5',26,'text-anchor="middle" font-weight="700"')+
  badge(988,173,2)+
  rect(665,436,385,102,`rx="16" fill="${c.panel}"`)+outline(665,436,385,102)+
  text(694,477,'192.168.1.50',26,'font-family="monospace"')+
  text(694,515,'2121',26,'font-family="monospace" fill="#76e0cf"')+
  badge(1036,438,3)+
  `<path d="M922 389V425" stroke="${c.line}" stroke-width="3"/>`+
  text(203,470,'PS4 / PS5',25,'text-anchor="middle" fill="#81969c"')
);

const filezilla = wrap(
  rect(41,35,1038,530,`rx="15" fill="${c.panel}" stroke="${c.line}" stroke-width="2"`)+
  text(66,75,'FileZilla',24,'font-weight="700"')+
  rect(60,99,1000,77,`rx="9" fill="${c.bg}"`)+
  rect(78,119,271,39,`rx="5" fill="${c.panel}"`)+text(92,147,'192.168.1.50',24,'font-family="monospace"')+
  rect(361,119,170,39,`rx="5" fill="${c.panel}"`)+row(377,136,97)+
  rect(543,119,170,39,`rx="5" fill="${c.panel}"`)+row(559,136,97)+
  rect(725,119,116,39,`rx="5" fill="${c.panel}"`)+text(739,147,'2121',24,'font-family="monospace"')+
  rect(856,119,187,39,`rx="5" fill="${c.accent}"`)+
  outline(60,99,1000,77)+badge(1049,100,1)+
  rect(60,202,476,229,`rx="10" fill="${c.bg}"`)+
  rect(563,202,497,229,`rx="10" fill="${c.bg}"`)+
  folder(88,230)+row(172,241,215)+row(172,259,138)+
  file(92,309,.78)+text(152,345,'example.zip',25,'font-family="monospace"')+
  outline(77,300,430,94)+badge(86,207,2)+
  folder(589,230)+text(671,265,'/data/transfer',26,'font-family="monospace"')+
  outline(579,219,463,68)+badge(1037,207,3)+
  arrow(487,347,606,347)+
  file(625,310,.78,c.accent)+text(687,347,'example.zip',25,'font-family="monospace"')+
  rect(60,455,1000,89,`rx="10" fill="${c.bg}"`)+
  text(83,495,'example.zip',25,'font-family="monospace"')+
  rect(394,484,502,14,`rx="7" fill="${c.line}"`)+
  rect(394,484,502,14,`rx="7" fill="${c.accent}"`)+check(973,492)+
  outline(60,455,1000,89)+badge(1049,455,4)
);

const phoneFrame = (x,body) => rect(x,57,258,476,`rx="36" fill="${c.panel}" stroke="${c.line}" stroke-width="3"`)+rect(x+13,72,232,444,`rx="25" fill="${c.bg}"`)+rect(x+87,83,84,8,`rx="4" fill="${c.line}"`)+rect(x+91,495,76,5,`rx="2.5" fill="${c.line}"`)+body;
const phone = wrap(
  phoneFrame(63,
    folder(92,139)+row(173,151,103)+row(173,169,78)+
    file(100,245,1.05,c.accent)+text(89,361,'example.zip',25,'font-family="monospace"')+
    outline(81,222,221,164)+badge(73,222,1))+
  arrow(344,295,386,295)+
  phoneFrame(430,
    text(459,154,'FTP',30,'font-weight="700"')+
    rect(448,189,221,62,`rx="8" fill="${c.panel}"`)+text(459,227,'192.168.1.50',23,'font-family="monospace"')+
    rect(448,269,221,56,`rx="8" fill="${c.panel}"`)+text(459,305,'2121',24,'font-family="monospace"')+
    outline(447,176,223,163)+badge(439,176,2)+
    rect(449,370,219,57,`rx="11" fill="${c.accent}"`)+
    `<path d="M543 398H573M563 389L573 398L563 407" stroke="${c.bg}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`)+
  arrow(710,295,752,295)+
  phoneFrame(797,
    text(823,154,'FTP',30,'font-weight="700"')+
    folder(825,199)+text(820,282,'/data/transfer',23,'font-family="monospace"')+
    outline(815,184,221,111)+badge(806,184,3)+
    file(828,331,.8,c.accent)+text(819,431,'example.zip',24,'font-family="monospace"')+
    check(997,365)+badge(1035,439,4))
);

const usb = wrap(
  // Both copies remain visible: the arrow represents a copy, not a move.
  rect(55,73,336,443,`rx="18" fill="${c.panel}" stroke="${c.line}" stroke-width="2"`)+
  `<path d="M166 120H258V144H270V221H154V144H166Z" fill="${c.line}"/><path d="M176 120V153H247V120M183 135H190M225 135H232" stroke="${c.accent}" stroke-width="4" stroke-linecap="round"/>`+
  text(212,269,'USB',29,'text-anchor="middle" font-weight="700"')+
  file(99,328,.75,c.accent)+text(151,362,'example.zip',25,'font-family="monospace"')+
  outline(78,310,292,81)+badge(75,310,1)+
  rect(694,73,371,443,`rx="18" fill="${c.panel}" stroke="${c.line}" stroke-width="2"`)+
  text(879,119,'PS4 / PS5',29,'text-anchor="middle" font-weight="700"')+
  folder(721,166)+text(803,201,'/mnt/usb0',25,'font-family="monospace"')+
  outline(711,152,337,78)+badge(1042,154,2)+
  `<path d="M746 233V291H781" stroke="${c.line}" stroke-width="3"/>`+
  folder(790,265)+row(874,278,130)+row(874,295,83)+
  folder(720,345,c.accent)+text(802,381,'/data/transfer',24,'font-family="monospace"')+
  outline(711,333,337,77)+badge(1042,335,3)+
  file(795,435,.66,c.accent)+text(845,467,'example.zip',24,'font-family="monospace"')+
  check(1014,452)+badge(1045,505,4)+
  arrow(411,347,670,347)+
  `<path d="M464 289H514L530 305V365H464Z" fill="${c.bg}" stroke="${c.accent}" stroke-width="3"/><path d="M488 275H540L555 290V351" fill="${c.bg}" stroke="${c.accent}" stroke-width="3"/>`
);

fs.mkdirSync(output,{recursive:true});
for (const [name,svg] of Object.entries({'ftp-connection':network,'filezilla-transfer':filezilla,'phone-ftp':phone,'usb-file-manager':usb})) {
  fs.writeFileSync(path.join(output,name+'.svg'),svg);
  console.log('Built '+name+'.svg');
}
