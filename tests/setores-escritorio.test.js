// Teste: setores e escritório configuráveis (R2). A configuração padrão reproduz o jeito de hoje.
// Rodar: NODE_PATH=$(npm root -g) node tests/setores-escritorio.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const store=new Map();
const dbop=async(o,p,data)=>{if(o==='get')return {data:store.get(p)||null};if(o==='list')return [...store.entries()].filter(([k])=>k.split('/')[0]===p).map(([k,d])=>({id:k.split('/')[1],data:d}));if(o==='acquire')return {acquired:true};
  if(o==='set')store.set(p,JSON.parse(JSON.stringify(data)));if(o==='delete')store.delete(p);return {}};
(async()=>{const b=await chromium.launch();const erros=[];
  const ctx=await b.newContext({viewport:{width:1000,height:900}});await ctx.exposeFunction('__dbop',dbop);await ctx.addInitScript(fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8'));
  await ctx.addInitScript(()=>{try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helena@exemplo.test'}))}catch(e){}});
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));await A.goto(APP);await A.waitForTimeout(1500);await A.evaluate(()=>{ui.sheet=null;render()});
  await A.click('[data-a=inicio][data-v=exemplo]');await A.waitForTimeout(2500);await A.evaluate(()=>{ui.sheet=null;render()});

  console.log('1) Setores padrão = os de antes');
  let r=await A.evaluate(()=>({ids:state.setores.map(g=>g.id+':'+g.fase).join(','),barra:ETAPAS_DE().map(e=>e.nome).join(',')}));
  ok(r.ids==='corte:corte,pers:pers,costura:costura,acab:acab','Corte, Personalização, Costura e Acabamento, cada um com sua função');
  ok(/^Corte,Personalização,Costura,Arremate,Embalagem$/.test(r.barra),'barra da peça igual à de antes (acabamento mostra cada máquina)');

  console.log('2) Criar um setor novo (Lavanderia) e pôr uma máquina nele');
  r=await A.evaluate(()=>{ui.tela='cadastros';ui.cad='maquinas';render();document.getElementById('setNovo').value='Lavanderia';A.setAdd();
    const g=state.setores.find(x=>x.nome==='Lavanderia');A.setFase({g:g.id,v:'acab'});A.setMov({g:g.id,d:-1});
    state.tipos.push({id:'lavar',nome:'Máquina de lavar',grupo:g.id,i:'i-maquina',qtd:1});RC={};render();
    return {criado:!!g,fase:faseT('lavar'),ordem:state.setores.map(x=>x.nome).join(','),naTela:document.body.innerText.includes('Máquina de lavar'),
      tirar:(A.setRm({g:g.id}),state.setores.some(x=>x.id===g.id))}});
  ok(r.criado,'setor criado pelo cadastro');ok(r.fase==='acab','a máquina do setor novo segue a função escolhida');
  ok(r.ordem==='Corte,Personalização,Costura,Lavanderia,Acabamento','dá para pôr o setor na ordem do caminho');ok(r.naTela,'máquina do setor novo aparece em Máquinas');
  ok(r.tirar,'setor com máquina não pode ser tirado');
  r=await A.evaluate(()=>{const g=state.setores.find(x=>x.nome==='Lavanderia');A.setRen({g:g.id});document.getElementById('setRen').value='Lavagem';A.setRenOk({g:g.id});
    state.tipos=state.tipos.filter(t=>t.id!=='lavar');A.setRm({g:g.id});return {sem:!state.setores.some(x=>x.id===g.id)}});
  ok(r.sem,'renomeia e, sem máquinas, tira o setor');

  console.log('3) Personalização e corte seguem a função do setor, não o nome');
  r=await A.evaluate(()=>{const g=state.setores.find(x=>x.id==='pers');A.setRen({g:'pers'});document.getElementById('setRen').value='Estamparia e bordado';A.setRenOk({g:'pers'});
    return {pers:state.tipos.filter(t=>faseG(t.grupo)==='pers').length>0,corte:faseT('corte')==='corte'}});
  ok(r.pers&&r.corte,'trocar o nome do setor não muda o que ele faz');
  console.log('4) Escritório: padrão igual ao de hoje');
  r=await A.evaluate(()=>{const ped=state.pedidos.find(p=>!p.concluido&&!p.arte);const fs=new Set(tarefasEsc().filter(t=>t.ped===ped).map(t=>t.f));
    return {id:ped.id,arte:fs.has('arte_prep')||fs.has('arte_aprov'),lib:liberado(ped),rota:rotaV(lotesDe(ped.id)[0],ped).steps.some(z=>z.id==='v_aprov')}});
  ok(r.arte&&!r.lib&&r.rota,'pedido sem arte aprovada: tem tarefa de arte e o corte espera');
  console.log('5) Fábrica que não faz arte');
  const pid=r.id;r=await A.evaluate(id=>{const ped=pedById(id);['arte_prep','arte_aprov','arte_env'].forEach(f=>A.escLiga({f}));ped.vias=true;ped.materiais.forEach(m=>{m.conf=true;m.st='ok'});RC={};
    const fs=new Set(tarefasEsc().filter(t=>t.ped===ped).map(t=>t.f));const l=lotesDe(id)[0],R=rotaV(l,ped);
    ui.tela='fabrica';ui.fz='esc';render();const telaArtes=!!document.getElementById('set-artes');
    return {semArte:!fs.has('arte_prep')&&!fs.has('arte_aprov')&&!fs.has('arte_env'),lib:liberado(ped),rota:!R.steps.some(z=>/^v_(prep|aprov|env)/.test(z.id)),telaArtes,
      pers:rp(l).steps.filter(z=>z.pers).every(z=>arteOk(ped,l,z))}},pid);
  ok(r.semArte,'nenhuma tarefa de arte');ok(r.lib,'o corte libera sem arte aprovada');ok(r.pers,'personalização não espera envio de arte');
  ok(r.rota,'o caminho do pedido não mostra etapas de arte');ok(!r.telaArtes,'o setor Artes some da tela do escritório');
  console.log('6) O que libera o corte');
  r=await A.evaluate(id=>{const ped=pedById(id);ped.materiais[0].st='comprar';const antes=liberado(ped);A.libCom({v:'insumos'});const depois=liberado(ped);
    ui.tela='cadastros';ui.cad='ajustes';render();const card=!!document.getElementById('Escritorio');
    A.libCom({v:'insumos'});['arte_prep','arte_aprov','arte_env'].forEach(f=>A.escLiga({f}));return {antes,depois,card,volta:!(state.escOff||[]).length&&state.liberaCom.length===3}},pid);
  ok(!r.antes&&r.depois,'tirando "insumos", material a comprar não segura o corte');ok(r.card,'quadro Etapas do escritório em Ajustes');ok(r.volta,'religar volta ao padrão');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
