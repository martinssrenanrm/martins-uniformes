// Teste: polo com cobre gola e segunda barra; masculina/feminina no pedido e na ficha; lista geral de tecidos;
// variações do produto (Manga longa/curta); tamanho 0 antes do 2; tamanho americano convertido.
// Rodar: NODE_PATH=$(npm root -g) node tests/modelagem-tecidos.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const store=new Map();
async function dbop(o,p,data){if(o==='get')return {data:store.get(p)||null};if(o==='list')return [...store.entries()].filter(([k])=>k.split('/')[0]===p).map(([k,d])=>({id:k.split('/')[1],data:d}));if(o==='acquire')return {acquired:true};
  if(o==='set')store.set(p,JSON.parse(JSON.stringify(data)));if(o==='delete')store.delete(p);return {}}
(async()=>{const b=await chromium.launch();const fake=fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8');const erros=[];
  const ctx=await b.newContext({viewport:{width:360,height:640}});await ctx.exposeFunction('__dbop',dbop);await ctx.addInitScript(fake);
  await ctx.addInitScript(()=>{try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helenanenimga67@gmail.com'}))}catch(e){}});
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));await A.goto(APP);await A.waitForTimeout(1500);await A.evaluate(()=>{ui.sheet=null;render()});
  await A.click('[data-a=inicio][data-v=exemplo]');await A.waitForTimeout(2500);await A.evaluate(()=>{ui.sheet=null;render()});

  console.log('1) Polo: detalhe no peitilho, cobre gola e segunda barra da manga');
  let r=await A.evaluate(()=>{const p=prod('polo-ams');return {pc:p.partesCor,c2:coresSecundarias('marinho com gola, mangas e peitilho em vermelho',p,'Marinho'),cam:coresSecundarias('preta com gola vermelha',prod('cam-mc'),'Preta')}});
  ok(JSON.stringify(r.pc)===JSON.stringify(['Peitilho','Cobre gola','Segunda barra da manga']),'a polo já vem com essas três partes para a cor do detalhe');
  ok(r.c2.length===1&&['Peitilho','Cobre gola','Segunda barra da manga'].every(x=>r.c2[0].partes.includes(x))&&!r.c2[0].partes.includes('Gola'),'na ficha da polo, “gola” vira cobre gola e “manga” vira segunda barra: '+JSON.stringify(r.c2));
  ok(r.cam.length===1&&r.cam[0].partes.includes('Gola'),'na camiseta a gola continua sendo gola');

  console.log('2) Masculina ou feminina, variação e tecido no novo pedido');
  await A.evaluate(()=>{const p=prod('polo-vie');p.variacoes=['Manga curta','Manga longa'];openSheet({t:'novo',w:{step:2,cliente:'Teste Modelagem',cli:null,contato:'',cnpj:'',vend:state.pessoas[0].id,entrega:now()+20*864e5,err:'',itens:[]}});A.wAdd({p:'polo-vie'});A.wAdd({p:'polo-vie'})});
  r=await A.evaluate(()=>({gen:document.querySelectorAll('select[data-sel=wGen]').length,vari:document.querySelectorAll('select[data-sel=wVar]').length,tec:[...document.querySelector('select[data-sel=wTec]').options].map(o=>o.value)}));
  ok(r.gen===2,'cada peça pergunta se é masculina ou feminina');ok(r.vari===2,'o produto com variações mostra a escolha da variação');
  ok(r.tec.includes('Brim')&&r.tec.includes('Suplex'),'o tecido da polo pode ser qualquer um da lista geral (tem Brim e Suplex)');
  await A.evaluate(()=>{A.wGen({k:'0',v:'M'});A.wGen({k:'1',v:'F'});A.wVar({k:'1',v:'Manga longa'});const w=ui.sheet.w;w.itens.forEach(it=>{it.cor='Marinho';it.tecido='Malha fria PV';it.g={M:3}});w.step=4;render()});
  ok(await A.evaluate(()=>/FEMININA/.test(document.body.textContent)||ui.sheet.w.itens[1].gen==='F'),'a peça feminina fica marcada');
  await A.evaluate(()=>A.wCriar());await A.waitForTimeout(500);
  r=await A.evaluate(()=>{const ped=state.pedidos.find(p=>p.cliente==='Teste Modelagem');const ls=state.lotes.filter(l=>l.ped===ped.id);return {n:ls.length,g:ls.map(l=>l.gen),v:ls.map(l=>l.variacao),f:docFicha(ls[1],ped,1,2,2),m:docFicha(ls[0],ped,1,1,2),tec:tecidosAll().includes('Malha fria PV')}});
  ok(r.n===2&&r.g[0]==='M'&&r.g[1]==='F','masculina e feminina viram peças separadas no pedido');
  ok(r.v[1]==='Manga longa','a variação fica guardada na peça');
  ok(/MODELAGEM/.test(r.f)&&/FEMININA/.test(r.f)&&/Manga longa/.test(r.f),'a ficha de produção mostra FEMININA em destaque e a variação');
  ok(/MASCULINA/.test(r.m),'e a ficha da masculina mostra MASCULINA');
  ok(r.tec,'tecido novo fica na lista geral');

  await A.evaluate(()=>{const ped=state.pedidos.find(p=>p.cliente==='Teste Modelagem');openSheet({t:'ins',id:ped.id})});await A.waitForTimeout(300);
  const ins=await A.evaluate(()=>[...document.querySelectorAll('.ins')].map(e=>e.textContent).find(t=>/Malha fria PV Marinho/.test(t))||'');
  ok(/para 6 peças/.test(ins)&&/3 Polo Viena masculina/.test(ins)&&/3 Polo Viena · Manga longa feminina/.test(ins),'conferir insumos mostra para quantas peças é cada tecido: '+ins.replace(/\s+/g,' ').slice(0,140));
  ok(await A.evaluate(()=>{const h=[...document.querySelectorAll('.card')].find(c=>/^Linhas/.test(c.querySelector('h2')?.textContent||''));return !!h&&/Fio de costura Marinho/.test(h.textContent)&&/Linha de costura Marinho/.test(h.textContent)}),'Linhas tem linha e fio de costura');
  const ref=await A.evaluate(()=>{const ped=pedById(ui.sheet.id);const k=ped.materiais.findIndex(m=>m.item==='Malha fria PV Marinho');A.insFalta({id:ped.id,k:String(k)});return document.querySelector('.ins-ref')?.textContent||''});
  ok(/Para 6 peças/.test(ref)&&/por peça/.test(ref),'ao marcar Falta, mostra quantas peças tem o pedido e quanto dá por peça: '+ref.trim().slice(0,120));
  console.log('3) Cadastro: variações do produto e lista de tecidos');
  await A.evaluate(()=>{ui.sheet=null;ui.tela='cadastros';ui.cad='ajustes';render()});
  ok(await A.evaluate(()=>!!document.getElementById('tecG')),'Cadastros › Ajustes tem a lista geral de tecidos');
  await A.evaluate(()=>{document.getElementById('tecG').value='Meia malha P.A.';A.addTecG()});
  ok(await A.evaluate(()=>tecidosAll().includes('Meia malha P.A.')),'dá para cadastrar tecido na lista geral');
  await A.evaluate(()=>{document.getElementById('tecG').value='meia MALHA p.a.';A.addTecG()});
  ok(await A.evaluate(()=>tecidosAll().filter(t=>semAc(t)===semAc('Meia malha P.A.')).length===1),'o mesmo tecido não entra duas vezes');

  await A.evaluate(()=>{ui.cad='produtos';render()});
  ok(await A.evaluate(()=>!!document.querySelector('#Tecidos')&&!!document.getElementById('tecG')),'o quadro Tecidos também fica em Cadastros › Produtos');
  r=await A.evaluate(()=>{A.tecRen({v:'Moletom'});document.getElementById('tecRen').value='Moletom PA';A.tecRenOk({v:'Moletom'});document.getElementById('tecG').value='Moletom poliéster';A.addTecG();
    const T=tecidosAll();const blusa=prod('blusa').tecidos;A.tecRm({v:'Tactel'});const pergunta=/Tirar <b>Tactel<\/b>/.test(document.body.innerHTML);A.tecRmOk({v:'Tactel'});
    return {pa:T.includes('Moletom PA'),pol:T.includes('Moletom poliéster'),velho:T.includes('Moletom'),blusa:blusa.includes('Moletom PA')&&!blusa.includes('Moletom'),pergunta,tactel:tecidosAll().includes('Tactel')}});
  ok(r.pa&&r.pol&&!r.velho,'renomeia Moletom para Moletom PA e adiciona Moletom poliéster');ok(r.blusa,'o nome muda também nos produtos');ok(r.pergunta&&!r.tactel,'tirar tecido pede confirmação e tira');

  console.log('4b) Onde vai a personalização');
  r=await A.evaluate(()=>{if(!state.tipos.some(t=>t.id==='estampa'))state.tipos.push({id:'estampa',nome:'Estampa',grupo:'pers',i:'i-estampa',externo:true,min:1});if(!fornDe('estampa').length)state.forn.push({id:'rafa',nome:'Rafael',servico:'estampa'});RC={};const l=state.lotes.find(l=>(l.pers||[]).some(x=>x.tipo==='estampa'))||(()=>{const l=state.lotes.find(l=>!l.rework&&pedById(l.ped)&&!pedById(l.ped).concluido);l.pers=[{tipo:'estampa',parte:'Frente',pos:'Centro do peito',id:'pz9'}];RC={};return l})();
    const x=l.pers.find(q=>q.tipo==='estampa');const s=sMap(rp(l))[x.id];const box=ondeBox(l,s);
    A.levei({l:l.id,s:x.id});const fora=l.steps[x.id]?.st==='fora';A.persDesfaz({l:l.id,s:x.id});const desfez=!l.steps[x.id];
    A.levei({l:l.id,s:x.id});const int=tiposIrmaos('estampa').find(t=>!t.externo);A.persOnde({l:l.id,s:x.id,v:'i:'+int.id});
    return {box:/Aqui na fábrica/.test(box)&&/Rafael/.test(box),fora,desfez,int:x.tipo===int.id&&!l.steps[x.id]&&!isExt(sMap(rp(l))[x.id])}});
  ok(r.box,'a estampa pergunta onde vai ser feita: fornecedor ou Aqui na fábrica');ok(r.fora&&r.desfez,'dá para desfazer o Levei feito sem querer');ok(r.int,'trocar para Aqui na fábrica tira do fornecedor e vira etapa interna');

  console.log('4) Tamanhos');
  r=await A.evaluate(()=>({s:sizesAll(),us:usParaBr({S:1,M:2,L:3,XL:4,'2XL':5}),br:usParaBr({P:1,G:2})}));
  ok(r.s.indexOf('0')>=0&&r.s.indexOf('0')===r.s.indexOf('2')-1,'tamanho 0 vem logo antes do 2');
  ok(JSON.stringify(r.us)===JSON.stringify({P:1,M:2,G:3,GG:4,XG:5}),'americano vira brasileiro sem criar tamanho novo (S=P, L=G, XL=GG, 2XL=XG)');
  ok(JSON.stringify(r.br)===JSON.stringify({P:1,G:2}),'tamanho brasileiro fica como está');

  console.log('5) Cortar junto');
  r=await A.evaluate(()=>{const ped=state.pedidos.find(p=>p.cliente==='Teste Modelagem');const [l1,l2]=lotesDe(ped.id);
    // outro pedido, mesmo tecido e cor, modelo diferente, entrega bem mais para frente; e um de outra cor
    const mk=(id,prod,cor,dias)=>{state.pedidos.push({id,cli:ped.cli,cliente:'Cliente '+id,vendedor:ped.vendedor,chegada:now(),entrega:now()+dias*864e5,vias:false,artePrep:false,arte:false,artes:{},materiais:[],concluido:null});state.lotes.push({id:id+'-1',ped:id,prod,cor,cores2:[],tecido:'Malha fria PV',opcoes:[],pers:[],qtd:40,grade:{G:40},desm:0,steps:{},rework:false,parent:null})};
    mk('9901','polo-ams','Marinho',90);mk('9902','polo-ams','Preta',5);save();
    const J=cortarJunto(l1).map(x=>x.l.id);const s=rp(l1).steps.find(x=>x.posto==='corte');const html=tarefaCard({l:l1,s,p:prod(l1.prod),ped,inf:info(ped)});
    return {J,box:/Dá para cortar junto/.test(html),cli:/Cliente 9901/.test(html)}});
  ok(r.J.includes('9901-1'),'acha peça de outro pedido com o mesmo tecido e cor, mesmo de outro modelo e com entrega longe');
  ok(r.J.length===2&&!r.J.includes('9902-1'),'não mistura outra cor (e inclui a outra peça do mesmo pedido)');
  ok(r.box&&r.cli,'a tarefa de corte mostra o quadro Dá para cortar junto');
  r=await A.evaluate(()=>{const l=lote('9901-1');const s=rp(l).steps.find(x=>x.posto==='corte');l.steps[s.id]={st:'ok'};return cortarJunto(lotesDe(state.pedidos.find(p=>p.cliente==='Teste Modelagem').id)[0]).map(x=>x.l.id)});
  ok(!r.includes('9901-1'),'peça já cortada sai da lista');
  ok(await A.evaluate(()=>ajBusca('cortar junto mesmo tecido')[0]?.f.q==='Dá para cortar pedidos juntos?'),'"cortar junto mesmo tecido" acha a resposta certa');

  console.log('5) Central de dúvidas');
  ok(await A.evaluate(()=>ajBusca('feminina')[0]?.f.q==='Como separo peça masculina e feminina?'),'"feminina" acha a resposta certa');
  ok(await A.evaluate(()=>ajBusca('cobre gola')[0]?.f.q==='Onde marco cobre gola e segunda barra da polo?'),'"cobre gola" acha a resposta certa');
  ok(await A.evaluate(()=>ajBusca('manga longa variação')[0]?.f.q==='Como cadastro variações como manga longa e manga curta?'),'"manga longa variação" acha a resposta certa');
  ok(await A.evaluate(()=>ajBusca('qualquer tecido')[0]?.f.q==='Posso fazer qualquer peça em qualquer tecido?'),'"qualquer tecido" acha a resposta certa');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros[0]:''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
