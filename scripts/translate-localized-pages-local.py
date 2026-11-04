"""Render a durable translation cache locally; downloaded model data is never published."""
import argparse,hashlib,json,os,pathlib,re,sys,time
from collections import Counter

ROOT=pathlib.Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--dependencies',default=str(ROOT/'tmp/seo-translation-python'))
parser.add_argument('--model',default=str(ROOT/'tmp/local-m2m100'))
parser.add_argument('--engine',choices=['m2m100','madlad'],default='m2m100')
parser.add_argument('--languages',default='es,pt,fr,de,ru,tr,pl,it,zh,ja,ko,th,vi,id,hi,sr,nl,ar,he')
parser.add_argument('--batch-size',type=int,default=256)
parser.add_argument('--limit',type=int,default=0)
args=parser.parse_args()
sys.stdout.reconfigure(encoding='utf-8')
dependencies=pathlib.Path(args.dependencies).resolve()
sys.path.insert(0,str(dependencies))
DLL_HANDLES=[]
if os.name=='nt':
    for file in dependencies.rglob('cublas64_12.dll'):
        DLL_HANDLES.append(os.add_dll_directory(str(file.parent)))
        os.environ['PATH']=str(file.parent)+os.pathsep+os.environ.get('PATH','')
import ctranslate2
import sentencepiece as spm

manifest=json.loads((ROOT/'docs/i18n/page-translations.json').read_text(encoding='utf-8'))
codes=args.languages.split(',')
if any(code not in manifest['languages'] for code in codes):
    raise ValueError('Unsupported translation language')
model=pathlib.Path(args.model).resolve()
model_source=json.loads((model/'source.json').read_text(encoding='utf-8'))
sp=spm.SentencePieceProcessor(model_file=str(model/('spiece.model' if args.engine=='madlad' else 'sentencepiece.bpe.model')))
translator=ctranslate2.Translator(str(model),device='cuda',compute_type='int8_float16',inter_threads=1,intra_threads=4)
MARKER=re.compile(r'ZXQ\d{4}QXZ')
states={}
nodes={}
token_cache={}
started=time.time()
completed=0
repairs=0

def identifier(source):
    return hashlib.sha256(source.encode()).hexdigest()[:20]

def valid(source,value):
    if not isinstance(value,str) or not value.strip():
        return False
    if Counter(MARKER.findall(source))!=Counter(MARKER.findall(value)):
        return False
    if '<unk>' in value or re.search(r'(\w{2,})(?:\s+\1){4,}',value,re.I) or re.search(r'(.{2,12})(?:\1){6,}',value):
        return False
    # Dates, firmware values and IDs must not be invented by a weak model.
    before=set(re.findall(r'\d{2,}',MARKER.sub('',source)))
    after=set(re.findall(r'\d{2,}',MARKER.sub('',value)))
    if after-before:
        return False
    return True

