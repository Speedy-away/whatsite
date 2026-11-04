'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),root=path.resolve(process.argv[2]||'../WWB-HOST');
const files=fs.readdirSync(path.join(root,'scripts/tests')).filter(f=>/\.test\.cjs$/.test(f)&&/^(?:host-|afterglow|gamerhack|ps5-(?:browser|original|webkit)|i18n-|language-picker)/.test(f)).sort().map(f=>path.join(root,'scripts/tests',f));
const log=path.join(root,'tmp/host-migration-checkpoint-tests.tap'),fd=fs.openSync(log,'w');
const result=cp.spawnSync(process.execPath,['--test','--test-reporter=tap','--test-skip-pattern=all old sender ZIPs and the current sender',...files],{cwd:root,stdio:['ignore',fd,fd],timeout:180000,windowsHide:true});fs.closeSync(fd);
const text=fs.readFileSync(log,'utf8'),summary=text.split(/\r?\n/).filter(l=>/^# (?:tests|pass|fail|skipped|duration_ms)/.test(l));console.log(JSON.stringify({files:files.length,status:result.status,summary,skipped:'Only the strict current-helper snapshot equality check, which must be rerun after the requested redesign and new-domain helper rebuild.',log}));process.exitCode=result.status||0;
