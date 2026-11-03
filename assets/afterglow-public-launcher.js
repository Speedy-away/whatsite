/* Public route adapter only. The isolated landing retains every native guard. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.AfterglowPublicLauncher=api;api.install(root.document,root);}}(typeof window!=='undefined'?window:this,function(){
  'use strict';
  function destination(entry,location){
    if(typeof entry!=='string'||!/^\/(?:WWB-HOST\/)?hosts\/runtime\/ps4-afterglow-[a-f0-9]{12}\/web\/index\.html$/.test(entry))throw Error('The isolated Afterglow landing is unavailable.');
    var url=new URL(entry,location.href);
    if(!/^https?:$/.test(url.protocol)||url.origin!==location.origin||url.username||url.password||url.search||url.hash)throw Error('The isolated Afterglow landing must stay on this host.');
    return url.href;
  }
  function install(document,window){
    if(!document||!window||!window.location)return;
    var config=document.getElementById('afterglow-public-data'),status=document.getElementById('afterglow-public-status'),link=document.getElementById('afterglow-public-continue');
    if(!config||!status||!link)return;
    try{
      var data=JSON.parse(config.textContent),url=destination(data.entry,window.location);
      link.href=url;
      // This navigates only to the existing inert picker, never jb.html. Its
      // original PS4 firmware and opt-in autostart guards still own execution.
      window.location.replace(url);
    }catch(error){status.textContent=error.message;link.hidden=true;}
  }
  return {destination:destination,install:install};
}));
