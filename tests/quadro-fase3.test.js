// Teste: fase 3 do quadro (16/11): cartão do pedido no QR code (sem login), avisos "Para você" no sininho, calendário com resumo,
// Caixa de entrada (anotação que vira pedido) e importação do JSON do Trello (sem repetir ao importar de novo).
// (espera o app carregar antes de usar seed(): no GitHub o carregamento às vezes passa de 1,2 s)
// Rodar: NODE_PATH=$(npm root -g) node tests/quadro-fase3.test.js
const { chromium } = require('playwright');const path=require('path'),fs=require('fs');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const ctx=await b.newContext({viewport:{width:1100,height:900}});
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));await ctx.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForFunction(()=>typeof seed==="function"&&typeof normalizar==="function"&&typeof render==="function",null,{timeout:60000});await A.waitForTimeout(1200);
  const ent=(i)=>A.evaluate(i=>{const u=state.usuarios[i];SESSAO={id:u.id,email:u.email};ui.sheet=null;ui.sino=false;render()},i);
  await A.evaluate(()=>{seed();state=normalizar(state);NV.pronto=true;ui.tela='pedidos';ui.pv='qd'});await ent(0);

  console.log('1) Cartão do pedido no QR code, sem login');
  const T=await A.evaluate(()=>{const p=state.pedidos.find(p=>!p.concluido&&!p.cancelado&&lotesDe(p.id).length);const l=lotesDe(p.id)[0];l.qr='ab12cd34ef56ab12cd34ef56ab12cd';
    p.etq=['urgente'];qdCkGarante(p);p.ck[0].itens[0].ok=true;p.ck[0].itens[0].por='Regina';p.ck[0].itens[0].em=now();p.resp=[state.usuarios[1].id];p.coment=[{id:'c1',t:'COMENTARIO INTERNO',ts:now(),por:'x',m:[]}];save();
    return {tok:l.qr,id:p.id,qdc:p.qdc,col:qdColDe(p).nome}});
  ok(T.qdc&&T.qdc.n===T.col&&!T.qdc.r&&Array.isArray(T.qdc.ck)&&/ - /.test(T.qdc.t),'ao salvar, o pedido guarda a coluna, o título e a contagem do checklist para o QR, sem nomes ('+T.qdc.n+')');
  const Q=await ctx.newPage();Q.on('pageerror',e=>erros.push('QR: '+e.message));await Q.goto(APP+'#f='+T.tok);await Q.waitForSelector('.pub-qd',{timeout:60000}).catch(()=>{});await Q.waitForTimeout(1500);
  let r=await Q.evaluate(()=>{const c=document.querySelector('.pub-qd');return {tem:!!c,txt:c?c.innerText:'',body:document.body.innerText,link:!!document.querySelector('a[href*="#pedido="]')}});
  ok(r.tem&&r.txt.includes(T.qdc.n)&&/Urgente/.test(r.txt)&&/1\/\d+/.test(r.txt)&&/Feito em/.test(r.txt)&&!/Regina/.test(r.txt),'quem lê o QR vê o cartão: coluna, etiqueta e checklist com a data, sem o nome de quem marcou');
  ok(!/COMENTARIO INTERNO/.test(r.body)&&/entre no app/.test(r.txt),'sem comentários; para marcar, precisa entrar no app');ok(r.link,'link "Abrir este pedido no app" para quem tem acesso');
  const sql=fs.readFileSync(path.join(__dirname,'../supabase/migrations/017_qr_cartao.sql'),'utf8');
  ok(/'qdc', \(p->'qdc'\) - 'r'/.test(sql)&&/'ck', public.ck_publico\(p->'ck'\)/.test(sql)&&/'etq', p->'etq'/.test(sql)&&/'quadro', cfg->'quadro'/.test(sql)&&/'link', data->>'link'/.test(sql)&&!/coment/.test(sql.replace(/^--.*$/mg,'')),'migração 017 manda ao QR o cartão (sem comentários e sem nomes de quem trabalhou)');

  console.log('2) Avisos "Para você"');
  r=await A.evaluate(id=>{const p=pedById(id);const u1=state.usuarios[1];p.resp=[];A.qdResp({id,u:u1.id});A.cmEnvia&&(ui.sheet={t:'pedido',id},render(),document.getElementById('cmNovo').value='Confere a linha @'+uNomeQ(u1),A.cmEnvia({id}));
    p.entrega=now()+DIA;p.lemb=2;save();return u1.id},T.id);
  await ent(1);r=await A.evaluate(()=>{const u=usuarioAtual(),N=notifsNovas(u);document.querySelector('.sino').click();const pop=document.getElementById('pop').innerText;return {k:N.map(n=>n.k).sort().join(','),pop:/Marcar todos como vistos/.test(pop)&&!/Nenhum aviso novo/.test(pop)&&/pôs você como responsável/.test(pop)&&/avisou você/.test(pop),badge:document.querySelector('.sino em')?.textContent}});
  ok(r.k.includes('resp')&&r.k.includes('menc')&&(r.k.includes('prazo')||r.k.includes('atraso')),'avisos: posto como responsável, avisado num comentário e prazo ('+r.k+')');ok(r.pop&&+r.badge>=3,'aparecem no sininho como novos, sem "Nenhum aviso novo", com o número ('+r.badge+')');
  r=await A.evaluate(id=>{document.querySelector(`#pop [data-a=ntAbrir][data-id="${id}"]`).click();const t=ui.sheet&&ui.sheet.t;return {t,n:notifsNovas(usuarioAtual()).filter(n=>n.p.id===id).length}},T.id);
  ok(r.t==='pedido'&&r.n===0,'tocar no aviso abre o pedido e ele deixa de ser novo');
  r=await A.evaluate(id=>{const u=usuarioAtual();const p=pedById(id);p.lemb=0;p.ntVisto={};return notifsDe(u).filter(n=>n.p.id===id).map(n=>n.k).join(',')},T.id);ok(!/prazo/.test(r),'"Não avisar" desliga o aviso de prazo');
  await ent(0);r=await A.evaluate(()=>notifsNovas(usuarioAtual()).filter(n=>n.k==='resp').length);ok(r===0,'quem pôs o responsável não recebe aviso de si mesmo');

  console.log('3) Calendário e resumo');
  r=await A.evaluate(()=>{ui.sheet=null;ui.pv='cal';ui.calM=null;render();const ps=state.pedidos.filter(p=>!p.cancelado&&p.entrega&&new Date(p.entrega).getMonth()===new Date(now()).getMonth()&&new Date(p.entrega).getFullYear()===new Date(now()).getFullYear());
    const n=document.querySelectorAll('.cal .cal-p').length;const at=state.pedidos.filter(p=>!p.cancelado&&!p.concluido&&p.entrega<now()).length;const kpi=+document.querySelector('.qd-kpi.crit b').textContent;
    A.calMes({d:1});const m2=document.querySelector('.cal-nav h2').textContent;A.calMes({d:0});return {n,esp:ps.length,at,kpi,m2,bt:!!document.querySelector('.vista-b[data-v=cal][aria-pressed=true]')}});
  ok(r.bt&&r.n===r.esp,`calendário mostra cada entrega do mês no dia dela (${r.n})`);ok(r.kpi===r.at,'resumo: atrasados ('+r.at+')');ok(/ de \d{4}/.test(r.m2),'muda o mês ('+r.m2.trim()+')');
  r=await A.evaluate(()=>{document.querySelector('.qd-kpi.crit').click();return {pv:ui.pv,pz:qdF().pz.join()}});ok(r.pv==='qd'&&r.pz==='atrasado','tocar em "atrasados" abre o Quadro filtrado');
  await A.evaluate(()=>{qdF().pz=[];render()});

  console.log('4) Caixa de entrada');
  r=await A.evaluate(()=>{ui.pv='qd';render();const fechada=!document.getElementById('ntNova');A.qdIr({c:'caixa'});window.__fech=fechada;document.getElementById('ntNova').value='Escola X quer 80 camisetas para março';A.ntAdd();const n=state.notas.find(x=>/Escola X/.test(x.t));const doc=Object.keys(paraDocs(state)).some(k=>k==='notas/'+n.id);
    const vis=[...document.querySelectorAll('.qd-caixa .qd-nota')].some(e=>/Escola X/.test(e.textContent));A.ntVira({id:n.id});const w=ui.sheet&&ui.sheet.w;return {por:n.por,doc,vis,obs:w&&w.obs,nota:w&&w.nota===n.id,id:n.id}});
  ok(r.vis&&r.por&&r.doc,'anotação guardada (documento próprio em notas/) e aparece na Caixa de entrada');ok(await A.evaluate(()=>window.__fech),'Caixa de entrada vazia fica recolhida (abre pelo botão)');ok(r.obs&&/Escola X/.test(r.obs)&&r.nota,'Virar pedido abre o Novo pedido com a anotação nas Observações');
  r=await A.evaluate(nid=>{const p=state.pedidos[0];notaVirou(nid,p.id);ui.sheet=null;render();const n=state.notas.find(x=>x.id===nid);return {feito:n.feito&&n.feito.ped===p.id,some:![...document.querySelectorAll('.qd-caixa .qd-nota')].some(e=>/Escola X/.test(e.textContent)),h:qdHistLista(p).some(e=>/anotação/.test(e.t))}},r.id);
  ok(r.feito&&r.some&&r.h,'depois de virar pedido, sai da caixa e fica no histórico do pedido');
  r=await A.evaluate(()=>{document.getElementById('ntNova').value='teste tirar';A.ntAdd();const n=state.notas.find(x=>x.t==='teste tirar');document.querySelector(`[data-a=ntRm][data-id="${n.id}"]`).click();const pede=!!ui.conf;A.confSim();return {pede,feito:!!n.feito,existe:state.notas.includes(n)}});
  ok(r.pede&&r.feito&&r.existe,'tirar pede confirmação e não apaga o registro');

  console.log('5) Importar do Trello');
  const J=await A.evaluate(()=>{const p=state.pedidos.find(p=>!p.cancelado&&!p.ck);p.ficha='6262';return {pid:p.id,J:{lists:[{id:'L1',name:'Costura',closed:false},{id:'L2',name:'Velha',closed:true}],
    labels:[{id:'b1',name:'NÃO ATRASAR',color:'yellow'},{id:'b2',name:'EVENTO',color:'pink'},{id:'b3',name:'Amostra aprovada',color:'green_dark'}],
    cards:[{id:'C1',name:'6262 CLIENTE X - polos e camisetas',desc:'- 48 polos malha fria',idList:'L1',idLabels:['b1','b2','b3'],closed:false,due:'2026-12-01T20:00:00.000Z',dateLastActivity:'2026-11-10T12:00:00.000Z',
        attachments:[{id:'at1',name:'ficha.docx',url:'https://trello.com/1/cards/C1/attachments/at1/download/ficha.docx',date:'2026-11-09T10:00:00.000Z',bytes:20480}]},
      {id:'C2',name:'Escola Nova - moletons',desc:'60 moletons',idList:'L1',idLabels:[],closed:false,dateLastActivity:'2026-11-11T12:00:00.000Z'},
      {id:'C3',name:'9999 Arquivado',idList:'L1',closed:true},{id:'C4',name:'1234 lista fechada',idList:'L2',closed:false}],
    checklists:[{id:'K1',idCard:'C1',name:'Início de Produção',pos:1,checkItems:[{id:'i1',name:'Tem Mockup?',state:'complete',pos:1},{id:'i2',name:'Fez ficha?',state:'incomplete',pos:2}]}],
    actions:[{id:'a1',type:'commentCard',date:'2026-11-08T10:00:00.000Z',memberCreator:{fullName:'Laura'},data:{card:{id:'C1'},text:'Cliente aprovou'}},
      {id:'a2',type:'updateCheckItemStateOnCard',date:'2026-11-07T10:00:00.000Z',memberCreator:{fullName:'Laura'},data:{card:{id:'C1'},checkItem:{id:'i1',state:'complete'}}}]}}});
  r=await A.evaluate(J=>{const P=trelloPlano(J);openSheet({t:'trello',plano:P});const txt=document.getElementById('sheet').innerText;return {lig:P.lig.length,cx:P.caixa.length,novas:P.etqNovas.map(e=>e.nome+':'+e.cor),txt:/1 cartão vai para pedidos/.test(txt)&&/Caixa de entrada/.test(txt)}},J.J);
  ok(r.lig===1&&r.cx===1,'arquivados e listas fechadas ficam de fora; 1 cartão vai para o pedido, 1 para a Caixa de entrada');ok(r.novas.join()==='Amostra aprovada:verde'&&r.txt,'mostra antes o que vai entrar, com a etiqueta nova');
  r=await A.evaluate(pid=>{A.trOk();const p=pedById(pid);const it=p.ck&&p.ck[0].itens;return {evento:p.evento,etq:qdEtqDe(p).map(id=>qdEtqs().find(e=>e.id===id).nome),ck:it&&it.map(i=>i.t+':'+i.ok+':'+(i.por||'')),cm:(p.coment||[]).map(c=>c.por+'|'+c.t.slice(0,20)),
    ax:anexosPed(p).filter(a=>a.link).map(a=>a.nome),nota:state.notas.some(n=>n.tr==='C2'&&/Escola Nova/.test(n.t)),h:qdHistLista(p).some(e=>/Importou do Trello/.test(e.t)),pv:ui.pv}},J.pid);
  ok(r.evento&&r.etq.some(e=>e.toLowerCase()==='não atrasar')&&r.etq.includes('Amostra aprovada'),'etiquetas do cartão, achando a que já existe mesmo com outra letra (EVENTO liga "pedido para evento") ('+r.etq.join(', ')+')');
  ok(r.ck&&r.ck[0]==='Tem Mockup?:true:Laura (Trello)'&&r.ck[1]==='Fez ficha?:false:','checklist com quem marcou no Trello');
  ok(r.cm.some(c=>/Laura \(Trello\)\|Cliente aprovou/.test(c))&&r.cm.some(c=>/Descrição no Trello/.test(c)),'comentários e descrição viram comentários do pedido');
  ok(r.ax.includes('ficha.docx')&&r.nota&&r.h&&r.pv==='qd','anexo como link, cartão sem pedido na Caixa de entrada, histórico');
  r=await A.evaluate(([J,pid])=>{const p=pedById(pid),n=[(p.coment||[]).length,anexosPed(p).length,state.notas.length];trelloAplica(trelloPlano(J));return JSON.stringify(n)===JSON.stringify([(p.coment||[]).length,anexosPed(p).length,state.notas.length])},[J.J,J.pid]);
  ok(r,'importar de novo não repete nada');

  console.log('6) Celular 360×640 e eventos');
  await A.setViewportSize({width:360,height:640});
  for(const pv of ['cal','qd']){r=await A.evaluate(pv=>{ui.sheet=null;ui.pv=pv;render();const app=document.getElementById('app');const dentro=e=>e.closest('.qd,.qd-cols');
    const largo=[...app.querySelectorAll('*')].filter(e=>!dentro(e)&&e.getBoundingClientRect().width&&e.getBoundingClientRect().right>window.innerWidth+1).map(e=>e.className).slice(0,3);
    const zona=[...app.querySelectorAll('.qd-res,.cal-nav,.cal-l,.qd-caixa')];const peq=zona.flatMap(z=>[...z.querySelectorAll('button')]).filter(e=>e.offsetParent&&e.getBoundingClientRect().height<48).map(e=>e.textContent.trim().slice(0,15));
    const letra=zona.flatMap(z=>[...z.querySelectorAll('*')]).filter(e=>e.offsetParent&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<16).map(e=>e.textContent.trim().slice(0,15));
    return {largo,peq,letra}},pv);ok(!r.largo.length&&!r.peq.length&&!r.letra.length,(pv==='cal'?'calendário':'caixa de entrada')+': sem cortes, alvos ≥ 48px, letra ≥ 16px'+JSON.stringify(r))}
  r=await A.evaluate(()=>[...new Set(EV.fila.map(e=>e.tipo).filter(t=>!EV_TIPOS[t]))]);ok(!r.length,'todo evento usa um nome do catálogo'+(r.length?': '+r:''));
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.slice(0,3).join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
