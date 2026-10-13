// Prepara o projeto Supabase pela API de gestão: cria a tabela e as regras (supabase/schema.sql),
// configura o login (endereço do app, e-mails em português) e mostra as chaves públicas.
// Uso: SUPABASE_ACCESS_TOKEN=sbp_... SUPABASE_REF=<ref do projeto> APP_URL=https://... node tools/supabase.js
const fs=require('fs'),path=require('path');
const tok=process.env.SUPABASE_ACCESS_TOKEN,ref=process.env.SUPABASE_REF,appUrl=process.env.APP_URL||'';
if(!tok||!ref){console.error('Faltam SUPABASE_ACCESS_TOKEN e SUPABASE_REF');process.exit(1)}
const api=async(m,p,b)=>{const r=await fetch('https://api.supabase.com/v1/projects/'+ref+p,{method:m,headers:{Authorization:'Bearer '+tok,'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});const t=await r.text();if(!r.ok)throw new Error(m+' '+p+' → '+r.status+' '+t);try{return JSON.parse(t)}catch(e){return t}};
(async()=>{
  await api('POST','/database/query',{query:fs.readFileSync(path.join(__dirname,'..','supabase','schema.sql'),'utf8')});console.log('✔ tabela, regras de acesso e tempo real');
  const conf={mailer_subjects_confirmation:'Martins Pro: confirme seu e-mail',mailer_subjects_recovery:'Martins Pro: criar senha nova',
    mailer_templates_confirmation_content:'<h2>Bem-vinda ao Martins Pro</h2><p>Toque no botão para confirmar seu e-mail e começar a usar o app.</p><p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 22px;background:#17864A;color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Confirmar meu e-mail</a></p>',
    mailer_templates_recovery_content:'<h2>Senha nova no Martins Pro</h2><p>Toque no botão para criar uma senha nova. Se não foi você que pediu, ignore este e-mail.</p><p><a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 22px;background:#1E5BB8;color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Criar senha nova</a></p>',
    password_min_length:6};
  if(appUrl){conf.site_url=appUrl;conf.uri_allow_list=appUrl+'/**'}
  await api('PATCH','/config/auth',conf);console.log('✔ login configurado'+(appUrl?' para '+appUrl:''));
  const ks=await api('GET','/api-keys');const anon=(ks.find(k=>k.name==='anon')||{}).api_key;
  console.log('SUPABASE_URL=https://'+ref+'.supabase.co');console.log('SUPABASE_ANON_KEY='+anon);
})().catch(e=>{console.error(e.message);process.exit(1)});
