
const {test}=require('node:test');
const assert=require('node:assert/strict');
const modulePromise=import('../../assets/game-library-search.mjs');
test('title abbreviations match their named games without matching unrelated titles',async()=>{
 const {extraSearchTerms,matchesSearchTerm}=await modulePromise;
 for(const [title,query] of [
  ['Need for Speed Underground 2','nfsu2'],['Resident Evil 4 HD','re4'],
  ['Final Fantasy VII Remake','ff7'],['Metal Gear Solid V The Phantom Pain','mgsv'],
  ['God of War III Remastered','gow3'],['Assassins Creed Brotherhood','acb'],
  ['Animal Crossing New Horizons','acnh'],['Monster Hunter 4 Ultimate','mh4u'],
  ['Pokémon Ultra Sun','pkmn'],['Super Mario Odyssey','smo']
 ])assert.ok(matchesSearchTerm(extraSearchTerms(title),query),title);
 for(const [title,query] of [['Resident Evil 5','re4'],['Final Fantasy VIII','ff7'],['Gears of War 3','gow3'],['Assassins Creed 2','acnh'],['re4ctor','re4']])
  assert.ok(!matchesSearchTerm(title.toLowerCase()+' '+extraSearchTerms(title),query),title);
});
test('genre keywords follow supplied labels and preserve ordinary partial searches',async()=>{
 const {extraSearchTerms,matchesSearchTerm}=await modulePromise;
 assert.ok(matchesSearchTerm(extraSearchTerms('Example',['RPG']),'roleplaying'));
 assert.ok(matchesSearchTerm(extraSearchTerms('Example',['Platformer']),'platforming'));
 assert.ok(matchesSearchTerm(extraSearchTerms('Example',['Simulation']),'simulator'));
 assert.ok(matchesSearchTerm(extraSearchTerms('Example',['Shooter','First-Person']),'fps'));
 assert.ok(!matchesSearchTerm(extraSearchTerms('Example',['Shooter']),'fps'));
 assert.ok(!matchesSearchTerm(extraSearchTerms('Example',['First-Person']),'fps'));
 assert.ok(!matchesSearchTerm(extraSearchTerms('Example',['RPG']),'jrpg'));
 assert.ok(matchesSearchTerm('resident evil','resid'));
});
