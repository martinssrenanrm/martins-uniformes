// Teste: pedido da Martins de 28/10. Masculina e feminina no mesmo item, arquivo de bordado na criação/importação,
// tudo editável ao importar ("Editar tudo") e posição + medida obrigatórias em cada personalização.
// Rodar: NODE_PATH=$(npm root -g) node tests/pedido-mf.test.js
const { chromium } = require('playwright');const path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');const PNG=path.join(__dirname,'fixtures','mockup-marinho.png');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
(async()=>{const b=await chromium.launch();const erros=[];const A=await b.newPage({viewport:{width:820,height:1100}});A.on('pageerror',e=>erros.push(e.message));
  await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.inicio=null;render()});
  console.log('1) Masculina e feminina no mesmo item');
  let r=await A.evaluate(()=>{const p=state.produtos.find(x=>(x.tecidos||[]).length&&locaisPers(x).length);openSheet({t:'novo',w:{step:2,cliente:'Empresa MF Teste',cli:null,contato:'',cnpj:'',vend:state.pessoas.find(x=>temPapel(x,'vendas')).id,entrega:null,err:'',itens:[]}});A.wAdd({p:p.id});
    const it=ui.sheet.w.itens[0];it.cor=Object.keys(state.cores)[0];it.tecido=p.tecidos[0];A.wGen({k:'0',v:'MF'});
    const duas=document.querySelectorAll('[data-q="0"]').length>0&&document.querySelectorAll('[data-qf="0"]').length>0;
    const s=catDe(it).t;const setq=(sel,z,v)=>{const i=document.querySelector(`${sel}[data-s="${z}"]`);i.value=v};setq('[data-q="0"]',s[1],5);setq('[data-q="0"]',s[2],3);setq('[data-qf="0"]',s[0],4);setq('[data-qf="0"]',s[1],2);
    // personalização sem medida não entra
    A.wPadd({k:'0'});const t=state.tipos.find(x=>x.id==='bordado')||state.tipos.find(x=>faseG(x.grupo)==='pers');A.wPt({k:'0',v:t.id});A.wPloc({k:'0',v:'0'});document.getElementById('wPtam0').value='';A.wPok({k:'0'});
    const semMedida=!ui.sheet.w.itens[0].pers.length&&/medida/i.test(ui.sheet.w.err);
    document.getElementById('wPtam0').value='9 x 6 cm';A.wPok({k:'0'});return {pid:p.id,duas,semMedida,np:ui.sheet.w.itens[0].pers.length,s,tipo:t.id}});
  ok(r.duas,'com "Masculina e feminina" aparecem as duas grades no mesmo item');
  ok(r.semMedida,'logo sem medida não entra (pede a medida)');
  ok(r.np===1,'logo com medida entra');
  // anexar o arquivo do bordado na criação
  await A.evaluate(()=>{wRead();A.wPzArq({k:'0',j:'0',t:'bord'})});await A.setInputFiles('#fArq',PNG);await A.waitForTimeout(800);
  r=await A.evaluate(()=>{const x=ui.sheet.w.itens[0].pers[0];return {bord:x.bord,tela:!!document.querySelector('.wpz-a')}});
  ok(!!r.bord&&r.tela,'arquivo do bordado anexado ainda na criação do pedido');
  // personalização sem lugar exato / medida trava o passo 2
  r=await A.evaluate(()=>{const it=ui.sheet.w.itens[0];it.pers.push({tipo:it.pers[0].tipo,parte:'Frente'});render();A.wNext();const err=ui.sheet.w.err,step=ui.sheet.w.step;it.pers.pop();render();return {err,step}});
  ok(r.step===2&&/lugar exato e da medida/.test(r.err),'personalização sem lugar exato ou medida não deixa avançar');
  r=await A.evaluate(()=>{A.wNext();const w=ui.sheet.w;w.entrega=now()+20*DIA;w.step=4;render();const resumo=document.getElementById('sheet').innerText;const n0=state.pedidos.length;A.wCriar();const ped=state.pedidos[state.pedidos.length-1];const ls=lotesDe(ped.id);
    const G=gruposFicha(ls);const f=docFicha(G[0],ped,1,1,G.length);const a=arqById(ls[0].pers[0].bord);
    return {criou:state.pedidos.length>n0,gens:ls.map(l=>l.gen).join(','),gM:ls[0].grade,gF:ls[1]&&ls[1].grade,mesmo:ls.length===2&&ls[0].prod===ls[1].prod&&ls[0].cor===ls[1].cor&&JSON.stringify(ls[0].pers)===JSON.stringify(ls[1].pers),
      bord:ls.every(l=>l.pers[0].bord),cli:a&&a.cli===ped.cli,grupos:G.length,fichaMF:/MASCULINA/.test(f)&&/FEMININA/.test(f),resumoMF:/MASCULINA/.test(resumo)&&/FEMININA/.test(resumo),pid:ped.id}});
  ok(r.criou&&r.gens==='M,F'&&r.mesmo,'vira duas peças (M e F) com as mesmas características');
  ok(r.gM&&r.gF&&Object.values(r.gM).reduce((a,b)=>a+b,0)===8&&Object.values(r.gF).reduce((a,b)=>a+b,0)===6,'cada uma com a sua grade (8 masculinas, 6 femininas)');
  ok(r.resumoMF,'a confirmação mostra masculina e feminina');
  ok(r.grupos===1&&r.fichaMF,'as duas saem na mesma ficha de produção');
  ok(r.bord&&r.cli,'arquivo do bordado fica nas duas peças e guardado na empresa');
  r=await A.evaluate(id=>{A.pedEditar({id});const w=ui.sheet.w;return {n:w.itens.length,gen:w.itens[0].gen,gF:!!w.itens[0].gF,md:mudancasPed(w)}},r.pid);
  ok(r.n===1&&r.gen==='MF'&&r.gF&&!r.md.length,'em Corrigir pedido, M e F voltam como um item só (sem mudança falsa'+(r.md.length?': '+r.md.join('; '):'')+')');
  console.log('2) Importação: tudo editável');
  r=await A.evaluate(()=>{ui.sheet=null;const p=state.produtos.find(x=>(x.tecidos||[]).length&&locaisPers(x).length);const t=state.tipos.find(x=>x.id==='bordado')||state.tipos.find(x=>faseG(x.grupo)==='pers');
    const g={num:'9701',nums:['9701'],cliente:'IMPORTADA TESTE',cliId:null,cliNovo:true,cliSug:[],contato:'',cnpj:'',chegada:now(),entrega:now()+15*DIA,vend:state.pessoas.find(x=>temPapel(x,'vendas')).id,obs:'',falta:[],avisos:[],
      itens:[{prod:p.id,gen:'M',cor:Object.keys(state.cores)[0],tecido:p.tecidos[0],opcoes:[],cores2:[],g:{M:4},gOk:true,txt:'x',pers:[{rot:'peito esq',desc:'logo',tipo:t.id,parte:'Frente',pos:posDe('Frente')[0]}]}]};
    openSheet({t:'imp',gi:0,grupos:[g]});const pend1=impPend(g);const temTam=!!document.querySelector('[data-imptam]'),temArq=!!document.querySelector('[data-a=impPzArq]'),temTudo=!!document.querySelector('[data-a=impWizard]');
    const inp=document.querySelector('[data-imptam]');inp.value='10 cm';inp.dispatchEvent(new Event('change',{bubbles:true}));return {pend1,pend2:impPend(ui.sheet.grupos[0]),temTam,temArq,temTudo}});
  ok(r.pend1.some(x=>/medida da personalização/.test(x))&&!r.pend2.length,'importação exige a medida e aceita digitar na própria tela');
  ok(r.temArq,'importação tem "Pôr arquivo do bordado" em cada personalização');
  await A.evaluate(()=>A.impPzArq({k:'0',j:'0',t:'bord'}));await A.setInputFiles('#fArq',PNG);await A.waitForTimeout(800);
  r=await A.evaluate(()=>{const x=ui.sheet.grupos[0].itens[0].pers[0];const bord=!!x.bord;A.impWizard();const w=ui.sheet.w;
    const ok1=ui.sheet.t==='novo'&&w.step===2&&w.itens.length===1&&w.itens[0].pers[0].tam==='10 cm'&&!!w.itens[0].pers[0].bord&&!!document.querySelector('[data-ptam="0|0"]');
    A.wGen({k:'0',v:'MF'});document.querySelector('[data-qf="0"][data-s="G"]').value=3;wRead();A.wNext();w.step=4;render();A.wCriar();const ped=state.pedidos.find(p=>p.ficha==='9701');const ls=ped?lotesDe(ped.id):[];
    return {bord,ok1,ped:!!ped,id:ped&&ped.id,fonte:ped&&ped.fonte,gens:ls.map(l=>l.gen).join(','),bord2:ls.every(l=>l.pers[0].bord)}});
  ok(r.bord,'arquivo do bordado anexado na tela de importação');
  ok(r.ok1,'"Editar tudo" abre o formulário completo com o que foi lido (medida e arquivo incluídos)');
  ok(r.ped&&r.id==='9701'&&r.fonte==='ficha'&&r.gens==='M,F'&&r.bord2,'pedido importado criado pelo formulário completo, com masculina e feminina');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
