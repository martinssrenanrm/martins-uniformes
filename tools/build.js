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
// versão do app (vai junto em cada evento, para comparar antes e depois de uma mudança)
const ver=require('crypto').createHash('sha1').update(app).digest('hex').slice(0,8);
// ícone do app na tela inicial (celular e computador): clientes/<CLIENTE>-icones/ (símbolo oficial sobre o petróleo)
const icDir=path.join(__dirname,'..','clientes',cid+'-icones');const ics=fs.existsSync(icDir)?fs.readdirSync(icDir).filter(f=>/^icon-\d+(-maskable)?\.png$/.test(f)):[];
const icTags=ics.includes('icon-180.png')?'<link rel="apple-touch-icon" href="icon-180.png"><link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">':'';
const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#102F2F"><link rel="manifest" href="manifest.webmanifest">${icTags}
<title>${cli.nome}</title>
<script>window.MARTINS_SB=${JSON.stringify({url,key})};window.CLIENTE=${JSON.stringify(cli)};window.MARTINS_V=${JSON.stringify(ver)};</script></head><body>
${app}
</body></html>`;
const out=path.join(__dirname,'..','site');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'index.html'),html);
ics.forEach(f=>fs.copyFileSync(path.join(icDir,f),path.join(out,f)));
const icons=ics.filter(f=>f!=='icon-180.png').map(f=>({src:f,sizes:f.match(/\d+/)[0]+'x'+f.match(/\d+/)[0],type:'image/png',purpose:f.includes('maskable')?'maskable':'any'}));
fs.writeFileSync(path.join(out,'manifest.webmanifest'),JSON.stringify({name:cli.nome,short_name:cli.curto||cli.nome,start_url:'./',display:'standalone',background_color:'#102F2F',theme_color:'#102F2F',lang:'pt-BR',...(icons.length?{icons}:{})},null,1));
console.log('site/index.html gerado ('+Math.round(html.length/1024)+' KB)');
