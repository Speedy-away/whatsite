'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const data=require('../../docs/ps4-ps5-game-patches.json'),coverage=require('../../docs/ps4-ps5-game-patch-coverage.json'),baseline=require('../../docs/qa/game-patches-complete-baseline.json');
const {unzip,metadata}=require('../prepare-console-game-patches.cjs');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const archive=new Map(unzip(fs.readFileSync('.'+data.archive.local)).map(entry=>[entry.name,entry.bytes]));
test('the complete catalogue covers all 169 linked XMLs and all five additional PS5 source definitions',()=>{
 assert.equal(coverage.sources.filter(row=>row.sourcePath.startsWith('patches/xml/')).length,169);
 assert.equal(coverage.sources.filter(row=>row.sourcePath.startsWith('patches/xml_prospero/')).length,5);
 assert.equal(new Set(coverage.sources.map(row=>row.sourcePath)).size,174);
 for(const row of coverage.sources){const game=data.games.find(game=>game.id===row.gameId);assert.ok(game,row.sourcePath);assert.equal(game.sourcePath,row.sourcePath);assert.equal(game.catalogueOptions.length,row.optionCount);assert.deepEqual([...game.titleIds].sort(),[...row.titleIds].sort());}
});
test('every source option is exposed and every ready file preserves the pinned release bytes',()=>{
 for(const game of data.games){const options=[];for(const file of game.files){const bytes=archive.get(file.archiveEntry);assert.ok(bytes,file.filename);assert.equal(hash(bytes),file.sha256);assert.equal(hash(fs.readFileSync('.'+file.downloadLocal)),file.sha256);for(const option of metadata(bytes.toString()))if(!options.some(old=>JSON.stringify(old)===JSON.stringify(option)))options.push(option);}
 assert.deepEqual(new Set(game.catalogueOptions.map(JSON.stringify)),new Set(options.map(JSON.stringify)),game.title);}
});
test('expansion retains all previous game, resource and download identities and exact bytes',()=>{
 for(const before of baseline.games){const game=data.games.find(game=>game.id===before.id);assert.ok(game);for(const old of before.files)assert.ok(game.files.some(file=>file.downloadId===old.downloadId&&file.sha256===old.sha256&&file.local===old.local));}
 for(const before of baseline.resources)assert.ok(data.resources.some(file=>file.id===before.id&&file.sha256===before.sha256&&file.local===before.local),before.id);
});
test('PPSA title IDs take precedence over source folder names for native PS5 placement',()=>{
 const game=data.games.find(game=>game.sourceFile==='GhostOfYotei.xml');assert.equal(game.sourcePath,'patches/xml/GhostOfYotei.xml');assert.equal(game.arch,'prospero');assert.deepEqual(game.platforms,['ps5']);
 for(const game of data.games.filter(game=>game.arch==='prospero'))assert.ok(game.titleIds.every(id=>id.startsWith('PPSA')));
 assert.ok(!fs.readFileSync('console/ps4/game-patches.html','utf8').includes('id="ghost-of-yotei"'));
 assert.ok(fs.readFileSync('console/ps5/game-patches.html','utf8').includes('id="ghost-of-yotei"'));
});
test('all patch entries have real game artwork with recorded hashes and no SVG placeholders',()=>{
 const images=require('../../docs/ps4-ps5-game-patch-images.json').images;
 for(const game of data.games){assert.ok(game.image&&!game.image.endsWith('.svg'),game.title);const image=images[game.id];assert.ok(image,game.title);assert.equal(image.image,game.image);const bytes=fs.readFileSync('.'+game.image);assert.equal(bytes.length,image.bytes);assert.equal(hash(bytes),image.sha256);}
});
test('both platform hubs have a persistent game-patch entry and their catalogues expose every applicable game',()=>{
 const apply=require('../console-game-patch-navigation.cjs').apply;
 for(const platform of ['ps4','ps5']){const file='console/'+platform+'/index.html',hub=fs.readFileSync(file,'utf8'),html=fs.readFileSync('console/'+platform+'/game-patches.html','utf8');assert.ok(hub.includes('data-game-patches-entry'));assert.ok(hub.includes('href="/console/'+platform+'/game-patches.html"'));assert.equal(apply(file,hub),hub);for(const game of data.games.filter(game=>game.platforms.includes(platform)))assert.ok(html.includes('id="'+game.id+'"'),game.id);assert.ok(html.includes('value="gameplay"'));assert.ok(html.indexOf('id="catalogue"')<html.indexOf('id="setup"'));}
});
