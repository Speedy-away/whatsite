// All guide prose and annotated-menu labels, authored in the 20 supported locales.
const fs=require('node:fs'),path=require('node:path');
const source=require('./transfer-guide-source.json');
const codes=['es','pt','fr','de','ru','tr','pl','it','zh','ja','ko','th','vi','id','hi','sr','nl','ka','ar','he'];
const table={};
for(const code of codes){
 const translated=JSON.parse(fs.readFileSync(path.join(__dirname,'transfer-guide-locales',code+'.json'),'utf8'));
 for(const [id,value]of Object.entries(source)){
  if(typeof translated[id]!=='string'||!translated[id].trim())throw Error('Missing transfer-guide translation: '+code+'/'+id);
  (table[value]||={})[code]=translated[id];
 }
 for(const id of ['ps4Title','ps5Title','downloads'])(table[source[id]+' | whatwhatboy']||={})[code]=translated[id]+' | whatwhatboy';
 for(const id of ['ps4Title','ps5Title'])(table[source[id]+' artwork']||={})[code]=translated[id];
}
module.exports=table;
