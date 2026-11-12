// Teste: relatório "Entregas por semana" (pedido de 12/11/2026, refeito no mesmo dia).
// Semanas de segunda a domingo; prazo classificado numa regra só (vencido, hoje, próximos 5 dias úteis, demais);
// PDF em texto, com quebra de página calculada: nada cortado, nada perdido, nada repetido.
// Rodar: NODE_PATH=$(npm root -g) node tests/entregas-semana.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:820,height:1100}});A.on('pageerror',e=>erros.push(e.message));
  // usa o jsPDF local se existir (roda sem internet); senão, o do app (cdnjs)
  try{const js=require.resolve('jspdf/dist/jspdf.umd.min.js');await A.route(/jspdf\.umd\.min\.js/,r=>r.fulfill({path:js,contentType:'text/javascript'}))}catch(e){}
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.inicio=null;state.feriados=FER0()});

  // 1) a regra do prazo
  let r=await A.evaluate(()=>{const ref='2026-11-12',lim=limiteBreve(ref);const k=d=>prazoEnt(d,ref,lim,false);
    const sex=limiteBreve('2026-11-13'),sab=limiteBreve('2026-11-14');
    state.feriados={...FER0(),extras:[{d:'2026-11-17',n:'Teste'}]};const comFer=limiteBreve('2026-11-12');state.feriados=FER0();
    return {lim,venc:k('2026-11-11'),hoje:k('2026-11-12'),pri:k('2026-11-13'),fds:k('2026-11-15'),quinto:k('2026-11-19'),depois:k('2026-11-20'),sem:k(null),ent:prazoEnt('2026-11-01',ref,lim,true),sex,sab,comFer,
      fuso:diaLocal(Date.UTC(2026,10,13,1,30)),fuso2:diaLocal(Date.UTC(2026,10,12,3,30)),
      t1:tituloSemana(segDaSemana('2026-11-12')),t2:tituloSemana(segDaSemana('2026-12-02')),t3:tituloSemana(segDaSemana('2027-01-01')),t4:tituloSemana(segDaSemana('2026-12-20')),dom:segDaSemana('2026-11-15')}});
  ok(r.lim==='2026-11-19','referência quinta 12/11: a faixa amarela vai até 19/11 (13, 16, 17, 18 e 19)');
  ok(r.venc==='venc'&&r.hoje==='hoje','antes da referência = ATRASADO; no dia = HOJE');
  ok(r.pri==='breve'&&r.quinto==='breve','primeiro e quinto dia útil ficam em EM BREVE');
  ok(r.fds==='breve','entrega no domingo dentro da janela também fica em EM BREVE (data não muda)');
  ok(r.depois==='prog','o dia seguinte ao limite fica PROGRAMADO');
  ok(r.sem==='sem'&&r.ent==='entregue','sem data fica separado; pedido entregue nunca vira atrasado');
  ok(r.sex==='2026-11-23'&&r.sab==='2026-11-23','emissão na sexta e no sábado: pula o fim de semana e o feriado de 20/11 (limite 23/11)');
  ok(r.comFer==='2026-11-23','feriado cadastrado pela fábrica não conta como dia útil');
  ok(r.fuso==='2026-11-12'&&r.fuso2==='2026-11-12','a data é o dia de São Paulo, não o do UTC (22h30 e 0h30 de 12/11)');
  ok(r.t1==='09 a 15/11/2026'&&r.t2==='30/11/2026 a 06/12/2026'&&r.t3==='28/12/2026 a 03/01/2027'&&r.t4==='14 a 20/12/2026','semana de segunda a domingo; virada de mês e de ano com as duas datas completas');
  ok(r.dom==='2026-11-09','domingo 15/11 pertence à semana que começa na segunda 09/11');

  // 2) dados e PDF
  r=await A.evaluate(async()=>{const T=s=>new Date(s+'T12:00:00-03:00').getTime();const molde=state.pedidos.find(p=>!p.concluido&&!p.cancelado),base=state.lotes.filter(l=>!l.rework);
    const add=(id,cli,dia,n,extra={})=>{state.pedidos.push({...JSON.parse(JSON.stringify(molde)),id,ficha:'',cliente:cli,entrega:dia?T(dia):null,evento:false,concluido:null,cancelado:null,...extra});
      for(let k=0;k<n;k++){const l=JSON.parse(JSON.stringify(base[k%base.length]));l.id=id+'L'+k;l.ped=id;l.qtd=10+k;l.cor='Cor '+k;delete l.mock;state.lotes.push(l)}};
    add('XGRANDE','CLIENTE COM MUITOS ITENS','2026-11-18',120,{ficha:'7777'});add('XSEMDATA','CLIENTE SEM DATA',null,1);
    add('XLONGO','CONFECÇÃO DE UNIFORMES PROFISSIONAIS COM NOME MUITO MUITO COMPRIDO LTDA','2026-11-13',2,{evento:true});
    add('XENT','JÁ ENTREGUE','2026-11-05',1,{concluido:T('2026-11-06')});add('XATR','CLIENTE ATRASADO','2026-11-10',1,{ficha:'5555'});add('XHOJE','CLIENTE DE HOJE','2026-11-12',1);RC={};
    await libPdf();const D=dadosEntregas(T('2026-11-12'));const {doc,pags,fim}=pdfEntregas(D,{compress:false});const raw=doc.output();
    const bl=pags.flatMap(p=>p.blocos);const ini=bl.filter(x=>x.t==='linha'&&!x.cont),ids=ini.map(x=>x.L.id);
    const abertos=state.pedidos.filter(p=>!p.concluido&&!p.cancelado).map(p=>p.id);
    const itensPdf=bl.filter(x=>x.t==='linha').reduce((t,x)=>t+x.it.filter(i=>i.q).length,0),itensFonte=sum(D.semanas.flatMap(w=>w.linhas).map(l=>l.itens.length));
    const g=bl.filter(x=>x.t==='linha'&&x.L.id==='XGRANDE');
    const sobra=pags.map(p=>p.blocos).filter(bs=>bs.length&&bs[bs.length-1].t==='banda').length;
    const L=id=>D.semanas.flatMap(w=>w.linhas).find(l=>l.id===id);
    return {pg:pags.length,estoura:bl.filter(x=>x.y+(x.h||7.2)>fim+0.01).length,todos:abertos.every(id=>ids.includes(id))&&ids.length===abertos.length,semEnt:!ids.includes('XENT'),
      itens:itensPdf===itensFonte,partes:g.length,cont:g.slice(1).every(x=>x.cont&&x.itCont),contTxt:/continua/.test(raw),sobra,total:D.total===abertos.length,
      ultima:D.semanas[D.semanas.length-1].tit,semNum:L('XSEMDATA').num==='',longo:L('XLONGO').evento,
      txt:['Entregas por semana','Situação em: 12/11/2026','Página 1 de '+pags.length,'Vermelho: prazo vencido','Laranja: hoje','Amarelo: próximos 5 dias úteis','Branco: demais datas','Sem nº','Itens ','NÃO ATRASAR','FICHAS DE','ATRASADO','PROGRAMADO','EM BREVE','HOJE'].filter(t=>!raw.includes(t)),
      nAtr:(raw.match(/NÃO ATRASAR/g)||[]).length,nEvt:D.semanas.flatMap(w=>w.linhas).filter(l=>l.evento).length,desc:descEnt(D)}});
  ok(r.estoura===0,'nenhuma linha passa do espaço do rodapé ('+r.pg+' páginas)');
  ok(r.todos&&r.total,'todos os pedidos em aberto aparecem uma vez só; o total do cabeçalho vem dos dados');
  ok(r.semEnt,'pedido entregue não aparece');
  ok(r.itens,'todos os itens da fonte estão no PDF, sem perder nem repetir');
  ok(r.partes>=2&&r.cont&&r.contTxt,'pedido maior que uma página é dividido, repetindo o cliente e com "Itens — continuação"');
  ok(r.sobra===0,'faixa da semana nunca fica sozinha no fim da página');
  ok(r.ultima==='Sem data de entrega'&&r.semNum,'pedido sem data vai no fim, em "Sem data de entrega"; sem número mostra "Sem nº"');
  ok(!r.txt.length,'o PDF tem texto de verdade com cabeçalho, legenda, rótulos e "Página X de Y"'+(r.txt.length?' — faltou: '+r.txt.join(', '):''));
  ok(r.nAtr===r.nEvt&&r.longo,'"NÃO ATRASAR" só nos pedidos de evento');
  ok(/pedidos em aberto \(sem os entregues e os cancelados\)/.test(r.desc),'o cabeçalho diz quais pedidos entraram');

  // 3) tela
  r=await A.evaluate(()=>{RC={};ui.sheet=null;ui.pv='ped';ui.tela='pedidos';render();const bt=!!document.querySelector('[data-a=entregas]');A.entregas();const t=document.getElementById('sheet').innerText;
    return {bt,leg:/Vermelho: prazo vencido/.test(t)&&/Amarelo: próximos 5 dias úteis/.test(t),bts:/Baixar PDF/.test(t)&&/Imprimir/.test(t),chip:/ATRASADO|EM BREVE|PROGRAMADO|HOJE/.test(t),sit:/Situação em/.test(t)}});
  ok(r.bt,'a tela Pedidos tem o botão "Planilha de entregas por semana"');
  ok(r.leg&&r.bts&&r.chip&&r.sit,'a tela mostra a situação, a legenda, o rótulo de cada prazo, Baixar PDF e Imprimir');
  ok(!erros.length,'sem erros na página'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
