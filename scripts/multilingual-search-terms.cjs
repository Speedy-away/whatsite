const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {concepts}=require('../i18n-tools/discovery-concepts.cjs');
const codes=['es','pt','fr','de','ru','tr','pl','it','zh','ja','ko','th','vi','id','hi','sr','nl','ka','ar','he'];
let dictionaries;
function tables(){
 if(!dictionaries)dictionaries=codes.map(code=>{
  const box={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../languages',code+'.js'),'utf8'),box,{timeout:1000});
  const table=box.window.__scoobyI18nQueue?.find(row=>row[0]===code)?.[1];if(!table)throw Error('Missing discovery dictionary: '+code);
  return {code,table};
 });
 return dictionaries;
}
function localizedTerms(value){
 const selected=concepts.filter(concept=>concept.pattern.test(value));if(!selected.length)return [];
 const translated=selected.flatMap(concept=>tables().map(({code,table})=>{
  const translated=table[concept.key];if(!translated)throw Error('Missing '+code+' search concept: '+concept.key);return translated;
 }));
 if(/\bwwb['’]s ps4 and ps5 game library\b/i.test(value)){
  for(const {table} of tables()) for(const platform of ['PS4','PS5']){
   translated.push(platform+' '+table['Game Downloads'],table['Game Downloads']+' '+platform);
  }
 }
 return [...new Set(translated)];
}
module.exports={localizedTerms,codes};
