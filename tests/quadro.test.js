// Teste: vista Quadro em Pedidos (estilo Trello, pedido de 16/11).
// O cartão é o próprio pedido; a coluna é calculada pela produção (Início → Compra → máquinas → Finalizados), na peça mais atrasada.
// Confere: colunas do padrão neutro e do cliente (máquina citada pelo nome), cartão (título, período colorido, etiquetas, checklist, avatares),
// busca e filtros, etiquetas/responsáveis/checklist no pedido com quem fez e quando, histórico, configuração pela gestão
// (sem re-impor nada), módulo liga/desliga e 360×640 (alvos ≥ 48px, letra ≥ 16px, sem cortes fora do quadro).
// Rodar: NODE_PATH=$(npm root -g) node tests/quadro.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const CLI={id:'teste',nome:'Confecção Teste',admins:[{id:'u-a',email:'a@teste.test',nome:'Ana Souza'},{id:'u-b',email:'b@teste.test',nome:'Bruno Lima'}],
  quadro:{cols:[{nome:'Início',tipo:'inicio'},{nome:'Compra',tipo:'compra'},{nome:'Corte',tipo:'prod',fases:['corte']},{nome:'Personalização',tipo:'prod',fases:['pers']},
    {nome:'Costura',tipo:'prod',fases:['costura']},{nome:'Casear / Botão',tipo:'prod',maqs:['Caseadeira','Botoneira']},{nome:'Embalagem',tipo:'prod',fases:['acab']},{nome:'Finalizados',tipo:'fim'}],
    etiquetas:[{nome:'Urgente',cor:'vermelho'}],checklist:[{nome:'Início',itens:['Tem mockup?','Fez ficha?']},{nome:'Corte',itens:['Cortou?']}]}};
