// Teste: Novo pedido › "Puxar venda": o número da venda do Conta Azul abre a conferência com os dados da venda (mesmo caminho de "Criar pedido"). Nomes e números fictícios.
// Rodar: NODE_PATH=$(npm root -g) node tests/puxar-venda-ca.test.js
// PRINTS=<pasta> guarda os prints em 360×640. PGLITE=<pasta com node_modules/@electric-sql/pglite> testa também o SQL.
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
// vendedor e clientes 2 e 3 são preenchidos com dados do seed (nome de quem vende e de pedidos que já existem)
const VENDAS=(vend,cli2,cli3)=>{const it=(nome,descricao,quantidade,valor)=>({id_item:'x',nome,descricao,tipo:'PRODUTO',quantidade,valor});return [
  {id:'a1',numero:9201,data:'2026-11-03',situacao:'APROVADO',total:1000,cliente_id:'c1',cliente:'EMPRESA NOVA TESTE',vendedor:vend,
    itens:[it('PCPV - Camisa Polo Viena','Na cor MARINHO, com um bordado no peito esq. - UNISSEX: M/5 - G/4 - GG/6',15,63.33),it('MBORD - Matriz Bordado','cobrado apenas na primeira encomenda',1,50)],
    detalhe:{cliente:{nome:'EMPRESA NOVA TESTE',documento:'33.333.333/0001-33'},observacoes:'Entregar na portaria',composicao_valor:{valor_bruto:1050,desconto:50,frete:0,valor_liquido:1000},parcelas:[{numero:1,data_vencimento:'2026-12-03',valor:1000,descricao:'Venda 9201'}]}},
  {id:'a2',numero:9202,data:'2026-11-04',situacao:'FATURADO',total:500,cliente:cli2,vendedor:'Outra Pessoa',itens:[it('Camiseta','P/10',10,50)],detalhe:{}},
  {id:'a3',numero:9203,data:'2026-11-05',situacao:'APROVADO',total:700,cliente:cli3+' LTDA',vendedor:'Outra Pessoa',itens:[it('Jaleco','M/7',7,100)],detalhe:{}},
  {id:'a4',numero:9204,data:'2026-11-05',situacao:'APROVADO',total:80,cliente:'REVENDA TESTE',vendedor:'Outra Pessoa',itens:[it('Tecido brim (metro)','',20,4)],detalhe:{}},
  {id:'a5',numero:9205,data:'2026-11-06',situacao:'APROVADO',total:300,cliente:'ESCOLA SEM ITENS',vendedor:null,itens:null,detalhe:null}]};