def save(code):
    state=states[code]
    target=ROOT/'languages/pages'/f'{code}.json'
    target.parent.mkdir(parents=True,exist_ok=True)
    temporary=target.with_suffix('.json.new')
    temporary.write_text(json.dumps(state['data'],ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    os.replace(temporary,target)

def record(code,key,value):
    states[code]['data']['translations'][key]=value
    with states[code]['journal'].open('a',encoding='utf-8') as out:
        out.write(json.dumps([key,value],ensure_ascii=False,separators=(',',':'))+'\n')

for code in codes:
    file=ROOT/'languages/pages'/f'{code}.json'
    data=json.loads(file.read_text(encoding='utf-8')) if file.exists() else {'language':code,'sourceLanguage':'en','translations':{}}
    journal=ROOT/'tmp/page-translation-journal'/f'{code}.jsonl'
    if journal.exists():
        for line in journal.read_text(encoding='utf-8').splitlines():
            key,value=json.loads(line)
            data['translations'][key]=value
    source=(ROOT/'languages'/f'{code}.js').read_text(encoding='utf-8')
    dictionary=json.loads(re.search(r'\bvar t = (\{[\s\S]*?\n  \});',source).group(1))
    data['provider']='Automated translation: retained Google Translate cache and local neural translation'
    data['localModel']={'source':model_source['source'],'revision':model_source['revision'],'license':model_source['license'],'engine':args.engine}
    states[code]={'data':data,'journal':journal,'dictionary':dictionary}
    journal.parent.mkdir(parents=True,exist_ok=True)

def normalize_fragment(source):
    originals=[]
    def replace(match):
        originals.append(match.group())
        return f'ZXQ{len(originals)-1:04d}QXZ'
    return MARKER.sub(replace,source),originals

def unnormalize(value,originals):
    return MARKER.sub(lambda match:originals[int(match.group()[3:7])],value)

def add(code,source,key=None,force_parts=False):
    key=key or identifier(source)
    index=(code,key)
    if index in nodes:
        return index
    state=states[code]
    cached=state['data']['translations'].get(key)
    if cached is not None and valid(source,cached):
        nodes[index]={'source':source,'value':cached,'parts':None,'attempts':0}
        return index
    dictionary=state['dictionary']
    known=dictionary.get(source) or dictionary.get(source.lower())
    simple=re.fullmatch(r'((?:ZXQ\d{4}QXZ[ /:-]*)+)\s+([a-z -]+)',source)
    if known is None and simple:
        template=dictionary.get('{name} '+simple.group(2))
        if template:
            known=template.replace('{name}',simple.group(1))
    if known is not None and valid(source,known):
        nodes[index]={'source':source,'value':known,'parts':None,'attempts':0}
        record(code,key,known)
        return index
    if not re.search(r'[A-Za-z]{2}',MARKER.sub('',source)):
        nodes[index]={'source':source,'value':source,'parts':None,'attempts':0}
        record(code,key,source)
        return index
    node={'source':source,'value':None,'parts':None,'attempts':0}
    nodes[index]=node
    if force_parts:
        parts=re.split(r'(ZXQ\d{4}QXZ)',source)
        node['parts']=[]
        for part in parts:
            if not part or MARKER.fullmatch(part) or not re.search(r'[A-Za-z]{2}',part):
                node['parts'].append(('literal',part))
                continue
            prefix=re.match(r'^\s*',part).group()
            suffix=re.search(r'\s*$',part).group()
            fragment=part.strip()
            if fragment==source:
                node['parts']=None
                break
            node['parts'].append(('reference',add(code,fragment),[],prefix,suffix))
    elif len(MARKER.findall(source))>8 and source.count(',')>6:
        node['parts']=[]
        for part in re.split(r'(,\s*)',source):
            if not part or re.fullmatch(r',\s*',part) or not re.search(r'[A-Za-z]{2}',MARKER.sub('',part)):
                node['parts'].append(('literal',part))
                continue
            normalized,originals=normalize_fragment(part)
            node['parts'].append(('reference',add(code,normalized),originals,'',''))
    return index

required=[]
for code in codes:
    for key,source in manifest['segments'].items():
        required.append(add(code,source,key))
priority_ids=set()
strings={row['source']:row for row in manifest['strings']}
for page in manifest['pages']:
    if page['page'] in ['index.html','console/ps4/index.html','console/ps5/index.html','pc/ports.html']:
        priority_ids.update(strings[source].get('id') for source in page['strings'])
priority_nodes=set()
def prioritize(index):
    if index in priority_nodes:
        return
    priority_nodes.add(index)
    for part in nodes[index]['parts'] or []:
        if part[0]=='reference':
            prioritize(part[1])
for index in required:
    if index[1] in priority_ids:
        prioritize(index)

def resolve():
    changed=True
    while changed:
        changed=False
        for (code,key),node in list(nodes.items()):
            if node['value'] is not None or node['parts'] is None:
                continue
            parts=[]
            for part in node['parts']:
                if part[0]=='literal':
                    parts.append(part[1])
                else:
                    value=nodes[part[1]]['value']
                    if value is None:
                        break
                    parts.append(part[3]+(unnormalize(value,part[2]) if part[2] else value)+part[4])
            else:
                value=''.join(parts)
                if not valid(node['source'],value):
                    raise ValueError('Invalid assembled translation '+code+': '+key)
                node['value']=value
                record(code,key,value)
                changed=True

def tokenized(code,source):
    key=(code if args.engine=='madlad' else 'en',source)
    if key not in token_cache:
        protected=MARKER.sub(lambda match:' '+str(876540000+int(match.group()[3:7]))+' ',source)
        if args.engine=='madlad':
            tokens=sp.encode('<2'+code+'> '+protected,out_type=str)+['</s>']
        else:
            tokens=['__en__']+sp.encode(protected,out_type=str)+['</s>']
        token_cache[key]=tokens
    return token_cache[key]

def restore_output(source,value):
    value=re.sub(r'8[.,\s]*7[.,\s]*6[.,\s]*5[.,\s]*4[.,\s]*(\d)[.,\s]*(\d)[.,\s]*(\d)[.,\s]*(\d)',lambda m:'ZXQ'+''.join(m.groups())+'QXZ',value)
    return value.strip()

print(json.dumps({'model':model_source['source'],'languages':codes,'required':len(required),'cachedRequired':sum(nodes[index]['value'] is not None for index in required),'leafJobs':sum(n['value'] is None and n['parts'] is None for n in nodes.values())}),flush=True)
last_report=time.time()
while True:
    resolve()
    pending=[(index,node) for index,node in nodes.items() if node['value'] is None and node['parts'] is None]
    if not pending:
        break
    pending.sort(key=lambda item:(0 if item[0] in priority_nodes else 1,len(tokenized(item[0][0],item[1]['source'])),item[0][0]))
    for offset in range(0,len(pending),args.batch_size):
        batch=pending[offset:offset+args.batch_size]
        sources=[tokenized(index[0],node['source']) for index,node in batch]
        targets=None if args.engine=='madlad' else [['__'+index[0]+'__'] for index,node in batch]
        results=translator.translate_batch(sources,target_prefix=targets,beam_size=1,max_batch_size=16384,batch_type='tokens',max_input_length=2048,max_decoding_length=1024,no_repeat_ngram_size=4)
        for (index,node),result in zip(batch,results):
            code,key=index
            tokens=result.hypotheses[0]
            if args.engine=='m2m100' and tokens and tokens[0].startswith('__'):
                tokens=tokens[1:]
            tokens=[token for token in tokens if token not in ['<s>','</s>','<pad>']]
            value=restore_output(node['source'],sp.decode(tokens))
            if len(tokens)<1023 and valid(node['source'],value):
                node['value']=value
                record(code,key,value)
                completed+=1
            elif MARKER.search(node['source']):
                original=node['source']
                del nodes[index]
                add(code,original,key,force_parts=True)
                repairs+=1
                states[code]['data'].setdefault('repairs',{})[key]='Protected literals retained between locally translated prose fragments'
            else:
                node['attempts']+=1
                if node['attempts']>=3:
                    raise RuntimeError('Translation failed quality checks: '+code+' '+key+' '+node['source'][:180])
        if time.time()-last_report>=10:
            count=sum(nodes[index]['value'] is not None for index in required)
            for code in codes:
                save(code)
            print(json.dumps({'completedLeafJobs':completed,'requiredReady':count,'requiredTotal':len(required),'repairs':repairs,'elapsedSeconds':round(time.time()-started,1)}),flush=True)
            last_report=time.time()
        if args.limit and completed>=args.limit:
            break
    if args.limit and completed>=args.limit:
        break
resolve()
for code in codes:
    save(code)
remaining=sum(nodes[index]['value'] is None for index in required)
print(json.dumps({'complete':remaining==0,'remaining':remaining,'completedLeafJobs':completed,'repairs':repairs,'elapsedSeconds':round(time.time()-started,1)}),flush=True)
if remaining and not args.limit:
    raise SystemExit(1)
