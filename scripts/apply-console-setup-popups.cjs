const fs=require('node:fs'),path=require('node:path');
const {skipPath}=require('../assets/console-setup-popups.js');
const root=path.resolve(__dirname,'..');
function apply(file,html){const route='/'+file.replaceAll('\\','/');
  if(/^\/(?:[a-z]{2}\/)?console\/ps[45]\/jailbreaks\.html$/.test(route))return html.replace(/<script\b[^>]*src="\/assets\/console-setup-popups\.js[^"]*"[^>]*><\/script>/g,'').replace(/<link\b[^>]*href="\/assets\/console-setup-popups\.css[^"]*"[^>]*>/g,'');
  if(skipPath(route)||!/<main\b/.test(html))return html;
  if(!html.includes('/assets/console-setup-popups.css'))html=html.replace('</head>','<link rel="stylesheet" href="/assets/console-setup-popups.css?v=1"></head>');
  if(!html.includes('/assets/console-setup-popups.js'))html=html.replace('</body>','<script defer src="/assets/console-setup-popups.js?v=2"></script></body>');
  return html.replace(/\/assets\/console-setup-popups\.js\?v=\d+/g,'/assets/console-setup-popups.js?v=2');}
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):e.name.endsWith('.html')?[path.join(dir,e.name)]:[]);}
function run(){let changed=0;for(const file of files(path.join(root,'console'))){const before=fs.readFileSync(file,'utf8'),after=apply(path.relative(root,file),before);if(before!==after){if(!process.argv.includes('--check'))fs.writeFileSync(file,after);changed++;}}console.log(changed+' console pages '+(process.argv.includes('--check')?'need integration':'updated'));if(changed&&process.argv.includes('--check'))process.exitCode=1;}
if(require.main===module)run();module.exports={apply};
