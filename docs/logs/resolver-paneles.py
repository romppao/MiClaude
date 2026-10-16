from pathlib import Path
import subprocess,json,re,sys
root=Path('.'); g=['git','-c','safe.directory=C:/Users/PC/Desktop/MiProyectoAI/MiClaude']
def git(*a):return subprocess.check_output(g+list(a)).decode('utf-8').replace('\r\n','\n')
block,old=sys.argv[1:]
conflicts=git('diff','--name-only','--diff-filter=U').splitlines()
for p in conflicts:
 f=root/p
 if p=='docs/catalogo-codigo.json':
  a=json.loads(git('show','HEAD:'+p));b=json.loads(git('show','MERGE_HEAD:'+p));known={e['path'] for e in a};a.extend(e for e in b if e['path'] not in known);f.write_text(json.dumps(sorted(a,key=lambda x:x['path']),ensure_ascii=False,indent=2)+'\n',encoding='utf-8');continue
 if p in ['docs/mantenimiento/CATALOGO.md','docs/MAPA-FUNCIONAL.md']:f.write_text(git('show','HEAD:'+p),encoding='utf-8');continue
 if p not in ['CHANGELOG.md','docs/APORTACIONES-CODEX.md','docs/DIARIO.md','docs/ESTADO.md','docs/LECCIONES.md','package.json','package-lock.json']:raise RuntimeError('Revisar conflicto de código: '+p)
 t=f.read_text(encoding='utf-8')
 def resolve(m):
  a,b=m.group(1),m.group(2)
  if p=='CHANGELOG.md':return re.sub(r'^## \['+re.escape(old)+r'\][^\n]*\n','',a,flags=re.M)+'\n'+b
  if p in ['package.json','package-lock.json','docs/ESTADO.md']:return b
  return a+'\n'+b
 t=re.sub(r'^<<<<<<< [^\n]*\n(.*?)^=======\n(.*?)^>>>>>>> [^\n]*\n',resolve,t,flags=re.M|re.S)
 if re.search(r'^(<<<<<<<|=======|>>>>>>>)',t,re.M):raise RuntimeError('Marcadores pendientes: '+p)
 if p.endswith('.json'):json.loads(t)
 f.write_text(t,encoding='utf-8')
print('Conflictos documentales resueltos para',block)
