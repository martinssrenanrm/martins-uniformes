// Teste: função "conta-azul" do Supabase (supabase/functions/conta-azul/nucleo.js), contra Conta Azul e Supabase falsos.
// Confere o token (que muda a cada uso), a trava (uma busca por vez), a busca rápida/noturna, os itens e o aviso para o app.
// Rodar: node tests/conta-azul-funcao.test.js   (não precisa de navegador nem de rede)
const path=require('path');const {pathToFileURL}=require('url');
let falhas=0;const ok=(c,m,d)=>{console.log((c?'  ✔ ':'  ✘ ')+m+(!c&&d!==undefined?'\n      '+String(typeof d==='string'?d:JSON.stringify(d)).slice(0,400):''));if(!c)falhas++};
const AGORA=Date.parse('2026-11-09T14:00:00Z');
function falsos({vendas=[],acesso=null,acessoAte=null,ultima='2026-11-09T13:50:00Z',revogado=false,quebraBusca=0,lento=0,limite=0}={}){
  const st={integ:{nome:'conta-azul',segredo:'rt-0',info:{ultima_sincronizacao:ultima,acesso,acesso_ate:acessoAte}},vendas:new Map(),sinais:[],ordem:[],tokens:new Set(['rt-0']),n:0,buscas:[],trava:{dono:null,ate:0},detalhes:[],limite};
  const json=(s,o,h={})=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json',...h}});
  const f=async(url,o={})=>{const u=new URL(url);const m=(o.method||'GET').toUpperCase();const b=o.body?String(o.body):'';
    if(u.pathname==='/oauth/token'){st.ordem.push('token');st.basic=o.headers.Authorization;const p=new URLSearchParams(b);if(revogado)return json(400,{error:'invalid_grant',error_subtype:'access_revoked'});
      if(!st.tokens.has(p.get('refresh_token')))return json(400,{error:'invalid_grant',error_subtype:'invalid_refresh_token'});st.tokens.clear();const novo='rt-'+(++st.n);st.tokens.add(novo);return json(200,{access_token:'at-'+st.n,refresh_token:novo,expires_in:3600})}
    if(u.pathname==='/v1/venda/busca'){st.ordem.push('busca');st.buscas.push(u.search);if(!/^Bearer at-/.test(o.headers.Authorization))return json(401,{});
      if(st.limite>0){st.limite--;return json(429,{error:'too_many'},{'retry-after':'1'})}
      if(quebraBusca){quebraBusca--;return json(500,{})}if(lento)await new Promise(r=>setTimeout(r,lento));return json(200,{total_itens:vendas.length,itens:vendas})}
    const mv=u.pathname.match(/^\/v1\/venda\/([\w-]+)(\/itens)?$/);
    if(mv){const v=vendas.find(x=>x.id===mv[1]);if(!mv[2]){st.detalhes.push(v.numero);return json(200,{cliente:{nome:v.cliente.nome,documento:'00.000.000/0001-00'},vendedor:{nome:'Paula'},venda:{observacoes:'obs',versao:2,composicao_valor:{valor_liquido:v.total}}})}
      return json(200,{itens:[{id_item:'p1',nome:'Camisa polo',descricao:'M/10',quantidade:10,valor:v.total/10,custo:1}]})}
    if(u.pathname==='/rest/v1/rpc/ca_trava_pega'){const a=JSON.parse(b);const t=Date.now();if(st.trava.ate<t||st.trava.dono===a.dono){st.trava={dono:a.dono,ate:t+a.segundos*1000};return json(200,true)}return json(200,false)}
    if(u.pathname==='/rest/v1/rpc/ca_trava_solta'){const a=JSON.parse(b);if(st.trava.dono===a.dono)st.trava.ate=0;return json(200,null)}
    if(u.pathname==='/rest/v1/integracoes'){if(m==='GET'&&u.searchParams.get('nome')==='eq.conta-azul-app')return json(200,st.app?[{segredo:JSON.stringify(st.app)}]:[]);if(m==='GET')return json(200,[st.integ]);if(m==='PATCH'){const x=JSON.parse(b);if(x.segredo)st.ordem.push('guarda-token');Object.assign(st.integ,x);return new Response(null,{status:204})}}
    if(u.pathname==='/rest/v1/ca_vendas'){if(m==='POST'){JSON.parse(b).forEach(l=>st.vendas.set(l.id,{...(st.vendas.get(l.id)||{}),...l}));return new Response(null,{status:201})}
      if(m==='PATCH'){const id=u.searchParams.get('id').slice(3);Object.assign(st.vendas.get(id),JSON.parse(b));return new Response(null,{status:204})}
      if(m==='GET'){const min=(u.searchParams.get('data')||'').replace('gte.','');return json(200,[...st.vendas.values()].filter(l=>l.itens==null&&/^(APROVADO|FATURADO)$/.test(l.situacao)&&String(l.data)>=min).map(l=>({id:l.id})))}}
    if(u.pathname==='/rest/v1/docs_sinal'&&m==='POST'){st.sinais.push(...JSON.parse(b));return new Response(null,{status:201})}
    return json(404,{erro:u.pathname})};
  return {st,f}}
