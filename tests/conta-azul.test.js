// Teste: importar pedido/orçamento do Conta Azul (pré-pedido) e cadastrar clientes em lote. Layout fictício, sem dados reais.
// Rodar: NODE_PATH=$(npm root -g) node tests/conta-azul.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
// Mesmo desenho do PDF do Conta Azul: coluna x, linha y, texto.
const L=(y,...c)=>c.map(([x,s])=>({x,y,w:s.length*5,s}));
const ORC=(num,cli,cnpj,extra=[])=>[
  ...L(800,[15,'05/10/2026'],[485,'Orçamento'],[547,num]),...L(763,[94,'FABRICA EXEMPLO'],[503,'(11) 0000-0000']),...L(750,[94,'RUA EXEMPLO, 1 - CENTRO - Cidade - SP - CEP: 00000-000']),
  ...L(731,[94,'FABRICA EXEMPLO LTDA'],[454,'ana@exemplo.com.br']),...L(714,[94,'CNPJ: 00.000.000/0001-00'],[207,'IE: 000']),
  ...L(670,[24,cli],[373,'(11) 4000-1234']),...L(666,[467,'Validade da proposta']),...L(658,[24,'CNPJ: '+cnpj],[348,'COMPRAS@TESTE.COM'],[467,'13/10/2026']),
  ...L(634,[24,'RUA DOS TESTES, 100 - BAIRRO - Campinas - SP - CEP: 13000-000'],[467,'Previsão de entrega']),...L(623,[467,'EM ATÉ 20 DIAS']),
  ...L(584,[40,'Qt.'],[87,'Produto/Serviço'],[239,'Detalhe do item'],[456,'Valor unitário'],[535,'Subtotal']),
  ...L(565,[42,'14'],[87,'PCPV - Camisa Polo Viena'],[239,'Na cor MARINHO, com um bordado no peito esq.'],[487,'48,90'],[538,'684,60']),
  ...L(554,[239,'- UNISSEX: M/5 - G/4 - GG/5']),
  ...L(522,[42,'10'],[87,'PCPV - Camisa Polo Viena'],[239,'No tecido piquet PA 50% alg. e 50% poliester cor'],[487,'52,00'],[538,'520,00']),
  ...L(511,[239,'a definir. Com 1 logo bordado no peito lado esq.']),
  ...L(490,[49,'1'],[87,'MBORD - Matriz Bordado'],[239,'cobrado apenas na primeira encomenda'],[486,'50,00'],[545,'50,00']),
  ...L(470,[443,'Total'],[533,'1.254,60']),...L(455,[442,'Frete'],[546,'30,00']),...L(440,[412,'Valor líquido'],[533,'1.284,60']),
  ...L(410,[22,'Forma de pagamento:']),...L(398,[22,'30 ddl']),...extra,...L(42,[525,'Página 1 de 1'])];
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:360,height:640}});A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  const o1=ORC('9101','EMPRESA TESTE UM','11.111.111/0001-11'),o2=ORC('9102','EMPRESA TESTE DOIS','22.222.222/0001-22'),o3=ORC('9103','EMPRESA TESTE UM','11.111.111/0001-11');
  console.log('1) Ler o orçamento');
  let r=await A.evaluate(o=>{seed();state=normalizar(state);const u=state.usuarios.find(u=>u.perfil==='gestao')||state.usuarios[0];u.perfil='gestao';SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.inicio=null;
    const F=lerContaAzul(o,'orc.pdf');const g=grupoCA(F);return {det:ehContaAzul(o),num:g.num,cli:g.cliente,cnpj:g.cnpj,tel:g.tel,email:g.email,cid:g.cidade,uf:g.uf,cep:g.cep,end:g.end,dias:g.entrega&&Math.round((g.entrega-g.chegada)/DIA),
      n:g.itens.length,it0:{gen:g.itens[0].gen,g:g.itens[0].g,cor:g.itens[0].cor,pers:g.itens[0].pers.map(x=>x.desc)},it1:{cor:g.itens[1].cor,qt:g.itens[1].qtCA,c2:(g.itens[1].cores2||[]).length,pers:g.itens[1].pers.length},fin:g.fin}},o1);
  ok(r.det,'reconhece o PDF como pedido do Conta Azul');
  ok(r.num==='9101'&&r.cli==='EMPRESA TESTE UM'&&r.cnpj==='11.111.111/0001-11','número, empresa e CNPJ');
  ok(r.tel==='(11) 4000-1234'&&r.email==='compras@teste.com'&&r.cid==='Campinas'&&r.uf==='SP'&&r.cep==='13000-000'&&!/CEP/.test(r.end),'telefone, e-mail e endereço ('+r.end+')');
  ok(r.dias===20,'“EM ATÉ 20 DIAS” vira o prazo de entrega');
  ok(r.n===2&&r.it0.gen==='U'&&JSON.stringify(r.it0.g)==='{"M":5,"G":4,"GG":5}'&&!/UNISSEX/.test(r.it0.pers.join()),'grade escrita no detalhe (UNISSEX: M/5…) vira os tamanhos, sem sujar a personalização');
  ok(!r.it1.cor&&r.it1.qt===10&&!r.it1.c2&&r.it1.pers===1,'“cor a definir” fica em branco; quantidade do Conta Azul guardada');
  ok(r.fin.liquido===1284.6&&r.fin.frete===30&&r.fin.extras.length===1&&r.fin.cond.includes('30 ddl'),'valores, frete, matriz e condições no financeiro');
  console.log('1b) Padrões de 2024: grade sem rótulo, uma linha por tamanho, cabeçalho repetido na página 2, texto institucional');
  const o4=[...L(800,[15,'01/11/2024'],[485,'Orçamento'],[547,'9104']),...L(763,[94,'FABRICA EXEMPLO']),...L(731,[94,'FABRICA EXEMPLO LTDA'],[454,'ana@exemplo.com.br']),...L(714,[94,'CNPJ: 00.000.000/0001-00']),
    ...L(670,[24,'ESCOLA TESTE']),...L(666,[467,'Validade da proposta']),...L(656,[277,'contato@escolateste.com'],[467,'01/11/2024']),
    ...L(583,[22,'Texto institucional da fábrica que vai de um lado ao outro da página, com várias palavras e sem números.']),...L(572,[22,'continua o texto institucional']),
    ...L(520,[40,'Qt.'],[87,'Produto/Serviço'],[239,'Detalhe do item'],[456,'Valor unitário'],[535,'Subtotal']),
    ...L(500,[42,'90'],[87,'E1011INF - Camiseta Manga Curta'],[239,'2/20 - 4/40 - 6/20 - 8/10'],[487,'30,00'],[535,'2.700,00']),...L(489,[87,'Infantil Escolar'])];
  [['02',15],['04',10],['06',10]].forEach(([z,q],k)=>o4.push(...L(470-k*30,[42,String(q)],[87,'E2002'+z+' - Bermuda em Helanca'],[239,'TACTEL'],[487,'40,00'],[535,(q*40)+',00']),...L(459-k*30,[87,'Escolar '+z])));
  o4.push(...L(42,[15,'Continua na próxima página...'],[525,'Página 1 de 2']));
  [...L(800,[15,'01/11/2024'],[485,'Orçamento'],[547,'9104']),...L(763,[94,'FABRICA EXEMPLO']),...L(714,[94,'CNPJ: 00.000.000/0001-00']),...L(679,[40,'Qt.'],[87,'Produto/Serviço'],[239,'Detalhe do item'],[456,'Valor unitário'],[535,'Subtotal'])].forEach(t=>o4.push({...t,y:t.y-1000}));
  o4.push(...L(660-1000,[42,'10'],[87,'E2002P - Bermuda em Helanca'],[239,'PP - TACTEL'],[487,'40,00'],[535,'400,00']),...L(649-1000,[87,'Escolar P']),
    ...L(620-1000,[42,'205'],[87,'APLIC1 - Aplicação de Silkscreen'],[487,'1,00'],[535,'205,00']),...L(590-1000,[443,'Total'],[533,'6.705,00']),...L(42-1000,[525,'Página 2 de 2']));
  r=await A.evaluate(o=>{const hq=o.filter(t=>t.y<0).find(t=>/^produto\/servi/i.test(t.s));const it=o.filter(t=>!(t.y<0&&hq&&t.y>=hq.y-3));const g=grupoCA(lerContaAzul(it,'x.pdf'));
    return {end:g.end,email:g.email,n:g.itens.length,i0:g.itens[0]&&g.itens[0].g,b:g.itens[1]&&{g:g.itens[1].g,nome:g.itens[1].caNome,cod:g.itens[1].caCod},ex:g.fin.extras.length}},o4);
  ok(r.email==='contato@escolateste.com'&&!r.end,'texto institucional não vira endereço');
  ok(JSON.stringify(r.i0)==='{"2":20,"4":40,"6":20,"8":10}','grade sem rótulo (2/20 - 4/40…) vira os tamanhos');
  ok(r.n===2&&r.b&&JSON.stringify(r.b.g)==='{"2":15,"4":10,"6":10,"P":10}'&&r.b.cod==='E2002'&&!/MARTINS|EXEMPLO|Produto/.test(r.b.nome),'uma linha por tamanho (E200202, E200204…) vira uma peça com grade, mesmo passando de página');
  ok(r.ex===1,'“Aplicação de…” vai para serviços, não vira peça');
  console.log('2) Criar o pré-pedido');
  r=await A.evaluate(o=>{const F=lerContaAzul(o,'orc.pdf');F.ca=true;openSheet({t:'imp',gi:0,grupos:[grupoCA(F)]});const g=ui.sheet.grupos[0];g.cliNovo=true;g.vend=state.pessoas.find(p=>temPapel(p,'vendas')).id;render();
    const tit=document.querySelector('.sheet h1').innerText,bt=document.querySelector('[data-a=impCriar]').innerText,val=/Valores no Conta Azul/.test(document.querySelector('.sheet').innerText);
    document.querySelector('[data-a=impCriar]').click();const ped=state.pedidos.find(p=>p.ficha==='9101');const c=ped&&cliById(ped.cli);
    A.pedido({id:ped.id});const txt=document.querySelector('.sheet').innerText;return {tit,bt,val,pre:ped.pre,fonte:ped.fonte,lib:liberado(ped),tel:c.tel,cid:c.cidade,banner:/Pré-pedido do Conta Azul/.test(txt)&&!!document.querySelector('.sheet [data-a=pedEditar].big'),fin:/Valores \(Conta Azul\)/.test(txt),tarefa:tarefasEsc().some(t=>t.ped.id===ped.id&&/Conta Azul/.test(t.t)),id:ped.id}},o1);
  ok(/Conta Azul/.test(r.tit)&&/pré-pedido/i.test(r.bt)&&r.val,'tela mostra “Importar pedido do Conta Azul”, os valores e o botão Criar pré-pedido');
  ok(r.fonte==='contaazul'&&r.pre&&r.pre.some(x=>/cor/.test(x))&&r.pre.some(x=>/tamanhos/.test(x))&&!r.lib,'pedido entra como pré-pedido e não libera o corte ('+(r.pre||[]).join(', ')+')');
  ok(r.banner&&r.fin&&r.tarefa,'no pedido: aviso com Completar, bloco de valores e tarefa no escritório');
  ok(r.tel==='(11) 4000-1234'&&r.cid==='Campinas','empresa guarda telefone e endereço');
  r=await A.evaluate(id=>{const ls=lotesDe(id);ls.forEach(l=>{l.cor=l.cor||Object.keys(state.cores)[0];l.tecido=l.tecido||tecidosAll()[0];if(!Object.values(l.grade||{}).some(Boolean))l.grade={M:5,G:5};l.g=l.grade;(l.pers||[]).forEach(x=>{x.tam=x.tam||'7 cm';if(!x.pos&&posDe(x.parte).length)x.pos=posDe(x.parte)[0]})});const ped=pedById(id);const f=faltaPed(ped);if(f.length)ped.pre=f;else delete ped.pre;return {pre:ped.pre||null,f}},r.id);
  ok(!r.pre,'completando cor, tamanhos e a medida do logo, o pré-pedido some');
  console.log('3) Clientes em lote');
  r=await A.evaluate(async([a,b2,c])=>{const P={x1:a,x2:b2,x3:c};lerFicha=async f=>{const F=lerContaAzul(P[f.name.split('.')[0]],f.name);F.ca=true;return [F]};const n0=state.clientes.length,np=state.pedidos.length;
    await importarClientesCA(['x1','x2','x3'].map(n=>new File(['%PDF'],n+'.pdf',{type:'application/pdf'})));const L=ui.sheet.L.map(x=>({nome:x.nome,ex:!!x.ex,n:x.n}));
    document.querySelector('[data-a=impCliOk]').click();const c2=state.clientes.find(x=>/teste dois/i.test(x.nome));return {L,n0,n1:state.clientes.length,np,np1:state.pedidos.length,c2:c2&&{cnpj:c2.cnpj,tel:c2.tel,email:c2.email}}},[o1,o2,o3]);
  ok(r.L.length===2&&r.L.some(x=>x.ex)&&r.L.find(x=>x.ex).n===2,'mesmo CNPJ em dois orçamentos vira uma empresa só; a já cadastrada é reconhecida');
  ok(r.n1===r.n0+1&&r.np1===r.np,'salva só a empresa nova, sem criar pedido');
  ok(r.c2&&r.c2.cnpj==='22.222.222/0001-22'&&r.c2.tel&&r.c2.email,'empresa nova com CNPJ, telefone e e-mail');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