(async()=>{const b=await chromium.launch();const er=[];
  const app=fs.readFileSync(path.join(R,'app.html'),'utf8');
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>window.MARTINS_SB={url:'https://teste.supabase.co',key:'anon'}</script></head><body>${app}</body></html>`;
  const ctx=await b.newContext({viewport:{width:360,height:640},timezoneId:'America/Sao_Paulo'});
  await ctx.route('https://app.martins.test/**',r=>r.fulfill({contentType:'text/html',body:html}));
  await ctx.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({contentType:'application/javascript',body:'window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){}}})}'}));
  const p=await ctx.newPage();p.on('pageerror',e=>er.push(e.message));
  await p.clock.setFixedTime(new Date('2026-11-09T10:00:00-03:00'));
  await p.goto('https://app.martins.test/');await p.waitForTimeout(1500);
  const abre=async(perfil,o={})=>{await p.evaluate(([perfil,o,VS])=>{seed();state=normalizar(state);
      const vend=state.pessoas[0],ps=state.pedidos.filter(x=>!x.concluido);ps[0].ficha='9202';ps[1].ficha='';window.P1=ps[1].id;window.P1orig=JSON.parse(JSON.stringify(ps[1]));
      const u=state.usuarios.find(u=>u.perfil==='gestao');u.perfil=perfil;u.pessoa=vend.id;SESSAO={id:u.id,email:u.email};NV.pronto=true;NV.erro='';ui.inicio=null;ui.sheet=null;ui.cav=null;
      const vs=eval(VS)(vend.nome+' Souza',ps[0].cliente,ps[1].cliente);window.VS=vs;
      window.NB=0;window.NL=0;NV.db=o.claude?null:{ev:{metricas:async()=>({}),vendasPedido:o.semFuncao?async()=>{throw {code:'sem-cav'}}:async desde=>{window.DESDE=desde;window.NL++;return JSON.parse(JSON.stringify(vs))},
        ...(o.est!==undefined?{caEstado:async()=>o.est,caBuscar:async()=>{window.NB++;await new Promise(r=>setTimeout(r,150));if(o.ocupado)throw {code:'ocupado'};return {vendas:2}}}:{})},
        sinal:{ouvir:cb=>{window.CB=cb}}};
      if(o.off)state.modOff=['cav'];EV.fila=[];ui.tela='fabrica';ui.fz='esc';ui.escVer='ped';render()},[perfil,o,VENDAS.toString()]);await p.waitForTimeout(300);await p.evaluate(()=>render());await p.waitForTimeout(100)};
  const botao=()=>p.evaluate(()=>{const e=document.querySelector('[data-a=cavAbrir]');return e?e.innerText.replace(/\s+/g,' ').trim():null});
  const cards=()=>p.evaluate(()=>[...document.querySelectorAll('#sheet .cav-v')].map(c=>c.id.replace('cav-','')));

  const novo=async()=>{await p.evaluate(()=>{A.novo()});await p.waitForTimeout(150)};
  const puxa=async n=>{await p.evaluate(n=>{document.getElementById('wCaNum').value=n;A.wPuxaCA()},n);await p.waitForTimeout(250)};
  const estado=()=>p.evaluate(()=>({t:ui.sheet&&ui.sheet.t,err:ui.sheet&&ui.sheet.w&&ui.sheet.w.caErr||'',txt:document.getElementById('sheet')?document.getElementById('sheet').innerText:''}));

  console.log('1) O campo aparece para gestão e escritório');
  await abre('escritorio');await novo();
  let e=await estado();
  ok(e.t==='novo'&&/Tem o número da venda no Conta Azul\?/.test(e.txt)&&/Puxar venda/.test(e.txt),'Novo pedido › passo 1 mostra "Tem o número da venda no Conta Azul?" e "Puxar venda"');
  ok(/Importar fichas/.test(e.txt)&&/Para quem é o pedido\?/.test(e.txt),'o importar fichas e o cadastro à mão continuam lá');

  console.log('2) Puxa a venda pelo número');
  await puxa('9201');e=await estado();
  ok(e.t==='imp','abre a conferência da importação');
  ok(/EMPRESA NOVA TESTE/.test(e.txt),'traz a empresa');
  ok(await p.evaluate(()=>JSON.stringify(ui.sheet.grupos[0]).includes('33.333.333/0001-33')),'traz o CNPJ (vai para o cadastro da empresa)');
  ok(/Polo Viena/.test(e.txt)&&/15/.test(e.txt),'traz as peças e as quantidades');
  ok(await p.evaluate(()=>ui.sheet.grupos[0].venda==='9201'&&ui.sheet.grupos[0].num==='9201'),'o número da venda vai junto (fica em "Nº do pedido no Conta Azul")');
  ok(await p.evaluate(()=>window.NL>=1),'busca nas vendas aprovadas e faturadas');

  console.log('3) Avisos');
  await abre('escritorio');await novo();await puxa('');e=await estado();
  ok(e.t==='novo'&&/Digite o número/.test(e.err),'sem número: pede o número');
  await puxa('9202');e=await estado();
  ok(e.t==='novo'&&/já tem pedido no sistema/.test(e.err),'venda que já tem pedido: avisa e não duplica');
  await puxa('99999');e=await estado();
  ok(e.t==='novo'&&/Não achei a venda 99999/.test(e.err),'número que não existe: avisa');
  await puxa('9205');e=await estado();
  ok(e.t==='imp','venda aprovada hoje, ainda sem as peças: abre mesmo assim para completar');

  console.log('4) Quem não pode, não vê');
  await abre('chao');e=await p.evaluate(()=>{A.novo();return document.getElementById('sheet')?document.getElementById('sheet').innerText:''});
  ok(!/Puxar venda/.test(e),'chão de fábrica não vê o campo');
  await abre('escritorio',{off:true});await novo();e=await estado();
  ok(!/Puxar venda/.test(e.txt),'com as vendas do Conta Azul desligadas, o campo some');
  await abre('escritorio',{semFuncao:true});await novo();await puxa('9201');e=await estado();
  ok(e.t==='novo'&&/não está ligada/.test(e.err),'sem a função no banco: avisa, sem quebrar');

  ok(!er.length,'sem erros na página'+(er.length?': '+er.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
