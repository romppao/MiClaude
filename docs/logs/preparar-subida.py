from pathlib import Path
import subprocess,json,sys
sys.stdout.reconfigure(encoding='utf-8')
g=['git','-c','safe.directory=C:/Users/PC/Desktop/MiProyectoAI/MiClaude','-c','core.quotePath=false']
def call(*a):return subprocess.check_output(g+list(a),stderr=subprocess.DEVNULL).decode('utf-8').replace('\r\n','\n')
main='f7204acb25b06c2666898edab5f92f62baa90fe9'
legal=set(call('diff','8f07985',main,'--name-only').splitlines())
old=sys.argv[1];rows=[]
for p in call('diff',old,'--name-only').splitlines():
 if p in legal or p in ['docs/APORTACIONES-CODEX.md','docs/LECCIONES.md']:
  base=main if p in legal else '8010ed3'
  rows.append({'path':p,'patch':call('diff','--no-ext-diff',base,'--',p),'baseSha':call('rev-parse',base+':'+p).strip()})
 else:rows.append({'path':p,'content':Path(p).read_text(encoding='utf-8')})
print(json.dumps(rows))
