// Leva os dados exportados do banco do Claude para o Supabase.
// Entrada: uma pasta com <colecao>/<id>.json (formato do ArtifactData com out_dir).
// Uso: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node tools/migrar.js <pasta>
// A chave service_role passa por cima das regras de acesso: use só aqui, nunca no app.
const fs=require('fs'),path=require('path');
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_KEY,dir=process.argv[2];
if(!url||!key||!dir){console.error('Uso: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node tools/migrar.js <pasta>');process.exit(1)}
const docs=[];for(const col of fs.readdirSync(dir)){const d=path.join(dir,col);if(!fs.statSync(d).isDirectory())continue;
  for(const f of fs.readdirSync(d)){if(!f.endsWith('.json'))continue;const data=JSON.parse(fs.readFileSync(path.join(d,f),'utf8'));docs.push({path:col+'/'+f.slice(0,-5),data})}}
(async()=>{let lote=[],tam=0,n=0;const manda=async()=>{if(!lote.length)return;
    const r=await fetch(url+'/rest/v1/docs',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(lote)});
    if(!r.ok){console.error('Erro',r.status,await r.text());process.exit(1)}n+=lote.length;console.log(`  ${n}/${docs.length}`);lote=[];tam=0};
  for(const d of docs){const t=JSON.stringify(d).length;if(tam+t>4e6)await manda();lote.push(d);tam+=t}await manda();
  const r=await fetch(url+'/rest/v1/docs?select=path',{headers:{apikey:key,Authorization:'Bearer '+key,Prefer:'count=exact',Range:'0-0'}});
  console.log('No Supabase agora:',r.headers.get('content-range'),'· enviados:',docs.length)})();
