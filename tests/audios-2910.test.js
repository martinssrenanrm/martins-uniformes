// Teste: pedidos da Martins de 28 e 29/10.
// 1) "Manga direita" (atalho) travava o Próximo com "Falta: lugar exato" e não tinha onde escolher.
// 2) Filtro de Pedidos com vários marcados de uma vez (ex.: só os em produção).
// Rodar: NODE_PATH=$(npm root -g) node tests/audios-2910.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:390,height:900}});A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.inicio=null});
  console.log('1) Lugar exato na manga');
  let r=await A.evaluate(()=>{const p=state.produtos.find(x=>(x.partes||[]).includes('Mangas'));openSheet({t:'novo',w:{step:2,cliente:'Teste',cli:null,contato:'',cnpj:'',vend:state.pessoas[0].id,entrega:null,err:'',itens:[]}});A.wAdd({p:p.id});
    A.wPadd({k:'0'});const t=state.tipos.find(x=>faseG(x.grupo)==='pers').id;A.wPt({k:'0',v:t});
    const iMd=locaisPers(p).findIndex(x=>x.n==='Manga direita');A.wPloc({k:'0',v:String(iMd)});
    const ops=[...document.querySelectorAll('#sheet [data-a=wPlocPos]')].map(b=>b.textContent.trim());const trava=document.querySelector('#sheet [data-a=wPok]').disabled;
    document.getElementById('wPtam0').value='4 cm';document.getElementById('wPobs0').value='Bandeira do Brasil';
    [...document.querySelectorAll('#sheet [data-a=wPlocPos]')].find(b=>b.textContent.trim()==='Perto da barra').click();
    const tamFica=document.getElementById('wPtam0').value;const libera=!document.querySelector('#sheet [data-a=wPok]').disabled;document.querySelector('#sheet [data-a=wPok]').click();
    const x=ui.sheet.w.itens[0].pers[0];
    // pedido antigo, salvo antes da correção: manga sem lugar exato tem que dar para completar no próprio cartão
    ui.sheet.w.itens[0].pers.push({tipo:t,parte:'Mangas',lado:'esq',tam:'4 cm'});render();const sel=document.querySelector('#sheet [data-a=wPzPos][data-j="1"], #sheet select[data-sel=wPzPos][data-j="1"]');
    const cartao=!!sel;A.wPzPos({k:'0',j:'1',v:'Meio da manga'});const y=ui.sheet.w.itens[0].pers[1];
    ui.sheet.w.itens[0].pers.push({tipo:t,parte:'Mangas',tam:'4 cm'});render();const lado=document.querySelectorAll('#sheet [data-a=wPzLado][data-j="2"]').length;A.wPzLado({k:'0',j:'2',v:'dir'});const temSel=!!document.querySelector('#sheet [data-j="2"][data-sel=wPzPos], #sheet select[data-j="2"]');
    return {ops,trava,libera,tamFica,x,cartao,y,f:faltaPz(y),lado,temSel}});
  ok(r.trava,'tocar em Manga direita sem dizer onde na manga não deixa adicionar');
  ok(r.ops.join('|')==='Ombro (parte alta)|Meio da manga|Perto da barra','aparecem as opções da manga ali mesmo: '+r.ops.join(', '));
  ok(r.libera&&r.tamFica==='4 cm','escolheu o lugar, libera; a medida digitada não some');
  ok(r.x&&r.x.parte==='Mangas'&&r.x.lado==='dir'&&r.x.pos==='Perto da barra','logo salvo completo: manga direita, perto da barra');
  ok(r.cartao&&r.y.pos==='Meio da manga'&&!r.f.length,'manga sem lugar exato (pedido antigo) mostra o campo no cartão e se resolve ali, sem apagar');
  ok(r.lado===3&&r.temSel,'manga sem lado mostra Esquerda, Direita ou As duas no cartão e depois o lugar exato');
  console.log('2) Filtro de Pedidos com vários marcados');
  r=await A.evaluate(()=>{ui.sheet=null;ui.tela='pedidos';ui.pf=null;render();A.pfAbre({v:'f'});
    const us=state.pedidos.map(p=>info(p).u);const nProd=us.filter(u=>['crit','warn','ok'].includes(u)).length;
    document.querySelector('[data-a=pfSt][data-v=prod]').click();const vis1=document.querySelectorAll('#pedLista .ped').length;const rot1=document.querySelector('.fo-b span').textContent;const aberto=!!document.querySelector('[data-a=pfSt]');
    const ver=document.querySelector('.fo-p [data-a=pfAbre]').textContent;
    document.querySelector('[data-a=pfSt][data-v=pronto]').click();const vis2=document.querySelectorAll('#pedLista .ped').length;const nPronto=us.filter(u=>u==='pronto').length;const rot2=document.querySelector('.fo-b span').textContent;
    let mem=null;try{mem=JSON.parse(localStorage.getItem('pf-st'))}catch(e){}
    ui.pf=null;render();const volta=document.querySelector('.fo-b span').textContent;
    ui.pfAb=null;A.pfAbre({v:'f'});document.querySelector('[data-a=pfSt][data-v=todos]').click();const todos=document.querySelectorAll('#pedLista .ped').length;
    ui.pf={st:'cancel',ord:'urg',q:'',inv:false};render();const velho=document.querySelectorAll('#pedLista .ped').length===us.filter(u=>u==='cancel').length;
    return {nProd,vis1,rot1,aberto,ver,vis2,nPronto,rot2,mem,volta,todos,tot:state.pedidos.length,velho}});
  ok(r.vis1===r.nProd&&r.rot1==='Em produção','atalho "Em produção" mostra só Atrasando, Atenção e Em dia ('+r.vis1+')');
  ok(r.aberto&&new RegExp('Ver '+r.vis1+' pedido').test(r.ver),'o painel continua aberto para marcar mais, com o botão "Ver N pedidos"');
  ok(r.vis2===r.nProd+r.nPronto&&r.rot2==='4 filtros','marca mais um (Prontos) e soma na lista');
  ok(Array.isArray(r.mem)&&r.mem.length===4&&r.volta==='4 filtros','o filtro fica guardado no aparelho');
  ok(r.todos===r.tot,'Todos limpa o filtro');
  ok(r.velho,'filtro antigo (um só) continua funcionando');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
