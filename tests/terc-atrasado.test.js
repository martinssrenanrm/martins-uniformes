// Teste: "Terceirizado atrasou?" (11/2026). Fábrica › Fora mostra no alto o que passou do prazo de volta,
// com quem, pedido, desde quando e dias úteis de atraso; a mesma regra vale em Hoje, Escritório e Gestor.
// Rodar: NODE_PATH=$(npm root -g) node tests/terc-atrasado.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:360,height:640}});A.on('pageerror',e=>erros.push(e.message));
  // relógio fixo numa quarta-feira (11/11/2026, 10h), para os dias úteis não dependerem do dia em que o teste roda
  await A.addInitScript(()=>{window.claude={use:async()=>null};const T0=new Date(2026,10,11,10,0,0).getTime(),d0=Date.now(),agora=Date.now.bind(Date);Date.now=()=>T0+(agora()-d0)});await A.goto(APP);await A.waitForTimeout(1200);
  await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios.find(x=>x.perfil==='gestao');SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.sheet=null;render()});

  // regra: dias úteis a partir do dia em que saiu
  let r=await A.evaluate(()=>({den:atrasoTerc(addWD(now(),-2),3),um:atrasoTerc(addWD(now(),-4),3),cinco:atrasoTerc(addWD(now(),-8),3),sem:atrasoTerc(null,3),txt:prazoTercTxt(3)+' / '+prazoTercTxt(1)}));
  ok(r.den===0,'dentro do prazo: sem atraso');
  ok(r.um===1,'4 dias úteis lá com prazo de 3: 1 dia de atraso (veio '+r.um+')');
  ok(r.cinco===5,'8 dias úteis lá com prazo de 3: 5 dias de atraso (veio '+r.cinco+')');
  ok(r.sem===0,'sem data de saída: não acusa atraso');
  ok(r.txt==='3 dias úteis / 1 dia útil','prazo escrito em dias úteis ('+r.txt+')');
  r=await A.evaluate(()=>{state.params.tercUteis=0;const x={c:atrasoTerc(now()-6*DIA-3600e3,3),t:prazoTercTxt(3)};state.params.tercUteis=1;return x});
  ok(r.c===3&&r.t==='3 dias','opção da fábrica: dias corridos (tercUteis=0)');

  // sem nada fora: a lista não aparece
  r=await A.evaluate(()=>{state.lotes.forEach(l=>Object.keys(l.steps).forEach(k=>{if(l.steps[k].st==='fora')delete l.steps[k]}));RC={};ui.tela='fabrica';ui.fz='fora';render();return !!document.getElementById('TercAtras')});
  ok(!r,'nada atrasado: a lista "Passaram do prazo" não aparece');

  // três remessas: duas atrasadas (2 e 6 dias), uma no prazo
  r=await A.evaluate(()=>{const L=[];state.lotes.forEach(l=>{const p=pedById(l.ped);if(!p||p.concluido||p.cancelado||L.length>=3)return;const z=rp(l).steps.find(isExt);if(z&&stOf(l,z.id).st==='pend')L.push({l,z})});
    if(L.length<3)return {falta:L.length};const f=fornEtapa(L[0].l,L[0].z);f.prazo=3;
    const mk=(o,u)=>{const fo=fornEtapa(o.l,o.z);fo.prazo=3;o.l.steps[o.z.id]={st:'fora',saiu:addWD(now(),-u),forn:fo.id,op:fo.leva};return {ped:o.l.ped,forn:fo.nome,saiu:o.l.steps[o.z.id].saiu}};
    const a=mk(L[0],5),c=mk(L[1],9),d=mk(L[2],1);RC={};ui.tela='fabrica';ui.fz='fora';render();
    const el=document.getElementById('TercAtras');const itens=el?[...el.querySelectorAll('.ta-item')].map(x=>x.innerText):[];
    return {a,c,d,h:el&&el.querySelector('h2').innerText,itens,desde:[fD(c.saiu),fD(a.saiu)],
      esc:tarefasEsc().filter(t=>t.late).length,lista:tercAtrasados().length,
      alvo:el?[...el.querySelectorAll('button')].map(x=>Math.round(x.getBoundingClientRect().height)):[],
      fonte:el?Math.min(...[...el.querySelectorAll('span,b')].map(x=>parseFloat(getComputedStyle(x).fontSize))):0,
      larg:document.documentElement.scrollWidth}});
  ok(!r.falta,'achou 3 peças com etapa no terceirizado no exemplo'+(r.falta!=null?' (só '+r.falta+')':''));
  if(!r.falta){
    ok(/Passaram do prazo \(2\)/.test(r.h||''),'título conta 2 atrasadas ('+r.h+')');
    ok(r.itens.length===2,'a remessa no prazo não entra na lista');
    ok(/6 dias úteis de atraso/.test(r.itens[0])&&/2 dias úteis de atraso/.test(r.itens[1]),'mais atrasada primeiro (6, depois 2)');
    ok(r.itens[0].includes(r.c.forn)&&r.itens[0].includes('Pedido '+r.c.ped)&&r.itens[0].includes('Está lá desde '+r.desde[0]),'mostra quem, de qual pedido e desde quando');
    ok(r.itens[1].includes('Está lá desde '+r.desde[1]),'a segunda também diz desde quando');
    ok(r.esc===r.lista,'Hoje/Escritório e a lista contam o mesmo ('+r.esc+' e '+r.lista+')');
    ok(r.alvo.length&&Math.min(...r.alvo)>=48,'botões com 48px ou mais ('+r.alvo.join(', ')+')');
    ok(r.fonte>=16,'letra de 16px ou mais ('+r.fonte+')');
    ok(r.larg<=360,'sem rolagem para o lado em 360px');
    // Chegou na lista tira a remessa dela
    r=await A.evaluate(()=>{const bt=document.querySelector('#TercAtras .ta-item .mbtn');bt.click();const el=document.getElementById('TercAtras');return {n:el?el.querySelectorAll('.ta-item').length:0}});
    ok(r.n===1,'Chegou na lista registra a volta e tira a remessa');
    // Gestor › Atrasos e Hoje dizem os dias de atraso
    r=await A.evaluate(()=>{const t=gAtrasos(0);const h=document.createElement('div');h.innerHTML=t;return h.innerText});
    ok(/Terceirizados atrasados/.test(r)&&/2 dias úteis de atraso/.test(r),'Gestor › Atrasos diz os dias de atraso'+(/2 dias úteis/.test(r)?'':' :: '+r.slice(r.indexOf('Terceirizados atrasados'),r.indexOf('Terceirizados atrasados')+200)));
    r=await A.evaluate(()=>{ui.tela='hoje';render();return document.getElementById('app').innerText});
    ok(/passou do prazo/.test(r)&&/dias? úte(is|l) de atraso/.test(r),'Hoje diz os dias de atraso'+(/de atraso/.test(r)?'':' :: '+r.slice(0,600)));
    // Hoje: a linha do atraso tem Chegou, que solta a peça para o próximo passo
    r=await A.evaluate(()=>{const bt=[...document.querySelectorAll('.fl-i')].find(x=>/passou do prazo/.test(x.innerText))?.querySelector('.fl-bt');if(!bt)return {bt:null};const txt=bt.innerText,h=Math.round(bt.getBoundingClientRect().height);bt.click();return {bt:txt,h,resta:tercAtrasados().length,linha:/passou do prazo/.test(document.getElementById('app').innerText)}});
    ok(r.bt==='Chegou'&&r.h>=48,'Hoje: o atraso tem o botão Chegou ('+r.bt+', '+r.h+'px)');
    ok(r.resta===0&&!r.linha,'Chegou no Hoje registra a volta e tira o atraso');
    // Gestor › Atrasos: mesma lista, com Chegou
    r=await A.evaluate(()=>{const l=state.lotes.find(l=>{const p=pedById(l.ped);return p&&!p.concluido&&!p.cancelado&&Object.values(l.steps).some(x=>x.st==='ok'&&x.forn)});const k=Object.keys(l.steps).find(k=>l.steps[k].forn);l.steps[k]={st:'fora',saiu:addWD(now(),-6),forn:l.steps[k].forn};const h=document.createElement('div');h.innerHTML=gAtrasos(0);const bt=h.querySelector('#TercAtras .mbtn');return {bt:bt&&bt.innerText,t:h.querySelector('#TercAtras h2')?.innerText}});
    ok(r.bt==='Chegou'&&/Terceirizados atrasados \(1\)/.test(r.t||''),'Gestor › Atrasos: mesma lista, com Chegou ('+r.t+')');
  }
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
