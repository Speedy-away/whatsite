// Local guide choices only; this never connects to or controls a console.
(function(){
  'use strict';
  var methodChoices=document.querySelectorAll('[data-choose-method]');
  var deviceChoices=document.querySelectorAll('[data-choose-device]');
  var phoneChoices=document.querySelectorAll('[data-choose-phone]');
  var panels=document.querySelectorAll('[data-transfer-method]');
  function stateFromLocation(){
    var hash=location.hash.slice(1),params=new URLSearchParams(location.search);
    var method=params.get('method'),device=params.get('device'),phone=params.get('phone');
    if(/^(usb|file-manager)$/.test(hash))method='usb';
    if(/^(ftp|ftp-server|ftp-device|filezilla|phone|ios|android|harmony)$/.test(hash))method='ftp';
    if(hash==='filezilla')device='computer';
    if(/^(phone|ios|android|harmony)$/.test(hash))device='phone';
    if(/^(ios|android|harmony)$/.test(hash))phone=hash;
    return {
      method:/^(ftp|usb)$/.test(method)?method:null,
      device:/^(computer|phone)$/.test(device)?device:null,
      phone:/^(ios|android|harmony)$/.test(phone)?phone:null
    };
  }
  function mark(choices,key,value){
    choices.forEach(function(choice){
      var active=choice.dataset[key]===value;
      choice.classList.toggle('is-selected',active);
      if(active)choice.setAttribute('aria-current','true');else choice.removeAttribute('aria-current');
    });
  }
  function apply(){
    var state=stateFromLocation();
    panels.forEach(function(panel){
      panel.hidden=panel.dataset.transferMethod!==state.method ||
        (Boolean(panel.dataset.ftpDevice) && panel.dataset.ftpDevice!==state.device);
    });
    document.querySelectorAll('[data-phone-platform]').forEach(function(panel){
      panel.hidden=state.method!=='ftp'||state.device!=='phone'||panel.dataset.phonePlatform!==state.phone;
    });
    document.querySelectorAll('[data-transfer-shared]').forEach(function(panel){panel.hidden=!state.method;});
    mark(methodChoices,'chooseMethod',state.method);
    mark(deviceChoices,'chooseDevice',state.device);
    mark(phoneChoices,'choosePhone',state.phone);
  }
  function showTarget(hash){
    var target=document.getElementById(hash.slice(1));
    if(!target)return;
    target.scrollIntoView({block:'start'});
    var heading=target.querySelector('h2,h3');
    if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
  }
  document.addEventListener('click',function(event){
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    var link=event.target.closest('a[href]');
    if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
    var url;try{url=new URL(link.href,location.href);}catch(error){return;}
    if(url.origin!==location.origin||url.pathname!==location.pathname)return;
    if(!/^#(choose|ftp|ftp-server|ftp-device|filezilla|phone|ios|android|harmony|usb|file-manager)$/.test(url.hash))return;
    event.preventDefault();
    history.pushState(null,'',url.href);apply();showTarget(url.hash);
  });
  window.addEventListener('popstate',apply);
  window.addEventListener('hashchange',function(){apply();showTarget(location.hash);});
  if(methodChoices.length){apply();if(location.hash)showTarget(location.hash);}
})();
