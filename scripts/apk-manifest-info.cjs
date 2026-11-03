'use strict';
// Bounded ZIP/Android binary XML inspection, never executable evaluation.
const zlib=require('node:zlib');
function manifestInfo(bytes){
 const end=bytes.lastIndexOf(Buffer.from('504b0506','hex'));if(end<0)throw Error('APK ZIP directory missing');
 let at=bytes.readUInt32LE(end+16),xml;
 for(let n=0;n<bytes.readUInt16LE(end+10);n++){
  if(bytes.readUInt32LE(at)!==0x02014b50)throw Error('Invalid APK ZIP directory');
  const size=bytes.readUInt32LE(at+24),packed=bytes.readUInt32LE(at+20),nameLength=bytes.readUInt16LE(at+28),name=bytes.subarray(at+46,at+46+nameLength).toString();
  if(name==='AndroidManifest.xml'){
   if(size>2*1024*1024)throw Error('Manifest too large');const local=bytes.readUInt32LE(at+42),start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28),raw=bytes.subarray(start,start+packed);
   const method=bytes.readUInt16LE(at+10);xml=method===8?zlib.inflateRawSync(raw,{maxOutputLength:2*1024*1024}):method===0?raw:null;if(!xml||xml.length!==size)throw Error('Unsupported manifest container');break;
  }
  at+=46+nameLength+bytes.readUInt16LE(at+30)+bytes.readUInt16LE(at+32);
 }
 if(!xml||xml.readUInt16LE(0)!==3)throw Error('Binary Android manifest missing');
 let strings=[];const result={};
 for(let pos=xml.readUInt16LE(2);pos+8<=xml.length;){
  const type=xml.readUInt16LE(pos),header=xml.readUInt16LE(pos+2),size=xml.readUInt32LE(pos+4);if(size<8||pos+size>xml.length)throw Error('Invalid Android XML chunk');
  if(type===1){
   const count=xml.readUInt32LE(pos+8),utf8=!!(xml.readUInt32LE(pos+16)&0x100),start=pos+xml.readUInt32LE(pos+20);if(count>100000)throw Error('String pool too large');
   for(let i=0;i<count;i++){let p=start+xml.readUInt32LE(pos+header+4*i);if(utf8){const len=()=>{let n=xml[p++];return n&0x80?((n&0x7f)<<8)|xml[p++]:n;};len();const n=len();strings.push(xml.subarray(p,p+n).toString('utf8'));}else{let n=xml.readUInt16LE(p);p+=2;if(n&0x8000){n=((n&0x7fff)<<16)|xml.readUInt16LE(p);p+=2;}strings.push(xml.subarray(p,p+2*n).toString('utf16le'));}}
  }else if(type===0x102&&strings[xml.readUInt32LE(pos+20)]==='manifest'){
   const start=pos+16+xml.readUInt16LE(pos+24),step=xml.readUInt16LE(pos+26),count=xml.readUInt16LE(pos+28);if(step<20)throw Error('Invalid attribute size');
   for(let i=0;i<count;i++){const p=start+i*step;if(p+20>pos+size)throw Error('Invalid manifest attribute');const key=strings[xml.readUInt32LE(p+4)],raw=xml.readUInt32LE(p+8),type=xml[p+15],data=xml.readUInt32LE(p+16);if(['package','versionName','versionCode'].includes(key))result[key]=raw!==0xffffffff?strings[raw]:type===3?strings[data]:data;}
   if(!result.package)throw Error('APK package identity missing');return result;
  }
  pos+=size;
 }
 throw Error('Manifest element missing');
}
module.exports={manifestInfo};
