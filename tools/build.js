// Gera site/index.html: o app completo de um cliente, ligado ao Supabase dele.
// Uso: CLIENTE=martins SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=eyJ... node tools/build.js
// O cliente vem de clientes/<CLIENTE>.json (padrão: martins).
// (url e anon key são públicas por natureza; quem protege os dados são as regras de acesso do banco.)
const fs=require('fs'),path=require('path');
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_ANON_KEY;
if(!url||!key){console.error('Faltam SUPABASE_URL e SUPABASE_ANON_KEY');process.exit(1)}
const cid=process.env.CLIENTE||'martins';const cfgArq=path.join(__dirname,'..','clientes',cid+'.json');
if(!fs.existsSync(cfgArq)){console.error('Cliente não encontrado: '+cfgArq);process.exit(1)}
const cli=JSON.parse(fs.readFileSync(cfgArq,'utf8'));
const app=fs.readFileSync(path.join(__dirname,'..','app.html'),'utf8');
const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#16202C"><link rel="manifest" href="manifest.webmanifest">
<title>${cli.nome}</title>
<script>window.MARTINS_SB=${JSON.stringify({url,key})};window.CLIENTE=${JSON.stringify(cli)};</script></head><body>
${app}
</body></html>`;
const out=path.join(__dirname,'..','site');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'index.html'),html);
fs.writeFileSync(path.join(out,'manifest.webmanifest'),JSON.stringify({name:cli.nome,short_name:cli.curto||cli.nome,start_url:'./',display:'standalone',background_color:'#EEF1F5',theme_color:'#16202C',lang:'pt-BR'},null,1));
console.log('site/index.html gerado ('+Math.round(html.length/1024)+' KB)');
