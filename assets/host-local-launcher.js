/* Inert public chooser for an existing, ticket-guarded local native entry. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.HostLocalLauncher=api;api.install(root,root.document);}}(typeof window!=='undefined'?window:this,function(){
  'use strict';
  function config(data,location){
    if(!data||!data.entry||!Array.isArray(data.entry.firmwares)||!data.entry.firmwares.length||data.entry.firmwares.some(function(f){return !/^\d{1,2}\.\d{2}$/.test(f);})||!/^ps[45]$/.test(data.entry.platform||''))throw Error('The selected local route is unavailable.');
    if(!/^\/(?:WWB-HOST\/)?hosts\/runtime\/(?:karo|gamerhack)-[a-f0-9]{12}-[a-f0-9]{12}\/web\/$/.test(data.runtime||''))throw Error('Choose the preserved local runtime.');
    if(!/^[a-z0-9_-]+(?:\/[a-z0-9_-]+)*\/index\.html$/i.test(data.entry.path||'')||data.entry.scope!==data.entry.path.slice(0,-10))throw Error('The local entry path is invalid.');
    var base=new URL(data.runtime,location.href);if(base.origin!==location.origin||!/^https?:$/.test(base.protocol)||base.username||base.password||base.search||base.hash)throw Error('The runtime must stay on this host.');
    return {runtime:base.pathname,entry:data.entry};
  }
  function install(win,doc){
    var node=doc&&doc.getElementById('host-local-data');if(!node)return;
    var load=doc.getElementById('host-local-load'),confirm=doc.getElementById('host-local-confirm'),status=doc.getElementById('host-local-status'),restarted=doc.getElementById('host-local-restarted'),clear=doc.getElementById('host-local-clear'),guard=win.WhatsiteKaro,selected,restored=false;
    function say(message){status.textContent=message;}
    try{selected=config(JSON.parse(node.textContent),win.location);if(!guard||typeof guard.authorize!=='function'||typeof guard.clear!=='function')throw Error('The local entry guard is unavailable.');}catch(e){say(e.message);load.disabled=true;return;}
    function locked(){try{return !!win.localStorage.getItem(guard.LOCK);}catch(_){return true;}}
    function update(){var info=guard.consoleInfo(win.navigator.userAgent),matches=info&&info.platform===selected.entry.platform&&selected.entry.firmwares.indexOf(info.firmware)>=0;
      load.disabled=restored||!matches||!confirm.checked||locked();
      say(restored?'Restored page: open a fresh entry after checking the console.':locked()?'Previous native attempt saved. Check the console before clearing it.':matches?'Detected '+info.platform.toUpperCase()+' '+info.firmware+'. Choose Load when ready.':'Load requires the matching console browser and exact installed firmware.');
      clear.disabled=!restarted.checked;
    }
    confirm.addEventListener('change',update);restarted.addEventListener('change',update);
    load.addEventListener('click',function(event){
      if(load.disabled)return;
      try{var info=guard.consoleInfo(win.navigator.userAgent);if(!info||info.platform!==selected.entry.platform||selected.entry.firmwares.indexOf(info.firmware)<0)throw Error('Choose the route matching the installed console firmware.');var target=guard.authorize(win,selected.entry,selected.runtime,confirm.checked,event.isTrusted===true);load.disabled=true;win.location.href=target;}catch(e){load.disabled=true;say(e.message);}
    });
    clear.addEventListener('click',function(){try{guard.clear(win,restarted.checked);confirm.checked=false;restarted.checked=false;update();}catch(e){say(e.message);}});
    win.addEventListener('pageshow',function(e){if(e.persisted){restored=true;update();}});update();
  }
  return {config:config,install:install};
}));
