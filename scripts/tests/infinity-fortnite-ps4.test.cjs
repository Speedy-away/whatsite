const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const sourceUrl='https://cdn.discordapp.com/attachments/1574333040732405760/1574333345389879376/infinity.prx?ex=6b05ec6f&is=6b049aef&hm=2fe906b189eb8dcfcee9c418cf30bd14b29e317b20267e1bc160c7789bd47eab&';
const expectedSha='11e6459cc264afba89cd62ada636c848a58c458eb55c56f39c514c0c911a0a13';

test('Infinity Mod Menu keeps only the supplied PS4 Fortnite compatibility facts',()=>{
 const item=read('docs/ps4-ps5-game-resources.json').resources.find(x=>x.id==='fortnite-infinity-mod-menu');
 assert.ok(item);assert.deepEqual(item.platforms,['ps4']);assert.deepEqual(item.gameIds,['fortnite']);assert.equal(item.description,'Aimbot, ESP, teleport and more.');
 assert.equal(item.gameVersions,undefined);assert.equal(item.titleIds,undefined);assert.equal(item.source.postUrl,sourceUrl);assert.deepEqual(item.source.originalDownloadUrls,[sourceUrl]);
 assert.deepEqual(item.featureTags,['Aimbot','ESP','Teleport']);assert.equal(item.images[0].original,'/assets/images/ps4-fortnite/infinity-mod-menu-user-preview.png');
 assert.equal(item.downloads.length,1);assert.equal(item.downloads[0].url,sourceUrl);assert.equal(item.downloads[0].bytes,5291824);assert.equal(item.downloads[0].sha256,expectedSha);
});

test('Infinity local PRX and supplied screenshot match their recorded identities',()=>{
 const file=read('downloads/ps4-ps5/manifest.json').files.find(x=>x.downloadId==='fortnite-infinity-mod-menu-prx');
 assert.ok(file);assert.equal(file.source,sourceUrl);assert.equal(file.bytes,5291824);assert.equal(file.sha256,expectedSha);assert.equal(file.archived,true);
 const plugin=fs.readFileSync(path.join(root,'.'+file.local));assert.equal(plugin.length,file.bytes);assert.equal(sha(plugin),expectedSha);assert.equal(plugin.readUInt32LE(0),0x1d3d154f);
 const image=fs.readFileSync(path.join(root,'assets/images/ps4-fortnite/infinity-mod-menu-user-preview.png'));
 assert.equal(image.length,884282);assert.equal(sha(image),'e873431bb2d56a7d414279ee4110633475ee34372ee8cf04eb440a401fd81552');
 assert.deepEqual([...image.subarray(0,8)],[137,80,78,71,13,10,26,10]);assert.equal(image.readUInt32BE(16),1041);assert.equal(image.readUInt32BE(20),685);
});

test('Infinity appears on the Fortnite page and in the PS4 menu directory',()=>{
 const html=fs.readFileSync(path.join(root,'console/mods/ps4/fortnite/index.html'),'utf8');
 assert.ok(html.includes('id="resource-fortnite-infinity-mod-menu"'));assert.ok(html.includes('/assets/images/ps4-fortnite/infinity-mod-menu-user-preview.png'));
 assert.ok(html.includes('/downloads/ps4/fortnite/11e6459cc264/infinity.prx'));assert.ok(html.includes('Aimbot, ESP, teleport and more.'));
 const directory=fs.readFileSync(path.join(root,'console/mods/ps4/menus.html'),'utf8');
 assert.ok(directory.includes('<h3>Infinity Mod Menu</h3>'));assert.ok(directory.includes('/console/mods/ps4/fortnite/#guide-fortnite-infinity-mod-menu'));
});
