// Teste: leitura dos modelos de ficha da fábrica (pedido da Martins, 19/10) e ficha de produção no A4.
// Confere: Word antigo (.doc) com tabela, rótulos "no tecido / na cor", personalização sem dois-pontos, tabela do PDF com cabeçalho
// quebrado (G + G = GG, TOTA + L) e números fora do alinhamento; ficha de produção cabe no A4, bolinhas de cor em desenho,
// masculina e feminina do mesmo produto na mesma ficha e descrição do bordado.
// A ficha .doc do teste é fictícia (EMPRESA TST, pedido 9002). Rodar: NODE_PATH=$(npm root -g) node tests/fichas-trello.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path'),os=require('os'),{execFileSync}=require('child_process');
const APP='file://'+path.resolve(__dirname,'../app.html');const FX=path.join(__dirname,'fixtures');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const cache=path.join(os.tmpdir(),'martins-cdn');fs.mkdirSync(cache,{recursive:true});
const cdn=url=>{const f=path.join(cache,url.replace(/[^a-z0-9.]+/gi,'_'));if(!fs.existsSync(f))execFileSync('curl',['-sfL','-o',f,url]);return fs.readFileSync(f)};
(async()=>{const b=await chromium.launch();const erros=[];const ctx=await b.newContext({viewport:{width:900,height:1200}});
  await ctx.route(/cdnjs\.cloudflare\.com/,r=>r.fulfill({body:cdn(r.request().url()),contentType:'application/javascript'}));
  const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));await A.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.sheet=null;render()});
  console.log('1) Word antigo (.doc)');
  await A.setInputFiles('#fImpF',[path.join(FX,'ficha-teste-word97.doc')]);await A.waitForFunction(()=>ui.sheet&&ui.sheet.t==='imp',null,{timeout:30000});
  let r=await A.evaluate(()=>{const g=ui.sheet.grupos[0];return {num:g.num,cli:g.cliente,ch:new Date(g.chegada).toISOString().slice(0,10),en:new Date(g.entrega).toISOString().slice(0,10),
    it:g.itens.map(i=>({g:i.g,gen:i.gen,rot:i.rot,tec:i.tecTxt,cor:i.corTxt,ok:i.gOk,pers:i.pers.map(x=>[x.rot,x.desc,x.tipo])}))}});
  ok(r.num==='9002'&&r.cli==='EMPRESA TST','abre o .doc: pedido 9002, empresa EMPRESA TST');
  ok(r.ch==='2026-09-14'&&r.en.slice(5)==='10-14','datas de fechamento e entrega lidas');
  ok(r.it.length===4,'4 linhas da tabela viram 4 peças ('+r.it.length+')');
  const G=r.it.map(i=>JSON.stringify(i.g));ok(G[0]==='{"P":3,"GG":3}'&&G[1]==='{"PP":3}'&&G[2]==='{"P":1,"GG":1}'&&G[3]==='{"PP":1}'&&r.it.every(i=>i.ok),'tamanhos certos e conferidos com o total da linha');
  ok(r.it.map(i=>i.gen).join('')==='MFMF'&&/longa/i.test(r.it[2].rot),'masculina, feminina e manga longa pelo nome da linha');
  ok(/piquet dry/i.test(r.it[0].tec)&&/marinho/i.test(r.it[0].cor),'"no tecido PIQUET DRY na cor MARINHO" lidos');
  ok(r.it[0].pers.length===1&&/peito/i.test(r.it[0].pers[0][0])&&/Empresa Tst/.test(r.it[0].pers[0][1])&&r.it[0].pers[0][2],'personalização "PEITO: “…” bord." com local, descrição e tipo');
  console.log('2) Textos e tabela do PDF');
  r=await A.evaluate(()=>{ui.sheet=null;const d1=lerDescricao('Camisa polo no tecido PIQUET na cor MARINHO . Modelo AMSTERDÃ com peitilho interno, cobre gola e barra interna nas mangas na cor VERMELHA');
    const d2=lerDescricao('. CAMISETA gola redonda, na cor PRETA em MALHA FRIA.');
    const F={ehFicha:false};textoFicha(F,['FICHA DE PRODUÇÃO: TESTE 1/1','PRODUTO:','. Polo PIQUET DRY na cor MARINHO.','Obs Personalização:','BORDADO BRANCO peito esq. “Logo”','Cor/quantidade de Botão: 2 BOTÕES MARINHO','FECHOU: 16 OUTUBRO','PRAZO DE ENTREGA: 4 NOVEMBRO – EVENTO'].map(t=>({t})));
    // cabeçalho quebrado: "G" + "G" = GG, "TOTA" + "L"; números deslocados; nome da linha embaixo ("BERMUD" / "A")
    const it=[['Qdad',552,471,29],['4',153,465,9],['6',190,465,9],['G',480,465,14],['G',518,465,14],['e',563,457,5],['G',518,445,14],['TOTA',552,445,27],['L',563,434,7],
      ['15',143,314,25],['15',182,314,25],['10',474,314,12],['6',512,314,12],['46',553,313,26],['BERMUD',17,312,44],['A',35,301,7],['Total',25,232,29],['46',74,217,45]].map(([s,x,y,w])=>({s,x,y,w}));
    const T={linhas:[]};tabelaPdf(T,it);return {d1,d2,F:{cli:F.cliente,loc:F.locais,bot:F.botao,obs:F.obs,fe:!!F.fechou,pr:!!F.prazo},T}});
  ok(r.d1.tecidoTxt==='PIQUET'&&r.d1.corTxt==='MARINHO'&&/VERMELHA/.test(r.d1.detalhe),'descrição do Word: tecido, cor e detalhes');
  ok(/MALHA FRIA/.test(r.d2.tecidoTxt)&&r.d2.corTxt==='PRETA','descrição do PDF: cor antes do tecido');
  ok(r.F.loc.length===1&&/peito esq/i.test(r.F.loc[0].rot)&&/BORDADO/.test(r.F.loc[0].txt)&&/Logo/.test(r.F.loc[0].txt),'personalização sem dois-pontos: "BORDADO BRANCO peito esq. “Logo”"');
  ok(/2 BOT/.test(r.F.bot)&&/EVENTO/.test(r.F.obs)&&r.F.fe&&r.F.pr,'botão, observação depois da data ("EVENTO") e datas');
  ok(r.T.linhas.length===1&&JSON.stringify(r.T.linhas[0].g)==='{"4":15,"6":15,"G":10,"GG":6}'&&r.T.linhas[0].ok&&r.T.linhas[0].rot==='BERMUDA'&&r.T.totalGeral===46,'tabela do PDF: GG quebrado, TOTAL quebrado, "BERMUD"+"A" = BERMUDA');
  console.log('3) Ficha de produção no A4');
  r=await A.evaluate(()=>{const ped=state.pedidos.find(p=>!p.concluido&&lotesDe(p.id).length);const l0=lotesDe(ped.id)[0];const pz=[{tipo:(state.tipos.find(t=>/bord/i.test(t.nome))||state.tipos[0]).id,parte:'Frente',pos:'Peito esquerdo',desc:'“Logo” branco/vermelho',id:'pz0'},{tipo:(state.tipos.find(t=>/bord/i.test(t.nome))||state.tipos[0]).id,parte:'Costas',id:'pz1'}];
    Object.assign(l0,{gen:'M',pers:pz,cores2:[{cor:Object.keys(state.cores)[3],partes:['Gola']}],obs:'Linha de teste '.repeat(12)});
    const l1={...JSON.parse(JSON.stringify(l0)),id:l0.id+'f',gen:'F',grade:{P:3,M:2},mock:null,steps:{}};state.lotes.push(l1);RC={};
    const e={tipo:'prod',id:ped.id,vias:1,cinza:{},pb:false,mocks:false};const P=paginasDoc(e);const R=document.getElementById('docRender');R.style.left='0';R.innerHTML=P.join('');ajustaFicha(R);
    const pg=[...R.querySelectorAll('.a4.fp')];const a=pg.find(x=>x.textContent.includes('MASCULINA + FEMININA'));const cab=pg.every(x=>x.scrollHeight<=x.clientHeight+1);
    const bol=a&&[...a.querySelectorAll('svg.fp-bol circle')].map(c=>c.getAttribute('fill'));const hex=coresAll()[l0.cor];
    const out={n:pg.length,nl:lotesDe(ped.id).filter(l=>!l.rework).length,junta:!!a,cab,bol,hex,c2:!!(a&&a.querySelector('.fp-c2 svg.fp-bol')),desc:!!(a&&/“Logo” branco\/vermelho/.test(a.textContent)&&/Descrição do bordado não informada/.test(a.textContent)),
      tab:!!(a&&/FEMININA/.test(a.querySelector('.fp-g').textContent))};R.innerHTML='';R.style.left='';return out});
  ok(r.junta&&r.n===r.nl-1,`masculina e feminina do mesmo produto saem numa ficha só (${r.n} fichas para ${r.nl} peças)`);
  ok(r.tab,'a tabela de tamanhos mostra a linha MASCULINA e a FEMININA');
  ok(r.cab,'todas as fichas cabem no A4');
  ok(r.bol&&r.bol[0]===r.hex&&r.c2,'bolinha da cor desenhada com a cor do tecido (sai na impressão) e bolinha da cor secundária');
  ok(r.desc,'descrição do bordado na ficha (e aviso quando falta)');
  console.log('4) Personalização simplificada no Novo pedido');
  r=await A.evaluate(()=>{const p=state.produtos.find(x=>(x.partes||[]).includes('Mangas')&&(x.partes||[]).includes('Costas'));openSheet({t:'novo',w:{step:2,cliente:'Teste',cli:null,contato:'',cnpj:'',vend:state.pessoas[0].id,entrega:null,err:'',itens:[]}});A.wAdd({p:p.id});
    document.querySelector('[data-a=wPadd]').click();const ops=[...document.querySelectorAll('#sheet [data-a=wPloc]')].map(b=>b.textContent.trim());
    const t=state.tipos.find(x=>faseG(x.grupo)==='pers').id;A.wPt({k:'0',v:t});document.getElementById('wPtam0').value='8 cm';document.getElementById('wPobs0').value='logo novo';
    document.querySelector('#sheet [data-a=wPloc][data-v="2"]').click();const tamFica=document.getElementById('wPtam0').value;document.querySelector('#sheet [data-a=wPok]').click();
    const x=ui.sheet.w.itens[0].pers[0];const chip=document.querySelector('#sheet .depc[aria-pressed=true]')?.textContent||'';
    const it=ui.sheet.w.itens[0];it.cor=Object.keys(state.cores)[0];if(!p.tecidos.includes('Tecido de teste'))p.tecidos.push('Tecido de teste');it.tecido='Tecido de teste';it.g={M:2};const w=ui.sheet.w;w.entrega=now()+20*DIA;
    w.step=4;render();const conf=document.getElementById('sheet').innerText;const compraCerta=conf.includes('Tecido de teste '+it.cor)&&!conf.includes(p.tecidos[0]+' '+it.cor);const n0=state.pedidos.length;A.wCriar();const ped=state.pedidos[state.pedidos.length-1];const lz=state.pedidos.length>n0?lotesDe(ped.id)[0].pers[0]:null;
    ui.sheet=null;render();return {ops,x,tamFica,chip,lz,compraCerta}});
  ok(r.ops.join('|')==='Peito esquerdo|Manga esquerda|Manga direita|Costas|Peito centralizado','só os 5 lugares: '+r.ops.join(', '));
  ok(r.tamFica==='8 cm','a medida digitada não some ao escolher o lugar');
  ok(r.x&&r.x.parte==='Mangas'&&r.x.lado==='dir'&&r.x.tam==='8 cm'&&r.x.desc==='logo novo','logo salvo: manga direita, medida 8 cm e observação');
  ok(/8 cm/.test(r.chip)&&/logo novo/.test(r.chip),'a lista mostra a medida e a observação do logo');
  ok(r.compraCerta,'"Vai precisar comprar" usa o tecido escolhido na peça (não o primeiro do cadastro)');
  ok(r.lz&&r.lz.tam==='8 cm'&&r.lz.desc==='logo novo','ao criar o pedido, medida e observação ficam gravadas na peça');
  console.log('5) Nº do pedido no Conta Azul');
  r=await A.evaluate(()=>{A.novo();const temCampo=!!document.getElementById('wFicha');document.getElementById('wFicha').value='7788';document.getElementById('wCli').value='Cliente Conta Azul';A.wNext&&0;
    const w=ui.sheet.w;wRead();w.cliente='Cliente Conta Azul';w.vend=state.pessoas[0].id;w.step=2;render();const p=state.produtos[0];A.wAdd({p:p.id});const it=w.itens[0];it.cor=Object.keys(state.cores)[0];it.tecido=p.tecidos[0];it.g={M:1};w.entrega=now()+20*DIA;A.wCriar();
    const ped=state.pedidos[state.pedidos.length-1];const P=paginasDoc({tipo:'prod',id:ped.id,vias:1,cinza:{},pb:false,mocks:false}).join('');const E=etiquetasDe(ped).join('');
    const sem=state.pedidos.find(x=>x!==ped&&!x.ficha&&lotesDe(x.id).length);const PS=sem?paginasDoc({tipo:'prod',id:sem.id,vias:1,cinza:{},pb:false,mocks:false}).join(''):'';
    ui.sheet=null;openSheet({t:'pedido',id:sem.id});const head=document.getElementById('sheet')?.innerText||document.body.innerText;ui.sheet=null;render();
    return {temCampo,ficha:ped.ficha,docOk:/PEDIDO <b>7788<\/b>/.test(P)&&!new RegExp('PEDIDO <b>'+ped.id+'<').test(P),etq:E.includes('7788')&&!E.includes('>'+ped.id+' ·'),semNum:/PEDIDO <b>______<\/b>/.test(PS),botao:/Pôr o número/.test(head)}});
  ok(r.temCampo&&r.ficha==='7788','pedido novo tem o campo "Nº do pedido no Conta Azul" e grava o número');
  ok(r.docOk&&r.etq,'ficha de produção e etiquetas mostram o nº do Conta Azul, não o número automático');
  ok(r.semNum&&r.botao,'sem número: a ficha deixa espaço em branco e o pedido mostra "Pôr o número"');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
