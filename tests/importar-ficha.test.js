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
  await ctx.addInitScript(()=>{try{if(!localStorage.getItem('martins-sessao'))localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helenanenimga67@gmail.com'}))}catch(e){}});
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

  console.log('5) Central de dúvidas');
  for(const [q,esp] of [['ficha em word','Dá para importar ficha em Word?'],['tamanho especial','Como lanço um tamanho especial (G1, EXG…)?'],['observação do pedido','Onde escrevo observações do pedido?'],['tecido novo no produto','Como coloco um tecido novo num produto?']])
    ok(await A.evaluate(([q,esp])=>ajBusca(q)[0]?.f.q===esp,[q,esp]),`"${q}" acha a resposta certa`);
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros[0]:''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
