'use strict';
const destination='/pages/pc-mods-selector.html';
function redirect(code='en'){
 const lang=/^[a-z]{2}(?:-[A-Za-z]{2})?$/.test(code)?code:'en';
 return '<!doctype html>\n<html lang="'+lang+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, follow"><title>PC</title><link rel="canonical" href="https://whatwhatboy.com'+destination+'"><script>location.replace('+JSON.stringify(destination)+'+location.search+location.hash);</script><meta http-equiv="refresh" content="0; url='+destination+'"></head><body><a href="'+destination+'">PC →</a></body></html>\n';
}
module.exports={destination,redirect};
