// Teste: importar fichas de produção em Word (.docx) junto com um mockup solto.
// Confere: tamanhos especiais (G1, EXG), tecido novo entrando no produto, observações do pedido indo para a ficha de produção,
// mockup dentro do Word e mockup solto ligados à peça certa.
// Rodar: NODE_PATH=$(npm root -g) node tests/importar-ficha.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path'),os=require('os'),{execFileSync}=require('child_process');
const APP='file://'+path.resolve(__dirname,'../app.html');const FX=path.join(__dirname,'fixtures');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const store=new Map();
async function dbop(o,p,data){if(o==='get')return {data:store.get(p)||null};if(o==='list')return [...store.entries()].filter(([k])=>k.split('/')[0]===p).map(([k,d])=>({id:k.split('/')[1],data:d}));if(o==='acquire')return {acquired:true};
  if(o==='set')store.set(p,JSON.parse(JSON.stringify(data)));if(o==='delete')store.delete(p);return {}}
// bibliotecas do CDN (leitor de PDF/Word): baixadas uma vez com curl e servidas localmente
const cache=path.join(os.tmpdir(),'martins-cdn');fs.mkdirSync(cache,{recursive:true});
const cdn=url=>{const f=path.join(cache,url.replace(/[^a-z0-9.]+/gi,'_'));if(!fs.existsSync(f))execFileSync('curl',['-sfL','-o',f,url]);return fs.readFileSync(f)};
(async()=>{const b=await chromium.launch();const fake=fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8');const erros=[];
  const ctx=await b.newContext({viewport:{width:360,height:640}});await ctx.exposeFunction('__dbop',dbop);await ctx.addInitScript(fake);
  await ctx.route(/cdnjs\.cloudflare\.com/,r=>r.fulfill({body:cdn(r.request().url()),contentType:'application/javascript'}));
  await ctx.addInitScript(()=>{try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helena@exemplo.test'}))}catch(e){}});
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));await A.goto(APP);await A.waitForTimeout(1500);await A.evaluate(()=>{ui.sheet=null;render()});
  await A.click('[data-a=inicio][data-v=exemplo]');await A.waitForTimeout(2500);await A.evaluate(()=>{ui.sheet=null;render()});

  console.log('1) Fichas em Word + mockup solto, escolhidos juntos');
  await A.setInputFiles('#fImpF',['ficha-teste-1.docx','ficha-teste-2.docx','MOCKUP 9001 polo verde.png'].map(f=>path.join(FX,f)));
  await A.waitForFunction(()=>ui.sheet&&ui.sheet.t==='imp',null,{timeout:30000});
  let r=await A.evaluate(()=>{const g=ui.sheet.grupos[0];return {n:ui.sheet.grupos.length,num:g.num,cli:g.cliente,obs:g.obs,ent:!!g.entrega,pend:impPend(g),
    it:g.itens.map(it=>({prod:it.prod,tec:it.tecido,novo:!!it.tecNovo,cor:it.cor,g:it.g,mock:!!it.mock,pers:it.pers.map(x=>x.parte)}))}});
  ok(r.n===1&&r.num==='9001'&&r.cli==='EMPRESA TESTE LTDA','as duas páginas viraram um pedido só (9001)');
  ok(r.ent,'prazo de entrega lido');ok(r.obs==='Entregar dobradas, uma por saquinho','observações do pedido lidas da ficha');
  ok(r.it.length===2&&r.it[0].prod==='cam-mc'&&r.it[1].prod==='polo-vie','produtos reconhecidos pelo nome');
  ok(r.it[0].g.G1===2&&r.it[0].g.G===10&&r.it[1].g.EXG===3,'tamanhos especiais (G1, EXG) lidos da tabela');
  ok(r.it[0].tec==='Malha PV'&&!r.it[0].novo,'tecido cadastrado reconhecido');ok(r.it[1].tec==='Piquet Dry'&&r.it[1].novo,'tecido que o produto não tinha vira tecido novo do produto');
  ok(r.it[0].cor==='Marinho'&&r.it[1].cor==='Verde bandeira','cores reconhecidas');
  ok(r.it[0].mock,'mockup que estava dentro do Word foi para a peça 1');ok(r.it[1].mock,'mockup solto ("polo verde") foi para a peça certa');
  ok(r.it[0].pers.join()==='Frente,Mangas'&&r.it[1].pers.join()==='Costas','lugares da personalização reconhecidos');
  ok(r.pend.length===1&&r.pend[0]==='quem vendeu','só falta escolher quem vendeu (não está na ficha)');

  console.log('2) Criar o pedido');
  await A.evaluate(()=>{const g=ui.sheet.grupos[0];g.vend=state.pessoas.find(p=>temPapel(p,'vendas')).id;render()});
  await A.evaluate(()=>impCriar());await A.waitForTimeout(800);
  r=await A.evaluate(()=>{const p=state.pedidos.find(x=>x.ficha==='9001');const ls=lotesDe(p.id);return {obs:p.obs,esp:(state.cats.find(c=>c.id==='esp')||{t:[]}).t,tec:prod('polo-vie').tecidos,
    q:ls.map(l=>l.qtd),ficha:docFicha(ls[0],p,1,1,ls.length)}});
  ok(r.obs==='Entregar dobradas, uma por saquinho','observações salvas no pedido');ok(/Entregar dobradas/.test(r.ficha),'observações saem na ficha de produção do sistema');
  ok(r.esp.includes('G1')&&r.esp.includes('EXG'),'G1 e EXG estão na categoria de tamanhos Especiais');ok(r.tec.includes('Piquet Dry'),'Piquet Dry ficou cadastrado na Polo Viena');
  ok(r.q.join()==='16,10','quantidades certas (16 e 10 peças)');

  console.log('3) Novo pedido à mão: observações e tamanho avulso');
  await A.evaluate(()=>{openSheet({t:'novo',w:{step:2,cliente:'Teste',cli:null,contato:'',cnpj:'',vend:state.pessoas[0].id,entrega:null,err:'',itens:[]}});A.wAdd({p:'cam-mc'})});
  await A.fill('#wTamN0','g5');await A.click('[data-a=wTamAdd]');await A.waitForTimeout(300);
  r=await A.evaluate(()=>({esp:state.cats.find(c=>c.id==='esp').t,cat:ui.sheet.w.itens[0].cat,campo:!!document.querySelector('[data-s="G5"]')}));
  ok(r.esp.includes('G5')&&r.cat==='esp'&&r.campo,'"Incluir tamanho" cria o G5 e mostra o campo dele');
  await A.evaluate(()=>{ui.sheet.w.step=3;render()});ok(await A.evaluate(()=>!!document.getElementById('wObs')),'o passo da data tem o campo Observações do pedido');

  console.log('4) Tecidos no cadastro do produto');
  await A.evaluate(()=>{openSheet({t:'produto',p:'polo-ams'})});await A.waitForTimeout(200);
  const temNovoTec=await A.evaluate(()=>!!document.getElementById('novoTec'));
  if(temNovoTec){await A.fill('#novoTec','Piquet PV, Malha dry');await A.click('[data-a=addTec]:not([data-v])');await A.waitForTimeout(300)}
  else await A.evaluate(()=>A.addTec({p:'polo-ams',v:'Piquet PV'})&&A.addTec({p:'polo-ams',v:'Malha dry'}));
  r=await A.evaluate(()=>prod('polo-ams').tecidos);ok(r.includes('Piquet PV')&&r.includes('Malha dry'),'vários tecidos de uma vez (separados por vírgula)');

  console.log('6) Várias fichas = um pedido só; bordado abreviado; cor secundária; opções da peça');
  await A.evaluate(()=>{const b=prod('blusa');b.opcoes=[{id:'capuz',nome:'Com capuz',aviam:[],steps:[]},{id:'canguru',nome:'Bolso canguru',aviam:[],steps:[]}];ui.sheet=null;render()});
  await A.setInputFiles('#fImpF',['ficha-teste-3.docx','ficha-teste-4.docx'].map(f=>path.join(FX,f)));
  await A.waitForFunction(()=>ui.sheet&&ui.sheet.t==='imp',null,{timeout:30000});
  r=await A.evaluate(()=>{const G=ui.sheet.grupos,g=G[0];return {n:G.length,itens:g.itens.length,av:g.avisos.join(' | '),
    polo:{cor:g.itens[0].cor,c2:g.itens[0].cores2,tipos:g.itens[0].pers.map(x=>x.tipo&&tipo(x.tipo).nome)},blusa:{prod:g.itens[1].prod,op:g.itens[1].opcoes,tipos:g.itens[1].pers.map(x=>x.tipo&&tipo(x.tipo).nome)}}});
  ok(r.n===1&&r.itens===2,'duas fichas com números diferentes viram um pedido só');ok(/números diferentes/.test(r.av),'avisa que os números das fichas são diferentes');
  ok(r.polo.cor==='Azul celeste','cor principal lida mesmo com o resto do texto ("AZUL CELESTE com gola…")');
  ok(r.polo.c2.length===1&&r.polo.c2[0].cor==='Preta'&&['Cobre gola','Punhos','Peitilho'].every(x=>r.polo.c2[0].partes.includes(x)),'cor secundária e onde ela vai preenchidas sozinhas (na polo, gola = cobre gola): '+JSON.stringify(r.polo.c2));
  ok(r.polo.tipos.every(t=>/^Bordado/.test(t||'')),'"Bord" na ficha = Bordado');
  ok(r.blusa.prod==='blusa'&&r.blusa.op.includes('capuz')&&r.blusa.op.includes('canguru'),'Blusa com capuz e bolso canguru reconhecidos');
  const pend=await A.evaluate(()=>{const g=ui.sheet.grupos[0];g.vend=state.pessoas.find(p=>temPapel(p,'vendas')).id;const P=impPend(g);impCriar();return P});await A.waitForTimeout(600);ok(!pend.length,'nada pendente para criar: '+pend.join(', '));
  r=await A.evaluate(()=>{const p=state.pedidos.find(x=>/9002/.test(x.ficha||''));const ls=lotesDe(p.id);return {ficha:p.ficha,c2:ls[0].cores2,op:ls[1].opcoes}});
  ok(r.ficha==='9002 / 9003'&&r.c2.length===1&&r.op.includes('canguru'),'pedido criado com as duas fichas, a cor secundária e as opções');
  console.log('7) Mockup de peça azul-clara não é cortado');
  r=await A.evaluate(async()=>{const c=document.createElement('canvas');c.width=600;c.height=800;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,600,800);
    g.fillStyle='#8FD3F5';g.fillRect(150,100,300,640);/* peça azul celeste até perto do pé */const bl=await new Promise(ok=>c.toBlob(ok,'image/png'));
    const m=await mockDeArquivo(new File([bl],'azul.png',{type:'image/png'}));const im=new Image();im.src=m.g.c;await im.decode();
    const k=document.createElement('canvas');k.width=im.naturalWidth;k.height=im.naturalHeight;const kg=k.getContext('2d');kg.drawImage(im,0,0);const d=kg.getImageData(0,0,k.width,k.height).data;
    let y0=k.height,y1=0;for(let y=0;y<k.height;y++)for(let x=0;x<k.width;x+=4){const i=(y*k.width+x)*4;if(d[i]<200){if(y<y0)y0=y;if(y>y1)y1=y}}return (y1-y0)/k.height});
  ok(r>0.85,`a peça inteira continua no mockup (altura ${Math.round(r*100)}% do quadro)`);
  console.log('8) Ficha de produção colorida');
  r=await A.evaluate(()=>{const p=state.pedidos.find(x=>/9002/.test(x.ficha||''));const l=lotesDe(p.id)[0];openSheet({t:'doc',tipo:'prod',id:p.id,cinza:{},vias:2,mocks:true,pb:false});const cor=paginasDoc(ui.sheet)[0];ui.sheet.pb=true;const pb=paginasDoc(ui.sheet)[0];return {cor:/class="a4 fp colorida"/.test(cor),pb:/class="a4 fp"/.test(pb)&&!/fp colorida/.test(pb),bot:!!document.querySelector('[data-a=docPb]')}});
  ok(r.cor,'a ficha sai colorida por padrão');ok(r.pb&&r.bot,'preto e branco continua como opção');
  console.log('9) Listas suspensas no pedido');
  await A.evaluate(()=>{openSheet({t:'novo',w:{step:2,cliente:'Teste',cli:null,contato:'',cnpj:'',vend:state.pessoas[0].id,entrega:null,err:'',itens:[]}});A.wAdd({p:'polo-vie'})});
  r=await A.evaluate(()=>({sel:document.querySelectorAll('select.sel').length,botCor:document.querySelectorAll('button.cor[data-a=wCor]').length}));
  ok(r.sel>=2&&r.botCor===0,'tecido e cor são listas suspensas (sem a grade de botões de cor)');
  await A.selectOption('select[data-sel=wCor]','Preta');ok(await A.evaluate(()=>ui.sheet.w.itens[0].cor==='Preta'),'escolher na lista suspensa funciona');
  console.log('10) Word com cabeçalho, caixa de texto e célula mesclada');
  await A.evaluate(()=>{ui.sheet=null;render()});await A.setInputFiles('#fImpF',[path.join(FX,'ficha-teste-caixa.docx')]);
  await A.waitForFunction(()=>ui.sheet&&ui.sheet.t==='imp',null,{timeout:30000});
  r=await A.evaluate(()=>{const g=ui.sheet.grupos[0],it=g.itens[0];return {cli:g.cliente,num:g.num,ent:g.entrega&&new Date(g.entrega).toISOString().slice(0,10),n:g.itens.length,g:it.g,ok:it.gOk,cor:it.cor,c2:it.cores2,pers:it.pers.map(x=>x.tipo),mock:!!it.mock}});
  ok(r.cli==='CAIXA DE TEXTO LTDA'&&r.num==='9010','empresa (no cabeçalho do Word) e número (na caixa de texto) lidos');
  ok(r.ent==='2026-10-20','prazo de entrega lido de dentro da caixa de texto');
  ok(r.n===1&&r.g.M===7&&r.g.G===3&&r.ok,'tabela de tamanhos lida, com a linha de total mesclada');
  ok(r.cor==='Verde'&&r.c2.length===1&&r.c2[0].cor==='Branca','cor e outra cor lidas');ok(r.pers.length===1&&r.pers[0]==='bordado','personalização lida uma vez só (sem repetir a caixa de texto)');
  ok(r.mock,'imagem do Word virou o mockup');
  console.log('5) Central de dúvidas');
  for(const [q,esp] of [['ficha em word','Dá para importar ficha em Word?'],['tamanho especial','Como lanço um tamanho especial (G1, EXG…)?'],['observação do pedido','Onde escrevo observações do pedido?'],['tecido novo no produto','Como coloco um tecido novo num produto?']])
    ok(await A.evaluate(([q,esp])=>ajBusca(q)[0]?.f.q===esp,[q,esp]),`"${q}" acha a resposta certa`);
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros[0]:''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
