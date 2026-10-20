// Teste: Escritório agrupado por pedido e mudar personalização de fornecedor (arrastar ou "Mudar para…") (pedido da Martins, 20/10).
// Rodar: NODE_PATH=$(npm root -g) node tests/escritorio-fora.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:800,height:1280}});A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  console.log('1) Escritório por pedido');
  let r=await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.sheet=null;ui.inicio=null;ui.tela='fabrica';ui.escVer=null;try{localStorage.removeItem('esc-ver')}catch(e){}A.fz({v:'esc'});
    const ts=tarefasEsc(),peds=new Set(ts.map(t=>t.ped.id));const cards=document.querySelectorAll('.eped').length,linhas=document.querySelectorAll('.eped .tmini').length;
    const btn=document.querySelector('.eped .tmini [data-a]:not([data-a=troca])');A.escVer({v:'setor'});const setor=!!document.querySelector('.setores')&&!document.querySelector('.eped');A.escVer({v:'ped'});
    return {nt:ts.length,np:peds.size,cards,linhas,btn:!!btn,setor}});
  ok(r.cards===r.np&&r.np>0,`um cartão por pedido (${r.cards} pedidos, ${r.nt} tarefas)`);
  ok(r.linhas>0&&r.linhas<=r.nt&&r.btn,'lista curta de tarefas com o botão de cada uma');
  ok(r.setor,'"Por setor" volta para a visão de antes');
  r=await A.evaluate(()=>{const ped=state.pedidos.find(p=>!p.concluido&&lotesDe(p.id).length);ped.arte=true;ped.artePrep=true;ped.vias=true;ped.materiais.forEach(m=>{m.conf=true;m.st='ok'});
    const l=lotesDe(ped.id)[0];const t=state.tipos.find(x=>x.externo&&faseG(x.grupo)==='pers')||state.tipos.find(x=>faseG(x.grupo)==='pers');l.pers=[1,2,3].map(i=>({id:'pzt'+i,tipo:t.id,parte:'Frente'}));ped.artes={};RC={};render();
    const card=[...document.querySelectorAll('.eped')].find(c=>c.querySelector(`[data-id="${ped.id}"]`));const g=card&&card.querySelector('.tm-grp');return {g:!!g,n:g?g.querySelectorAll('.tmini').length:0,txt:g?g.querySelector('summary').innerText:''}});
  ok(r.g&&r.n===3,'tarefas iguais do mesmo pedido ficam juntas numa linha que abre ('+r.txt.replace(/\s+/g,' ')+')');
  console.log('2) Mudar de fornecedor');
  r=await A.evaluate(()=>{const f1=state.forn[0];const f2={id:'fteste2',nome:'Fornecedor Dois',servico:f1.servico,prazo:3,leva:state.pessoas[0].id};state.forn.push(f2);
    const ped=state.pedidos.find(p=>!p.concluido&&lotesDe(p.id).length);const l=lotesDe(ped.id)[0];l.pers=[{id:'pzm1',tipo:f1.servico,parte:'Frente',forn:f1.id}];l.steps.pzm1={st:'fora',forn:f1.id,op:f1.leva,saiu:now()-DIA};RC={};
    ui.sheet=null;A.fz({v:'fora'});const sel=document.querySelector(`.forn[data-forn="${f1.id}"] select[data-sel=fornMoverSel]`);const alca=!!document.querySelector(`.forn[data-forn="${f1.id}"] .f-drag`);
    sel.value=f2.id;sel.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-a=confSim]')?.click();
    const foi=l.steps.pzm1.forn===f2.id&&l.pers[0].forn===f2.id;const noCard=!!document.querySelector(`.forn[data-forn="${f2.id}"] .fitem`);return {f1:f1.id,f2:f2.id,alca,foi,noCard}});
  ok(r.alca,'item no fornecedor tem a alça ⠿ para arrastar');
  ok(r.foi&&r.noCard,'"Mudar para…" passa a personalização para o outro fornecedor (com confirmação)');
  // arrastar de volta com o mouse
  const h=await A.$(`.forn[data-forn="${r.f2}"] .f-drag`),z=await A.$(`.forn[data-forn="${r.f1}"]`);const a=await h.boundingBox(),c=await z.boundingBox();
  await A.mouse.move(a.x+20,a.y+20);await A.mouse.down();await A.mouse.move(c.x+40,c.y+30,{steps:8});await A.mouse.up();await A.waitForTimeout(150);await A.evaluate(()=>document.querySelector('[data-a=confSim]')?.click());
  const volta=await A.evaluate(f1=>{const l=state.lotes.find(x=>x.steps&&x.steps.pzm1);return l.steps.pzm1.forn===f1},r.f1);
  ok(volta,'arrastar pela alça até o outro fornecedor também passa');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