(async()=>{const b=await chromium.launch();const erros=[];
  const abre=async(vp,cli)=>{const A=await b.newPage({viewport:vp});A.on('pageerror',e=>erros.push(e.message));await A.addInitScript(c=>{window.claude={use:async()=>null};if(c)window.CLIENTE=c},cli||null);
    await A.goto(APP);await A.waitForTimeout(1200);
    await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.sheet=null;ui.tela='pedidos';ui.pv='qd';render()});return A};
  const col=(A,id)=>A.evaluate(id=>{RC={};const c=qdColDe(pedById(id));return c?c.nome:null},id);

  console.log('1) Padrão neutro: colunas vêm dos setores da fábrica');
  let A=await abre({width:1280,height:900});
  let r=await A.evaluate(()=>({cols:[...document.querySelectorAll('.qd-col:not(.qd-caixa) h2')].map(h=>h.firstChild.textContent),set:SETORES().map(g=>g.nome),bt:!!document.querySelector('.vista-b[data-v=qd][aria-pressed=true]'),
    n:document.querySelectorAll('.qd-card').length,vivos:state.pedidos.filter(p=>!p.cancelado&&!(p.concluido&&p.concluido<now()-30*DIA)).length,q:state.quadro}));
  ok(r.bt,'botão Quadro ao lado de Pedidos e Empresas');
  ok(r.cols[0]==='Início de produção'&&r.cols[1]==='Compra'&&r.cols[r.cols.length-1]==='Finalizados'&&r.set.every((n,i)=>r.cols[i+2]===n),'colunas: Início, Compra, um por setor, Finalizados ('+r.cols.join(' · ')+')');
  ok(r.n===r.vivos,`todo pedido não cancelado aparece uma vez (${r.n} de ${r.vivos})`);
  ok(r.q==null,'abrir o quadro não grava configuração nenhuma');

  console.log('2) A coluna anda sozinha com a produção');
  const P=await A.evaluate(()=>{const p=state.pedidos.find(p=>!p.concluido&&!p.cancelado&&lotesDe(p.id).length&&lotesDe(p.id).every(l=>!Object.values(l.steps||{}).some(s=>s.st!=='pend')));return p.id});
  await A.evaluate(id=>{const p=pedById(id);p.pre=null;p.vias=false},P);ok(await col(A,P)==='Início de produção','falta ficha → Início de produção');
  await A.evaluate(id=>{const p=pedById(id);p.vias=true;p.artePrep=true;p.arte=true;p.materiais.forEach(m=>{m.conf=true;m.st='comprar'})},P);ok(await col(A,P)==='Compra','tudo liberado, mas falta material para cortar → Compra');
  await A.evaluate(id=>{pedById(id).materiais.forEach(m=>m.st='ok')},P);r=await col(A,P);ok(r===(await A.evaluate(()=>SETORES().find(g=>g.fase==='corte').nome)),'material ok → coluna do corte ('+r+')');
  r=await A.evaluate(id=>{const L=lotesDe(id);L.forEach(l=>rp(l).steps.forEach(s=>{if(faseT(s.posto)==='corte')l.steps[s.id]={st:'ok',ini:now()-H,fim:now()}}));RC={};
    const c=qdColDe(pedById(id)).nome;const fr=rp(L[0]).steps.filter(s=>!done(L[0],s.id)&&s.deps.every(d=>done(L[0],d)));return {c,esp:QD().cols[Math.min(...L.map(l=>qdIdxLote(pedById(id),l,QD())))].nome,fr:fr.map(s=>s.nome).join(', ')}},P);
  ok(r.c===r.esp&&r.c!=='Início de produção'&&r.c!=='Compra','corte feito → próxima máquina do roteiro ('+r.c+': '+r.fr+')');
  r=await A.evaluate(id=>{const L=lotesDe(id);L.slice(1).forEach(l=>rp(l).steps.forEach(s=>l.steps[s.id]={st:'ok',ini:now()-H,fim:now()}));RC={};return {c:qdColDe(pedById(id)).nome,n:L.length}},P);
  ok(r.c!=='Finalizados','com uma peça ainda aberta, o pedido fica na coluna dela ('+r.c+')');
  r=await A.evaluate(id=>{lotesDe(id).forEach(l=>rp(l).steps.forEach(s=>l.steps[s.id]={st:'ok',ini:now()-H,fim:now()}));RC={};const a=qdColDe(pedById(id)).nome;pedById(id).concluido=now();RC={};const b=qdColDe(pedById(id)).nome;pedById(id).cancelado={ts:now()};RC={};return [a,b,qdColDe(pedById(id))]},P);
  ok(r[0]==='Finalizados'&&r[1]==='Finalizados'&&r[2]===null,'tudo pronto ou entregue → Finalizados; cancelado sai do quadro');

  console.log('3) Cartão, busca e filtros');
  const Q=await A.evaluate(()=>{const p=state.pedidos.find(p=>!p.concluido&&!p.cancelado&&lotesDe(p.id).length>0);return p.id});
  r=await A.evaluate(id=>{const p=pedById(id);p.ficha='6262';p.entrega=now()-DIA;p.evento=true;ui.qf=null;render();const c=[...document.querySelectorAll('.qd-card')].find(e=>e.dataset.id===id);
    return {t:c.querySelector('.qd-t').textContent,per:c.querySelector('.qd-per').className,etq:[...c.querySelectorAll('.qd-etq')].map(e=>e.textContent),ck:c.querySelector('.qd-rod').textContent.trim(),tit:qdTitulo(p)}},Q);
  ok(/^6262 .+ - \S/.test(r.t),'título "NÚMERO CLIENTE - produtos" ('+r.t+')');
  ok(/crit/.test(r.per),'entrega passada → período em vermelho');ok(r.etq.includes('EVENTO'),'pedido para evento mostra a etiqueta EVENTO');ok(/0\/7/.test(r.ck),'progresso do checklist no cartão ('+r.ck+')');
  r=await A.evaluate(id=>{const p=pedById(id);p.entrega=now()+DIA;RC={};const a=qdPrazo(p);p.entrega=now()+20*DIA;const b=qdPrazo(p);p.concluido=now();const c=qdPrazo(p);p.concluido=null;return [a,b,c]},Q);
  ok(r[0]==='warn'&&r[1]===''&&r[2]==='ok','amarelo perto de vencer, neutro com folga, verde quando entregue');
  await A.fill('#qdBusca','6262');r=await A.evaluate(()=>[...document.querySelectorAll('.qd-card')].map(e=>e.dataset.id));ok(r.length===1&&r[0]===Q,'busca pelo número acha só aquele pedido');
  await A.fill('#qdBusca','');
  r=await A.evaluate(()=>{A.qdFAbre({v:'f'});A.qdFEtq({v:'evento'});const n=document.querySelectorAll('.qd-card').length;const ev=state.pedidos.filter(p=>p.evento&&!p.cancelado).length;A.qdFLimpa();A.qdFPz({v:'atrasado'});
    const at=[...document.querySelectorAll('.qd-card')].every(e=>{const p=pedById(e.dataset.id);return p.entrega<now()&&!p.concluido});A.qdFLimpa();A.qdFAbre({v:'f'});return {n,ev,at}});
  ok(r.n===r.ev,'filtro por etiqueta');ok(r.at,'filtro "Atrasados"');
  r=await A.evaluate(()=>{A.qdOrd({v:'nome'});const L=[...document.querySelectorAll('#qdcols .qd-card,.qd-col')].length;const C=[...document.querySelectorAll('.qd-col')].map(c=>[...c.querySelectorAll('.qd-card')].map(e=>pedById(e.dataset.id).cliente));
    const ord=C.every(L=>L.every((x,i)=>!i||String(L[i-1]).localeCompare(x,'pt-BR')<=0));A.qdOrd({v:'entrega'});return ord});
  ok(r,'ordenar a coluna por nome');

  console.log('4) No pedido: etiquetas, responsáveis, checklist e histórico');
  await A.evaluate(id=>{document.querySelector(`.qd-card[data-id="${id}"]`).click()},Q);await A.waitForTimeout(200);
  r=await A.evaluate(()=>({t:ui.sheet&&ui.sheet.t,aberto:!!document.querySelector('details[data-blk^="qd"][open]')}));ok(r.t==='pedido'&&r.aberto,'tocar no cartão abre o pedido com o bloco do quadro aberto');
  r=await A.evaluate(id=>{const u=state.usuarios[1];document.querySelector(`[data-a=qdResp][data-u="${u.id}"]`).click();document.querySelector('[data-a=qdEtq][data-e=urgente]').click();document.querySelector('[data-a=qdEtq][data-e=evento]').click();
    const p=pedById(id);return {resp:p.resp,etq:p.etq,evento:p.evento,ev:EV.fila.map(e=>e.tipo)}},Q);
  ok(r.resp.length===1&&r.etq.includes('urgente')&&r.evento===false,'responsável e etiqueta entram; EVENTO desmarca o "pedido para evento"');
  ok(r.ev.includes('pedido.responsavel_alterado')&&r.ev.includes('pedido.etiqueta_alterada'),'cada mudança gera evento');
  r=await A.evaluate(id=>{document.querySelector('[data-a=qdCk]').click();const p=pedById(id),x=p.ck[0].itens[0];const L=qdHistLista(p).map(e=>e.t);
    const card=(ui.sheet=null,render(),document.querySelector(`.qd-card[data-id="${id}"]`));return {ok:x.ok,por:x.por,em:x.em>now()-6e4,hist:L,av:card.querySelector('.qd-av')?.textContent,ck:card.querySelector('.qd-rod').textContent}},Q);
  ok(r.ok&&r.por&&r.em,'marcar item guarda quem marcou e quando ('+r.por+')');
  ok(r.hist.some(t=>/Marcou "Tem mockup\?"/.test(t))&&r.hist.some(t=>/etiqueta Urgente/.test(t))&&r.hist.some(t=>/responsável/.test(t)),'histórico do pedido mostra checklist, etiqueta e responsável');
  ok(/^[A-Z]{1,2}$/.test(r.av||'')&&/1\/7/.test(r.ck),'cartão com avatar de iniciais ('+r.av+') e 1/7');
  r=await A.evaluate(id=>{A.qdAbre({id});A.qdCkEd({id});const g=pedById(id).ck[0];document.getElementById('qdNovo-'+g.id).value='Enviou amostra?';A.qdIAdd({id,g:g.id});
    const inp=document.querySelector(`[data-qdren="${id}|${g.id}|${g.itens[0].id}"]`);inp.value='Tem mockup aprovado?';inp.dispatchEvent(new Event('change',{bubbles:true}));
    return {n:g.itens.length,t:g.itens[0].t,novo:g.itens[2]&&g.itens[2].t,h:qdHistLista(pedById(id)).map(e=>e.t).slice(0,3)}},Q);
  ok(r.n===3&&r.novo==='Enviou amostra?'&&r.t==='Tem mockup aprovado?','pôr item e mudar o nome no próprio pedido');ok(r.h.some(t=>/Mudou o item/.test(t))&&r.h.some(t=>/Criou o item/.test(t)),'mudanças de itens ficam no histórico');
  r=await A.evaluate(id=>{const g=pedById(id).ck[0];document.querySelector(`[data-a=qdIRm][data-i="${g.itens[2].id}"]`).click();const pede=!!ui.conf;A.confSim();return {pede,n:pedById(id).ck[0].itens.length}},Q);
  ok(r.pede&&r.n===2,'tirar item pede confirmação');
  r=await A.evaluate(()=>{const o=state.pedidos.find(p=>!p.ck&&!p.cancelado);return qdCkDe(o).length===QD().ck.length&&!o.ck});ok(r,'pedido sem mexer usa o checklist padrão sem gravar nada');

  console.log('5) Configuração (gestão) e módulo');
  r=await A.evaluate(()=>{ui.sheet=null;ui.tela='cadastros';ui.cad='ajustes';render();return !!document.getElementById('Quadro')});ok(r,'Cadastros › Ajustes › Quadro de pedidos');
  r=await A.evaluate(()=>{const c=QD().cols[2];A.qdColRen({c:c.id});document.getElementById('qdCfgNome').value='Mesa de corte';A.qdColRenOk({c:c.id});const nome=QD().cols[2].nome;
    A.qdColOff({c:QD().cols[1].id});const esc=QD().cols[1].off;const id=state.pedidos.find(p=>!p.cancelado).id;
    A.qdEtqAdd&&(document.getElementById('qdEtqNova').value='Amostra',A.qdEtqAdd());const etq=QD().etq.map(e=>e.nome);
    document.getElementById('qdCkTxt').value='Começo: Tem mockup?; Fez ficha?\nFim: Embalou?';A.qdCkSalva();return {nome,esc,etq,ck:QD().ck,gravou:!!state.quadro}});
  ok(r.nome==='Mesa de corte'&&r.esc,'renomear e esconder coluna');ok(r.etq.includes('Amostra'),'criar etiqueta');ok(r.ck.length===2&&r.ck[0].itens.length===2&&r.ck[1].nome==='Fim','checklist padrão pelo texto');
  r=await A.evaluate(()=>{const t=state.tipos.find(t=>faseT(t.id)==='costura');const c=QD().cols.find(c=>c.tipo==='prod'&&c.id!=='s-'+t.grupo);A.qdMaqCol({m:t.id,v:c.id});return QD().cols[qdIdxEtapa({posto:t.id},QD())].id===c.id});
  ok(r,'mudar a coluna de uma máquina');
  r=await A.evaluate(()=>{state.modOff=['quadro'];ui.tela='pedidos';ui.pv='qd';render();const s={bt:!!document.querySelector('.vista-b[data-v=qd]'),qd:!!document.getElementById('qdBoard'),cfg:(ui.tela='cadastros',render(),!!document.getElementById('Quadro'))};state.modOff=[];return s});
  ok(!r.bt&&!r.qd&&!r.cfg,'módulo desligado: sem botão, sem quadro e sem configuração');

  console.log('6) Cliente com colunas próprias (máquina pelo nome)');
  A=await abre({width:1280,height:900},CLI);
  r=await A.evaluate(()=>{const cols=QD().cols.map(c=>c.nome);const l=state.lotes.find(l=>!pedById(l.ped).concluido&&!pedById(l.ped).cancelado&&rp(l).steps.some(s=>tipo(s.posto).nome==='Caseadeira'));if(!l)return {cols};
    const p=pedById(l.ped);p.pre=null;p.vias=p.artePrep=p.arte=true;p.materiais.forEach(m=>{m.conf=true;m.st='ok'});const R=rp(l),cs=R.steps.filter(s=>tipo(s.posto).nome==='Caseadeira');
    const desc=new Set(cs.map(s=>s.id));let mud=true;while(mud){mud=false;R.steps.forEach(s=>{if(!desc.has(s.id)&&s.deps.some(d=>desc.has(d))){desc.add(s.id);mud=true}})}
    R.steps.forEach(s=>{if(!desc.has(s.id))l.steps[s.id]={st:'ok',ini:now()-H,fim:now()};else delete l.steps[s.id]});lotesDe(p.id).filter(x=>x!==l).forEach(x=>rp(x).steps.forEach(s=>x.steps[s.id]={st:'ok',ini:now()-H,fim:now()}));RC={};
    return {cols,c:qdColDe(p).nome,etq:qdEtqs().map(e=>e.nome),ck:qdCkDe(p).map(g=>g.nome)}});
  ok(r.cols.join('|')==='Início|Compra|Corte|Personalização|Costura|Casear / Botão|Embalagem|Finalizados','colunas do arquivo do cliente');
  ok(r.c==='Casear / Botão','peça na caseadeira cai na coluna "Casear / Botão" (máquina citada pelo nome) ('+r.c+')');
  ok(r.etq.join('|')==='EVENTO|Urgente'&&r.ck.join('|')==='Início|Corte','etiquetas e checklist do cliente');

  console.log('7) Celular 360×640');
  A=await abre({width:360,height:640},CLI);
  const med=async(sel)=>A.evaluate(sel=>{const app=document.querySelector(sel);const dentro=e=>e.closest('.qd,.qd-cols');
    const largo=[...app.querySelectorAll('*')].filter(e=>{if(dentro(e))return false;const r=e.getBoundingClientRect();return r.width&&r.right>window.innerWidth+1}).map(e=>e.className).slice(0,3);
    const peq=[...app.querySelectorAll('button,.campo')].filter(e=>e.offsetParent&&(e.closest('.qd,.qd-cols,#qdBoard')||e.closest('[data-blk^="qd"],[data-blk^="qh"]')||e.dataset.a&&/^qd/.test(e.dataset.a))&&e.getBoundingClientRect().height<48).map(e=>(e.dataset.a||e.className)+':'+e.textContent.trim().slice(0,15));
    const letra=[...app.querySelectorAll('.qd *,.qd-cols *,[data-blk^="qd"] *,.qd-dica')].filter(e=>e.offsetParent&&[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&parseFloat(getComputedStyle(e).fontSize)<16).map(e=>e.textContent.trim().slice(0,20));
    return {largo,peq,letra}},sel);
  r=await med('#app');ok(!r.largo.length&&!r.peq.length&&!r.letra.length,'quadro: sem cortes, alvos ≥ 48px, letra ≥ 16px'+JSON.stringify(r));
  r=await A.evaluate(()=>{const c=document.querySelector('.qd-col').getBoundingClientRect();return c.width<=360-40&&c.width>250});ok(r,'no celular, uma coluna por vez (arrasta para o lado)');
  await A.evaluate(()=>{document.querySelector('.qd-card').click();const e=document.querySelector('details[data-blk^="qd"]');e.open=true;e.scrollIntoView()});await A.waitForTimeout(200);
  r=await med('#sheet');ok(!r.largo.length&&!r.peq.length&&!r.letra.length,'bloco do pedido: sem cortes, alvos ≥ 48px, letra ≥ 16px'+JSON.stringify(r));

  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.slice(0,3).join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
