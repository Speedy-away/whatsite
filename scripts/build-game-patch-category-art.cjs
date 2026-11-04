// Extend the site's existing self-contained SVG category artwork system.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const sources=[['bloodborne-official.jpg','Bloodborne'],['red-dead-redemption-2-official.jpg','Red Dead Redemption 2'],['god-of-war-official.jpg','God of War']];
const images=sources.map(([name,alt])=>({src:'/assets/images/game-patches/'+name,alt}));
const embedded=images.map(image=>'data:image/jpeg;base64,'+fs.readFileSync(path.join(root,image.src.slice(1))).toString('base64'));
// The square Bloodborne art fills the left panel; two landscape covers fill the right.
// Each panel clips independently, so there are no padded card-wide side margins.
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><title>Bloodborne, Red Dead Redemption 2 and God of War game patches</title><defs><clipPath id="bloodborne"><rect width="480" height="540"/></clipPath><clipPath id="rdr2"><rect x="480" width="480" height="270"/></clipPath><clipPath id="godofwar"><rect x="480" y="270" width="480" height="270"/></clipPath></defs><image width="480" height="540" preserveAspectRatio="xMidYMid slice" clip-path="url(#bloodborne)" href="${embedded[0]}"/><image x="480" width="480" height="270" preserveAspectRatio="xMinYMid slice" clip-path="url(#rdr2)" href="${embedded[1]}"/><image x="480" y="270" width="480" height="270" preserveAspectRatio="xMidYMid slice" clip-path="url(#godofwar)" href="${embedded[2]}"/></svg>`;
const imagePath='/assets/images/category-composites/game-patches-20261104.svg';
fs.writeFileSync(path.join(root,imagePath.slice(1)),svg);
const sha256=crypto.createHash('sha256').update(svg).digest('hex');
const categoryFile=path.join(root,'docs/category-card-art.json'),compositeFile=path.join(root,'docs/category-composite-covers.json');
const category=JSON.parse(fs.readFileSync(categoryFile)),composite=JSON.parse(fs.readFileSync(compositeFile));
for(const platform of ['ps4','ps5']){
 const route=`/console/${platform}/game-patches.html`;
 category.destinations[route]={title:'Game patches',kind:'games',images};
 composite.routes[route]={id:'game-patches-20261104',path:imagePath,width:960,height:540,bytes:Buffer.byteLength(svg),sha256,title:'Game patches',alt:'Bloodborne, Red Dead Redemption 2 and God of War game patch artwork',sourceImages:images.map(i=>i.src)};
}
fs.writeFileSync(categoryFile,JSON.stringify(category,null,2)+'\n');fs.writeFileSync(compositeFile,JSON.stringify(composite,null,2)+'\n');
for(const platform of ['ps4','ps5']){
 const page=`console/${platform}/index.html`,file=path.join(root,page),before=fs.readFileSync(file,'utf8');
 const after=require('./category-card-art.cjs').apply(page,before);
 if(before!==after)fs.writeFileSync(file,after);
}
console.log(JSON.stringify({image:imagePath,width:960,height:540,sha256,pages:['console/ps4/index.html','console/ps5/index.html']}));
