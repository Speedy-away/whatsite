"""Audit public console cards without changing the site's HTML."""
import collections,html,json,pathlib,re
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parent.parent
CARD_CLASSES={'guide-resource','game-card','patch-card','ps2-card','ps3-theme-card','switch-mod-card','switch-theme-card','themes-card'}
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Audit(HTMLParser):
 def __init__(self,text,file):
  super().__init__(convert_charrefs=False);self.text=text;self.file=file;self.stack=[];self.cards=[];self.broken=[];self.images=0
  self.lines=[0]
  for m in re.finditer('\n',text):self.lines.append(m.end())
 def source_offset(self):
  line,col=self.getpos();return self.lines[line-1]+col
 def handle_starttag(self,tag,attrs):
  attr=dict(attrs);pos=self.source_offset()
  if tag=='img':
   self.images+=1;src=attr.get('src','')
   if not src or src.startswith('/') and not (ROOT/html.unescape(src).split('?')[0].lstrip('/')).is_file():self.broken.append({'file':self.file,'src':src})
  if tag not in VOID:self.stack.append({'tag':tag,'attrs':attr,'start':pos,'openEnd':pos+len(self.get_starttag_text()),'card':bool(CARD_CLASSES.intersection((attr.get('class') or '').split()))})
 def handle_endtag(self,tag):
  index=next((i for i in range(len(self.stack)-1,-1,-1) if self.stack[i]['tag']==tag),None)
  if index is None:return
  closed=self.stack[index:];self.stack=self.stack[:index]
  for card in closed:
   if not card['card']:continue
   body=self.text[card['openEnd']:self.source_offset()]
   if re.search(r'<(?:img|svg)\b',body,re.I) or 'background-image' in card['attrs'].get('style',''):continue
   title=re.search(r'<h[234]\b[^>]*>([\s\S]*?)</h[234]>',body,re.I)
   title=html.unescape(re.sub('<[^>]+>','',title[1] if title else body)).strip()
   self.cards.append({'file':self.file,'title':title[:160],'class':card['attrs'].get('class'),'id':card['attrs'].get('id'),'start':card['start'],'openEnd':card['openEnd'],'links':[html.unescape(m[1]) for m in re.finditer(r'<a\b[^>]*href=["\x27]([^"\x27]+)',body,re.I)]})
def audit():
 missing=[];broken=[];images=0;pages=0
 for file in sorted((ROOT/'console').rglob('*.html')):
  if file.name in ('whatsite-ps4.html','whatsite-ps5.html'):continue
  relative=file.relative_to(ROOT).as_posix();parser=Audit(file.read_text(encoding='utf-8-sig'),relative);parser.feed(parser.text)
  pages+=1;missing.extend(parser.cards);broken.extend(parser.broken);images+=parser.images
 summary={'pages':pages,'imageReferences':images,'missingCards':len(missing),'brokenImages':len(broken),'byPlatform':dict(collections.Counter(x['file'].split('/')[1] for x in missing))}
 result={'summary':summary,'missing':missing,'broken':broken}
 (ROOT/'docs/qa/console-wide-image-audit.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(summary,indent=2));return result
if __name__=='__main__':audit()

