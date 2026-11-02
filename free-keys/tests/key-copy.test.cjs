const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../key.js'), 'utf8');
const issuedKey = 'SCOOBY-FIXTURE-ISSUED-KEY';

async function page({native = true, fallback = false, grant = true} = {}) {
    const nodes = new Map(), nativeCopies = [], fallbackCopies = [], selected = [], timers = [];
    let document;
    function node(tag, id = '') {
        const classes = new Set();
        const element = {tagName:tag.toUpperCase(), id, textContent:'', value:'', disabled:true, style:{}, children:[], attributes:{}, listeners:{},
            classList:{add(...names){names.forEach(name=>classes.add(name));}, remove(...names){names.forEach(name=>classes.delete(name));}, contains(name){return classes.has(name);}, toggle(name){if(classes.has(name)){classes.delete(name);return false;}classes.add(name);return true;}},
            setAttribute(name,value){this.attributes[name]=String(value);},
            addEventListener(name,fn){this.listeners[name]=fn;},
            appendChild(child){this.children.push(child);},
            insertAdjacentElement(position,child){assert.equal(position,'afterend');nodes.set(child.id,child);},
            focus(){document.activeElement=this;}, select(){this.selected=true;}, setSelectionRange(start,end){this.selection=[start,end];},
            remove(){this.removed=true;}, closest(){return null;}, replaceChildren(){}};
        if(id)nodes.set(id,element);
        return element;
    }
    ['blockedContent','keyContent','providerLink','productName','productBlurb','scopeProduct','productArt','brandHome','keyOutput','copyButton','timerText','timerFill','blockMessage','revealButton'].forEach(id=>node('div',id));
    document={body:node('body'),activeElement:null,getElementById:id=>nodes.get(id)||null,addEventListener(){},createElement:tag=>node(tag),
        execCommand(command){assert.equal(command,'copy'); const field=document.activeElement; fallbackCopies.push({value:field.value,selected:field.selected,range:field.selection}); if(fallback instanceof Error)throw fallback; return fallback;},
        createRange(){return {selectNodeContents(element){this.element=element;}};}};
    document.body.dataset={brand:'scooby'};
    const storage=new Map();
    if(grant)storage.set('scooby_one_time_grant_scooby',JSON.stringify({product:'scooby',token:'fixture',issuedAt:Date.now()-1000,expiresAt:Date.now()+60000}));
    const sessionStorage={getItem:key=>storage.get(key),setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
    const url=new URL('https://site.test/free-keys/scooby/?grant=fixture');
    const navigator={clipboard:{async writeText(value){nativeCopies.push(value);if(!native)throw Error('Permission denied');}}};
    const context={URL,URLSearchParams,Date,AbortController,console,document,navigator,sessionStorage,localStorage:sessionStorage,
        location:{href:url.href,search:url.search,replace(){}},history:{replaceState(){}},addEventListener(){},
        SCOOBY_ACCESS_KEY_CONFIG:{apiBase:'https://api.test',portalKey:'fixture-portal'},
        freeKeyAccess:{requireClear:()=>Promise.resolve()},
        setInterval(){},setTimeout(fn,ms){timers.push({fn,ms});return timers.length;},clearTimeout(){},
        getSelection:()=>({removeAllRanges(){selected.length=0;},addRange(range){selected.push(range.element);}}),
        fetch:async(url)=>({ok:true,json:async()=> url.includes('/access-key-policies/')?{success:true,policy:{integration_id:'fixture'}}:
            url.endsWith('/access-keys/challenge')?{success:true,challenge:{id:'fixture',turnstile_required:false}}:
            {success:true,key:issuedKey,expires_at:new Date(Date.now()+60000).toISOString()}})};
    context.window=context;
    vm.runInNewContext(source,context);
    await new Promise(setImmediate);
    return {document,nodes,nativeCopies,fallbackCopies,selected,timers,copy:()=>nodes.get('copyButton').listeners.click()};
}

test('native copy uses the issued key even while the displayed key is masked',async()=>{
    const fixture=await page();
    fixture.nodes.get('keyOutput').textContent='••••••••';
    assert.equal(await fixture.copy(),true);
    assert.deepEqual(fixture.nativeCopies,[issuedKey]);
    assert.equal(fixture.fallbackCopies.length,0);
    assert.equal(fixture.nodes.get('copyButton').textContent,'Copied');
    assert.equal(fixture.nodes.get('keyCopyStatus').textContent,'Key copied.');
});

test('denied native clipboard uses a selected issued-key fallback and reports its actual success',async()=>{
    const fixture=await page({native:false,fallback:true});
    assert.equal(await fixture.copy(),true);
    assert.equal(fixture.fallbackCopies[0].value,issuedKey);
    assert.equal(fixture.fallbackCopies[0].selected,true);
    assert.deepEqual(fixture.fallbackCopies[0].range,[0,issuedKey.length]);
    assert.equal(fixture.nodes.get('copyButton').textContent,'Copied');
    assert.equal(fixture.document.body.children[0].removed,true);
    assert.equal(fixture.document.activeElement,fixture.nodes.get('copyButton'));
});

test('failed clipboard fallback reveals and selects the actual key with honest manual-copy instructions',async()=>{
    const fixture=await page({native:false,fallback:false});
    fixture.nodes.get('keyOutput').textContent='••••••••';
    assert.equal(await fixture.copy(),false);
    const output=fixture.nodes.get('keyOutput');
    assert.equal(output.textContent,issuedKey);
    assert.equal(output.classList.contains('revealed'),true);
    assert.equal(fixture.nodes.get('revealButton').attributes['aria-pressed'],'true');
    assert.equal(fixture.nodes.get('revealButton').textContent,'Hide');
    assert.deepEqual(fixture.selected,[output]);
    assert.equal(fixture.document.activeElement,output);
    assert.equal(fixture.nodes.get('copyButton').textContent,'Copy Scooby key');
    assert.match(fixture.nodes.get('keyCopyStatus').textContent,/Copying was blocked.*Touch and hold/);
    assert.equal(fixture.document.body.children[0].removed,true);
    assert.equal(fixture.timers.some(timer=>timer.ms===1600),false);
});

test('an unsupported fallback also gives manual-copy instructions and never reports success',async()=>{
    const fixture=await page({native:false,fallback:new Error('Unsupported')});
    assert.equal(await fixture.copy(),false);
    assert.notEqual(fixture.nodes.get('copyButton').textContent,'Copied');
    assert.match(fixture.nodes.get('keyCopyStatus').textContent,/Copying was blocked/);
});

test('a page without its one-time grant cannot copy or reveal an unissued key',async()=>{
    const fixture=await page({grant:false});
    assert.equal(fixture.nodes.get('copyButton').listeners.click,undefined);
    assert.equal(fixture.nativeCopies.length,0);
    assert.equal(fixture.fallbackCopies.length,0);
    assert.equal(fixture.nodes.has('keyCopyStatus'),false);
});
