const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const sourceUrl='https://cdn.discordapp.com/attachments/1574345361458200596/1574345582862926005/WZSoftware.prx?ex=6b054f14&is=6b03fd94&hm=3b16364cf3831b36e3280188d9e3fd7bee9a594a652c7d7eefee0e46ac52d840&';
const expectedSha='7c6e6f0ee33a90662258c4b3faed57fae78bcefeba65699c212049f47569f06f';

test('WZSoftware remains pinned to PS4 GTA V 1.57 without inferred compatibility',()=>{
 const item=read('docs/ps4-ps5-game-resources.json').resources.find(x=>x.id==='gta5-wzsoftware-1-57');
 assert.ok(item);assert.deepEqual(item.platforms,['ps4']);assert.deepEqual(item.gameVersions,['1.57']);assert.deepEqual(item.titleIds,[]);
 assert.equal(item.version,'GTA V 1.57');assert.equal(item.menuVersion,null);assert.equal(item.source.postUrl,sourceUrl);assert.deepEqual(item.source.originalDownloadUrls,[sourceUrl]);
 assert.equal(item.images[0].original,'/assets/images/ps4-gta5/wzsoftware-user-preview.png');assert.equal(item.images[0].display,item.images[0].original);
 assert.equal(item.downloads.length,1);assert.equal(item.downloads[0].url,sourceUrl);assert.equal(item.downloads[0].bytes,1982912);assert.equal(item.downloads[0].sha256,expectedSha);
});

test('WZSoftware local PRX and supplied image match their recorded identities',()=>{
 const file=read('downloads/ps4-ps5/manifest.json').files.find(x=>x.downloadId==='gta5-wzsoftware-1-57');
 assert.ok(file);assert.equal(file.source,sourceUrl);assert.equal(file.gameVersion,'1.57');assert.equal(file.bytes,1982912);assert.equal(file.sha256,expectedSha);assert.equal(file.archived,true);
 const plugin=fs.readFileSync(path.join(root,'.'+file.local));assert.equal(plugin.length,file.bytes);assert.equal(sha(plugin),expectedSha);assert.equal(plugin.readUInt32LE(0),0x1d3d154f);
 const image=fs.readFileSync(path.join(root,'assets/images/ps4-gta5/wzsoftware-user-preview.png'));
 assert.equal(image.length,636765);assert.equal(sha(image),'91e789fd74ba11e7611bd6350f286ca1f347cccb3a10ad670769b848cf44519c');
 assert.deepEqual([...image.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.equal(image.readUInt32BE(16),930);assert.equal(image.readUInt32BE(20),544);
});

test('WZSoftware appears under GTA V 1.57 and in the PS4 menu directory',()=>{
 const html=fs.readFileSync(path.join(root,'console/mods/ps4/gta5/index.html'),'utf8');
 const start=html.indexOf('<section class="section" id="v157"'),end=html.indexOf('<section class="section" id="v156"',start);
 assert.ok(start>=0&&end>start);const section=html.slice(start,end);
 assert.equal((section.match(/id="resource-gta5-wzsoftware-1-57"/g)||[]).length,1);assert.ok(section.includes('/assets/images/ps4-gta5/wzsoftware-user-preview.png'));
 assert.ok(section.includes('/downloads/ps4/GTA5/157/wzsoftware/7c6e6f0ee33a/WZSoftware.prx'));assert.ok(section.includes('GTA V 1.57'));
 assert.ok(html.includes('id="guide-gta5-wzsoftware-1-57"'));
 const directory=fs.readFileSync(path.join(root,'console/mods/ps4/menus.html'),'utf8');
 assert.ok(directory.includes('<h3>WZSoftware</h3>'));assert.ok(directory.includes('/console/mods/ps4/gta5/#guide-gta5-wzsoftware-1-57'));
});

test('requested GTA V 1.57 menus lead the section in the requested order',()=>{
 const html=fs.readFileSync(path.join(root,'console/mods/ps4/gta5/index.html'),'utf8');
 const start=html.indexOf('<section class="section" id="v157"'),end=html.indexOf('<section class="section" id="v156"',start),section=html.slice(start,end);
 const ids=Array.from(section.matchAll(/id="resource-([^"]+)"/g),match=>match[1]);
 assert.deepEqual(ids.slice(0,4),['gta5-wzsoftware-1-57','gta5-nova-protocol-1-57','gta5-mag-extortion-reborn','gta5-mag-semjase']);
});