const ENV={CA_API:'https://ca.test',SUPABASE_URL:'https://sb.test',SUPABASE_SERVICE_ROLE_KEY:'srv',CA_CLIENT_ID:'cid',CA_CLIENT_SECRET:'csec'};
const V=(n,sit,data='2026-11-09',total=100)=>({id:'v'+n,numero:n,data,total,situacao:{nome:sit},cliente:{id:'c',nome:'Cliente '+n}});
(async()=>{const {sincronizar}=await import(pathToFileURL(path.join(__dirname,'../supabase/functions/conta-azul/nucleo.js')).href);
  const roda=(F,o={})=>sincronizar({env:ENV,f:F.f,agora:()=>AGORA,espera:()=>Promise.resolve(),...o}).then(r=>({r}),e=>({e:e.message}));

  console.log('1) Token: só renova quando o acesso vence, e grava o novo antes de buscar');
  let F=falsos({vendas:[V(1,'APROVADO')]});let x=await roda(F);
  ok(!x.e&&x.r.vendas===1,'busca rápida traz a venda',x);
  ok(F.st.ordem.slice(0,3).join(',')==='token,guarda-token,busca','renova, grava o token novo e só depois busca',F.st.ordem);
  ok(F.st.integ.segredo==='rt-1'&&F.st.integ.info.acesso==='at-1','guarda o token novo e o acesso');
  F.st.ordem.length=0;x=await roda(F);
  ok(!x.e&&!F.st.ordem.includes('token'),'segunda busca na mesma hora reaproveita o acesso (não gasta o token)',F.st.ordem);
  F=falsos({acesso:'at-velho',acessoAte:new Date(AGORA+60e3).toISOString()});x=await roda(F);
  ok(F.st.ordem[0]==='token','acesso vencendo em 1 minuto: renova antes',F.st.ordem);

  console.log('2) Trava: uma busca por vez');
  F=falsos({vendas:[V(1,'APROVADO')],lento:150});
  const [a,b]=await Promise.all([roda(F),roda(F)]);
  ok([a,b].filter(z=>z.r&&z.r.ocupado).length===1&&[a,b].filter(z=>z.r&&z.r.vendas===1).length===1,'duas ao mesmo tempo: uma busca, a outra responde "ocupado"',[a,b]);
  ok(F.st.ordem.filter(o=>o==='token').length===1&&F.st.tokens.has(F.st.integ.segredo),'o token foi renovado uma vez só e o guardado continua valendo');
  ok(F.st.trava.ate===0,'a trava é solta no fim');
  F=falsos({quebraBusca:9});x=await roda(F);
  ok(x.e&&/respondeu 500/.test(x.e)&&F.st.trava.ate===0,'deu erro: a trava é solta mesmo assim',x);
  x=await roda(F);ok(!x.e||!/ocupado/.test(x.e),'e a próxima busca roda');
  F=falsos();F.st.trava={dono:'outro',ate:Date.now()-1};x=await roda(F);ok(!x.e&&!x.r.ocupado,'trava esquecida por uma busca que caiu vence sozinha');

  console.log('3) Rápida, noite e completa');
  F=falsos();await roda(F);ok(/data_alteracao_de=2026-11-09T10%3A40%3A00/.test(F.st.buscas[0])&&/data_alteracao_ate=/.test(F.st.buscas[0]),'rápida: o que mudou desde a última (com 10 min de folga, horário de Brasília)',F.st.buscas[0]);
  F=falsos();await roda(F,{modo:'noite'});ok(/data_alteracao_de=2026-11-08T10%3A50%3A00/.test(F.st.buscas[0]),'noite: o que mudou no último dia',F.st.buscas[0]);
  F=falsos();await roda(F,{modo:'completa',desde:'2026-10-01'});ok(/data_inicio=2026-10-01/.test(F.st.buscas[0]),'completa: desde a data pedida');
  F=falsos({ultima:null});x=await roda(F);ok(x.e&&/primeira carga completa/.test(x.e),'sem nenhuma carga ainda, a rápida não roda',x);
  F=falsos({vendas:[V(1,'APROVADO')]});x=await roda(F);ok(F.st.integ.info.ultima_sincronizacao==='2026-11-09T14:00:00.000Z'&&F.st.integ.info.acesso==='at-1','marca a hora da busca sem apagar o acesso guardado');

  console.log('4) Itens, vendedor e aviso para o app');
  F=falsos({vendas:[V(1,'APROVADO'),V(2,'FATURADO'),V(3,'ORCAMENTO'),V(4,'APROVADO','2020-01-01')]});x=await roda(F);
  const v1=F.st.vendas.get('v1');
  ok(v1.vendedor==='Paula'&&v1.itens.length===1&&v1.itens[0].quantidade===10&&v1.detalhe.cliente.documento,'aprovada recente ganha vendedor, itens e CNPJ');
  ok(!JSON.stringify(v1.itens).includes('custo'),'o custo não é guardado');
  ok(F.st.detalhes.sort().join()==='1,2','orçamento e venda velha não buscam detalhe',F.st.detalhes);
  ok(F.st.sinais.length===1&&F.st.sinais[0].path==='cavsinal/vendas','manda um aviso pequeno (docs_sinal) para os aparelhos abertos');
  F=falsos({vendas:[]});x=await roda(F);ok(!F.st.sinais.length,'nada novo: nenhum aviso');

  console.log('5) Conta Azul com problema');
  F=falsos({vendas:[V(1,'APROVADO')],limite:2});x=await roda(F);ok(!x.e&&x.r.vendas===1,'limite de chamadas (429): espera e tenta de novo',x);
  F=falsos({revogado:true});x=await roda(F);ok(x.e&&/access_revoked/.test(x.e)&&/conectar o Conta Azul de novo/.test(x.e)&&F.st.integ.segredo==='rt-0','autorização cancelada: diz para conectar de novo e não mexe no token',x);
  const SEM={...ENV,CA_CLIENT_ID:'',CA_CLIENT_SECRET:''};
  F=falsos({vendas:[V(1,'APROVADO')]});F.st.app={client_id:'cid2',client_secret:'csec2'};x=await sincronizar({env:SEM,f:F.f,agora:()=>AGORA});
  ok(x.vendas===1&&F.st.basic==='Basic '+Buffer.from('cid2:csec2').toString('base64'),'sem os segredos na função: usa os códigos guardados no banco (conta-azul-app)',F.st.basic);
  x=await sincronizar({env:SEM,f:falsos().f,agora:()=>AGORA}).then(()=>({}),e=>({e:e.message}));ok(/CA_CLIENT_ID e CA_CLIENT_SECRET/.test(x.e||''),'sem códigos em lugar nenhum: diz o que falta',x);
  console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
