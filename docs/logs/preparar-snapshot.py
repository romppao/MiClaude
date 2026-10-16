from pathlib import Path
import subprocess,json,re,sys
sys.stdout.reconfigure(encoding='utf-8')
g=['git','-c','safe.directory=C:/Users/PC/Desktop/MiProyectoAI/MiClaude','-c','core.quotePath=false']
def call(*a):return subprocess.check_output(g+list(a),stderr=subprocess.DEVNULL).decode('utf-8').replace('\r\n','\n')
old,target,dest=sys.argv[1:]
changes=[x.split('\t',1) for x in call('diff',old,target,'--name-status').splitlines()]
patches={}
for part in call('diff','--no-ext-diff',old,target).split('diff --git ')[1:]:
 header=part.split('\n',1)[0]; path=header.split(' b/',1)[1]; patches[path]='diff --git '+part
blobs={line.split('\t',1)[1]:line.split()[2] for line in call('ls-tree','-r',old).splitlines()}
rows=[]
for status,path in changes:
 if status=='A':rows.append({'path':path,'content':call('show',target+':'+path)})
 elif status=='M':rows.append({'path':path,'patch':patches[path],'baseSha':blobs[path]})
 else:raise RuntimeError('Estado inesperado '+status+' '+path)
f=Path(dest);f.write_text(json.dumps(rows),encoding='utf-8');print(json.dumps({'file':dest,'length':f.stat().st_size,'files':len(rows),'tree':call('rev-parse',target+'^{tree}').strip()}))
