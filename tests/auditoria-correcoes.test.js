// Teste: correções da auditoria do Quadro (16/11). Cenário com ~90 pedidos (tests/cenario-real.js), só dados de demonstração.
// Onda 1: QR nunca inventa checklist (usa a saída real da migração 017, tests/fixtures/ficha-publica-017.json) e não mostra nomes;
// quadro na largura toda do PC, colunas que cabem, navegação com texto, página que não escorrega; calendário sem grade espremida;
// cabeçalho de Pedidos sem estourar e com o sininho visível em 8 tamanhos de tela.
// Rodar: NODE_PATH=$(npm root -g) node tests/auditoria-correcoes.test.js
const { chromium } = require('playwright');const path=require('path'),fs=require('fs');
const APP='file://'+path.resolve(__dirname,'../app.html');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const CEN=require('./cenario-real.js');const FX=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/ficha-publica-017.json'),'utf8'));
const CLI=JSON.parse(fs.readFileSync(path.join(__dirname,'../clientes/martins.json'),'utf8'));CLI.admins=[{id:'u-a',email:'a@x.test',nome:'Ana Souza'},{id:'u-b',email:'b@x.test',nome:'Bruno Lima'}];
const mock='data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'fixtures/mockup-marinho.png')).toString('base64');
const SZ=[[360,640],[390,844],[768,1024],[1024,768],[1280,800],[1366,768],[1800,900],[1920,1080]];
(async()=>{const b=await chromium.launch();const erros=[];
  const abre=async(w,h,o)=>{const ctx=await b.newContext({viewport:{width:w,height:h}});await ctx.addInitScript(c=>{window.claude={use:async()=>null};window.CLIENTE=c;try{localStorage.setItem('martins-v8-ajuda','1')}catch(e){}},CLI);
    const A=await ctx.newPage();A.on('pageerror',e=>erros.push(w+': '+e.message));await A.goto(APP);await A.waitForTimeout(1000);await A.evaluate(`(${CEN.toString()})(${JSON.stringify({mock,...(o||{})})})`);return {A,ctx}};

  console.log('1) QR code: nada inventado, sem nomes');
  let {A,ctx}=await abre(360,640);
  const qr=async(ped)=>A.evaluate(ped=>{const p=state.pedidos.find(p=>!p.concluido&&lotesDe(p.id).length);const l=lotesDe(p.id)[0];const m=paraDocs(state);
    const docs={'config/main':{v:8,cores:m['config/main'].cores,marca:m['config/main'].marca,quadro:m['config/main'].quadro},['lotes/'+l.id]:{...m['lotes/'+l.id],steps:{}}};
    Object.keys(m).filter(k=>k.startsWith('tipos/')||k.startsWith('produtos/')).forEach(k=>docs[k]=m[k]);
    docs['pedidos/'+p.id]={id:p.id,cli:p.cli,cliente:p.cliente,vendedor:p.vendedor,chegada:p.chegada,entrega:p.entrega,anexos:[],materiais:[],artes:{},...(ped||{}),id:p.id};
    const salvo=state;state=deDocs(docs);normalizar(state);ui.sheet={t:'doc',tipo:'prod',id:p.id,so:l.id,vias:1,mocks:false,pb:false,cinza:{},pub:true};PUB_L=l.id;fichaPubRender();
    const c=document.querySelector('.pub-qd'),t=c?c.innerText:'';state=salvo;return t},ped);
  let t=await qr(null);ok(/não está disponível/.test(t)&&!/Checklist \d/.test(t),'banco sem a 017 (sem cartão): diz que não está disponível, sem checklist inventado');
  t=await qr(FX.com_cartao);ok(/Checklist 16\/16/.test(t)&&/Agora em: Corte/.test(t),'saída real da 017 com 16 de 16 feitos: o QR mostra 16/16');
  ok(!/Regina|Marcado por/.test(t)&&/Feito em/.test(t),'sem nome de quem marcou: só "Feito em" e a data');
  t=await qr({qdc:{c:'corte',n:'Corte',t:'X',ck:[3,16]}});ok(/não veio/.test(t)&&!/Checklist 0/.test(t),'cópia diz 3 feitos mas o checklist não veio: avisa, não mostra 0/16');
  t=await qr({qdc:{c:'corte',n:'Corte',t:'X',ck:[0,16]}});ok(/Checklist 0\/16/.test(t),'pedido que nunca mexeu no checklist (cópia confirma 0): mostra 0/16, que é o real');
  const fonte=fs.readFileSync(path.join(__dirname,'../supabase/migrations/017_qr_cartao.sql'),'utf8');ok(/ck_publico\(p->'ck'\)/.test(fonte),'a migração manda o checklist pela função que tira os nomes');
  let r=await A.evaluate(()=>{const p=state.pedidos[0];qdCkGarante(p);delete p.qdc;state.pedidos.forEach(x=>delete x.qdc);save();const n1=state.pedidos.filter(x=>x.qdc).length;save();const n2=state.pedidos.filter(x=>x.qdc).length;return {n1,n2,sem:!state.pedidos.some(x=>x.qdc&&x.qdc.r)}});
  ok(r.n1===8&&r.n2===16&&r.sem,`a cópia para o QR entra aos poucos (8 por salvamento: ${r.n1}, depois ${r.n2}) e sem nomes`);
  await ctx.close();

  console.log('2) Quadro, cabeçalho e calendário em 8 tamanhos (com ~90 pedidos)');
  const res={};
  for(const [w,h] of SZ){({A,ctx}=await abre(w,h));const r={};
    for(const pv of ['ped','qd','cal']){await A.evaluate(pv=>{ui.pv=pv;render();scrollTo(0,0)},pv);await A.waitForTimeout(80);
      r[pv]=await A.evaluate(()=>{const s=document.querySelector('.topo .sino').getBoundingClientRect(),v=[...document.querySelectorAll('.vista-b')].filter(e=>e.offsetParent);
        return {over:document.documentElement.scrollWidth>innerWidth,sino:s.width>0&&s.right<=innerWidth,vistas:v.length,vistaTxt:v.every(e=>e.innerText.trim().length>1),vistaAlt:Math.min(...v.map(e=>e.getBoundingClientRect().height)),
          letraV:[...document.querySelectorAll('.cal-p,.cal-dl')].filter(e=>e.offsetParent&&e.getBoundingClientRect().width<120).length}})}
    await A.evaluate(()=>{ui.pv='qd';render();scrollTo(0,0)});
    r.q=await A.evaluate(()=>{const B=document.getElementById('qdCols'),br=B.getBoundingClientRect(),C=[...B.querySelectorAll(':scope>.qd-col')];return {cols:C.length,inteiras:C.filter(c=>{const q=c.getBoundingClientRect();return q.left>=br.left-1&&q.right<=br.right+1}).length,nav:!document.getElementById('qdNav').hidden,fundoVis:br.bottom<=innerHeight+40}});
    await A.evaluate(()=>{const bts=[...document.querySelectorAll('.qd-ir')];bts[bts.length-1].click()});await A.waitForTimeout(700);
    r.ir=await A.evaluate(()=>({sx:scrollX,over:document.documentElement.scrollWidth>innerWidth,ultima:(()=>{const B=document.getElementById('qdCols'),C=[...B.querySelectorAll(':scope>.qd-col')],q=C[C.length-1].getBoundingClientRect(),br=B.getBoundingClientRect();return q.right<=br.right+2&&q.left>=br.left-2})()}));
    res[w]=r;await ctx.close()}
  const W=Object.keys(res).map(Number);
  ok(W.every(w=>!res[w].ped.over&&!res[w].qd.over&&!res[w].cal.over),'a página nunca fica mais larga que a tela (Lista, Quadro e Calendário, nos 8 tamanhos)');
  ok(W.every(w=>res[w].ped.sino&&res[w].qd.sino&&res[w].cal.sino),'o sininho fica sempre visível no cabeçalho (inclusive em 768 e 1024)');
  ok(W.every(w=>res[w].ped.vistas===4&&res[w].ped.vistaTxt&&res[w].ped.vistaAlt>=44),'as 4 vistas (Lista, Quadro, Calendário, Empresas) sempre com texto');
  ok(W.filter(w=>w<1100).every(w=>res[w].ped.vistaAlt>=48),'abaixo de 1.100 px, botões de vista com 48 px de altura');
  ok(W.every(w=>res[w].cal.letraV===0),'calendário sem pedido espremido (nada com menos de 120 px de largura)');
  ok(res[1920].q.inteiras>=8&&res[1366].q.inteiras>=5&&res[1280].q.inteiras>=5,`colunas inteiras visíveis: 1920 px = ${res[1920].q.inteiras}, 1366 px = ${res[1366].q.inteiras}, 1280 px = ${res[1280].q.inteiras} (antes: 3)`);
  ok(W.filter(w=>w>=1024).every(w=>res[w].q.fundoVis),'no computador o quadro cabe na tela: a rolagem para o lado fica à vista, não no fim de uma coluna');
  ok(W.filter(w=>w>=768).every(w=>res[w].q.inteiras===res[w].q.cols||res[w].q.nav),'quando não cabem todas, aparecem "Colunas anteriores" e "Próximas colunas"');
  ok(W.every(w=>res[w].ir.sx===0&&!res[w].ir.over&&res[w].ir.ultima),'tocar no nome da última coluna mostra a coluna sem deslocar a página');

  console.log('3) Onda 2: cartões, Caixa de entrada, prazos, checklist e pedido');
  ({A,ctx}=await abre(1366,768));
  r=await A.evaluate(()=>{ui.pv='qd';render();const c=document.querySelector('.qd-card'),cp=c.querySelector('.qd-capa');return {capa:cp?Math.round(cp.getBoundingClientRect().height):0,h:Math.round(c.getBoundingClientRect().height),zero:[...document.querySelectorAll('.qd-card')].filter(e=>{const p=pedById(e.dataset.id);return qdCkConta(p)[0]===0&&/0\/\d/.test(e.querySelector('.qd-rod').textContent)}).length}});
  ok(r.capa<=90&&r.capa>=70,`capa do cartão com ${r.capa} px (antes 140)`);ok(r.zero===0,'nenhum cartão mostra "0/16" quando nada foi marcado');
  r=await A.evaluate(()=>{const cx0=!document.getElementById('qdc-caixa'),bt=!!document.querySelector('.qd-cx-b');A.qdIr({c:'caixa'});const aberta=!!document.getElementById('ntNova');document.getElementById('ntNova').value='Teste caixa';A.ntAdd();ui.cxAb=false;render();
    const comNota=!!document.getElementById('qdc-caixa'),n=document.querySelector('.qd-cx-b small').textContent;return {cx0,bt,aberta,comNota,n}});
  ok(r.cx0&&r.bt,'Caixa de entrada vazia não ocupa coluna: vira um botão "Caixa de entrada 0"');ok(r.aberta&&r.comNota&&r.n==='1','o botão abre a caixa; com anotação, a coluna aparece e o número diz quantas');
  r=await A.evaluate(()=>{const p=state.pedidos.find(p=>!p.concluido&&!p.cancelado&&lotesDe(p.id).length);const ent=p.entrega;p.entrega=now()-3*DIA;const a=qdPrazoInfo(p);
    lotesDe(p.id).forEach(l=>rp(l).steps.forEach(s=>l.steps[s.id]={st:'ok',ini:now()-H,fim:now()}));RC={};const b=qdPrazoInfo(p);p.concluido=now();const c=qdPrazoInfo(p);p.concluido=null;p.entrega=now()+DIA;
    lotesDe(p.id).forEach(l=>l.steps={});RC={};const d=qdPrazoInfo(p);p.entrega=now()+20*DIA;const e=qdPrazoInfo(p);p.entrega=ent;return [a,b,c,d,e]});
  ok(r[0].c==='crit'&&/atrasado/.test(r[0].t),'atrasado e não pronto: vermelho, "atrasado N dias úteis"');ok(r[1].c==='pronto'&&/falta entregar/.test(r[1].t),'pronto mas não entregue: azul, "pronto, falta entregar" (não é atraso da produção)');
  ok(r[2].c==='ok'&&r[3].c==='warn'&&r[4].c==='','entregue = verde; vence amanhã = amarelo; com folga = sem cor');
  r=await A.evaluate(()=>{const Q=QD(),p=state.pedidos.find(p=>!p.concluido&&!p.cancelado&&qdColDe(p)&&qdColDe(p).tipo==='prod'&&Q.cols[qdIdxPed(p)].nome!=='Corte');delete p.ck;const antes=JSON.stringify(qdCkDe(p).map(g=>g.itens.map(x=>x.ok)));
    A.qdAbre({id:p.id});const d=document.querySelector('details[data-blk^="qd"]'),fechado=!d.open;d.open=true;const txt=d.innerText;const depois=JSON.stringify(qdCkDe(p).map(g=>g.itens.map(x=>x.ok)));
    const sh=document.querySelector('.sheet');const pos=k=>{const e=document.querySelector(`[data-blk^="${k}"]`);return e?e.getBoundingClientRect().top+sh.scrollTop:1e9};
    return {fechado,ctx:/a produção já passou desta etapa/.test(txt),igual:antes===depois,ordem:pos('anx')<pos('cm')&&pos('pecas')<pos('cm')&&pos('cm')<pos('qh'),resumo:!!d.querySelector('summary .qd-resumo')}});
  ok(r.fechado&&r.resumo,'no pedido, o bloco do quadro vem fechado, com etiquetas e responsáveis no resumo');ok(r.ctx&&r.igual,'checklist mostra "a produção já passou desta etapa" sem marcar nenhum item');
  ok(r.ordem,'Anexos e Peças e etapas vêm antes de Comentários e Histórico');
  await ctx.close();

  console.log('4) Onda 3: avisos, vistas e configuração');
  ({A,ctx}=await abre(390,844));
  r=await A.evaluate(()=>{const u=state.usuarios[1],p=state.pedidos.find(p=>!p.concluido&&!p.cancelado&&lotesDe(p.id).some(l=>!loteDone(l)));p.resp=[u.id];p.respEm={[u.id]:{ts:now()-6e4,por:'Ana Souza'}};p.entrega=now()+DIA*2.2;p.lemb=4;
    SESSAO={id:u.id,email:u.email};ui.sino=true;render();const pop=document.getElementById('pop').innerText;const n1=notifsNovas(u).filter(n=>n.p===p).length;
    document.querySelector('[data-a=avTodosVistos]').click();const toast_=document.getElementById('toast').innerText;const n2=notifsNovas(u).filter(n=>n.p===p).length;const doc=paraDocs(state)['pedidos/'+p.id].ntVisto[u.id];
    const dn=Date.now;Date.now=()=>dn()+DIA*1.1;const n3=notifsNovas(u).filter(n=>n.p===p).length;Date.now=dn;
    p.entrega=now()-DIA;const n4=notifsNovas(u).filter(n=>n.p===p).map(n=>n.k).join();window.__p=p.id;return {pop,n1,toast_,n2,doc:!!(doc&&doc.k&&doc.k.length),n3,n4}});
  ok(!/Nenhum aviso novo/.test(r.pop)&&/novos?/.test(r.pop)&&r.n1===2,'sininho: avisos novos numa lista só, sem "Nenhum aviso novo" ao lado ('+r.n1+' do pedido)');
  ok(r.n2===0&&/vistos/.test(r.toast_),'"Marcar todos como vistos" zera os novos e confirma na tela');ok(r.doc,'o visto fica gravado no pedido (vale em todos os aparelhos)');
  ok(r.n3===0,'no dia seguinte, o mesmo aviso de prazo não volta como novo');ok(r.n4==='atraso','se o pedido passa a atrasar, vira um aviso novo ("atraso")');
  r=await A.evaluate(()=>{const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};ui.sino=false;ui.tela='pedidos';A.pv({v:'qd'});const qd=!!document.getElementById('qdCols');A.tela({t:'fabrica'});A.tela({t:'pedidos'});
    let ls=null;try{ls=localStorage.getItem('pd-pv')}catch(e){}return {qd,lista:!!document.getElementById('pedLista'),ls}});
  ok(r.qd&&r.lista&&!r.ls,'trocar para Quadro funciona; ao sair e voltar para Pedidos, abre a Lista (nada gravado no aparelho)');
  r=await A.evaluate(()=>{ui.tela='cadastros';ui.cad='ajustes';render();const q=document.getElementById('Quadro');if(q.tagName==='DETAILS')q.open=true;const so=[...q.querySelectorAll('button')].filter(b=>b.offsetParent!==null||true).filter(b=>!/[A-Za-zÀ-ú]{3,}/.test(b.textContent));
    const ta=!!q.querySelector('textarea#qdCkTxt'),cfg=q.querySelectorAll('[data-ckcfg]').length;document.querySelector('[data-a=qdCkCfg][data-o=grm]').click();const pede=!!ui.conf;A.confNao();return {so:so.map(b=>b.textContent.trim()).filter(x=>x!=='↑'&&x!=='↓'),ta,cfg,pede}});
  ok(!r.so.length,'configuração do quadro sem botões só com símbolo (fora as setas de item)'+(r.so.length?': '+r.so.join(' | '):''));ok(!r.ta&&r.cfg>10,'checklist padrão editado em campos, um por grupo e item (sem texto com regra de dois-pontos)');ok(r.pede,'tirar grupo do checklist padrão pede confirmação');
  await ctx.close();

  console.log('5) Onda 4: anexos do Trello e arquivos no QR com o espaço fechado (servidores simulados)');
  ({A,ctx}=await abre(1280,800));
  await ctx.route('https://trello.com/**',r=>{const u=r.request().url();if(/ok\.pdf/.test(u))return r.fulfill({status:200,body:Buffer.alloc(2048,7),headers:{'access-control-allow-origin':'*','content-type':'application/pdf'}});return r.fulfill({status:401,body:'unauthorized',headers:{'access-control-allow-origin':'*'}})});
  const J={lists:[{id:'L',name:'Costura'}],labels:[],checklists:[],actions:[],cards:[{id:'C1',name:'',idList:'L',idLabels:[],attachments:[
    {id:'t1',name:'ficha ok.pdf',url:'https://trello.com/1/cards/C1/attachments/t1/download/ok.pdf',bytes:2048},{id:'t2',name:'mockup.png',url:'https://trello.com/1/cards/C1/attachments/t2/download/mockup.png',bytes:999},
    {id:'t3',name:'Pasta no Drive',url:'https://drive.google.com/drive/folders/abc'}]}]};
  r=await A.evaluate(J=>{const p=state.pedidos.find(p=>!p.cancelado);J.cards[0].name=(numCA(p)||p.id)+' teste';trelloAplica(trelloPlano(J));const L=anexosPed(p).filter(a=>a.tr);
    return {pid:p.id,n:L.length,dep:L.filter(a=>a.trDep).map(a=>a.nome).sort().join('|'),cart:(ui.tela='cadastros',ui.cad='ajustes',render(),document.getElementById('Quadro').textContent)}},J);
  ok(r.n===3&&r.dep==='ficha ok.pdf|mockup.png','só os arquivos guardados no Trello ficam marcados "ainda no Trello" (o link do Drive não)');ok(/Anexos que ainda dependem do Trello\s*2/.test(r.cart),'Ajustes › Quadro mostra quantos ainda dependem do Trello (2)');
  r=await A.evaluate(async pid=>{const L=anexosPed(pedById(pid)),a=L.find(x=>x.nome==='ficha ok.pdf'),b=L.find(x=>x.nome==='mockup.png');const ra=await trCopiar(a.id),rb=await trCopiar(b.id);
    return {ra,rb,a:{link:!!a.link,bin:!!a.bin,dep:a.trDep,ver:a.ver&&a.ver[0]&&a.ver[0].link,copia:!!a.trCopia,tam:a.tam},b:{link:!!b.link,dep:b.trDep,erro:b.trErro&&b.trErro.motivo},resta:trDependentes().length,hist:qdHistLista(pedById(pid)).some(e=>/versão 2/.test(e.t))}},r.pid);
  ok(r.ra.ok&&!r.a.link&&r.a.bin&&r.a.dep===false&&r.a.copia&&r.a.tam===2048,'cópia automática: o arquivo passa a ser guardado no app, com o tamanho conferido');ok(/trello\.com/.test(r.a.ver||'')&&r.hist,'o link antigo do Trello fica guardado nas versões e no histórico');
  ok(!r.rb.ok&&r.b.link&&r.b.dep&&/login/.test(r.b.erro||''),'quando o Trello pede login: não finge que copiou, guarda o motivo e o anexo continua marcado');ok(r.resta===1,'falta 1 anexo dependendo do Trello');
  r=await A.evaluate(J=>{const n0=state.arquivos.length;trelloAplica(trelloPlano(J));return state.arquivos.length-n0},J);ok(r===0,'importar de novo não duplica anexos');
  await ctx.close();
  const c2=await b.newContext({viewport:{width:390,height:844}});await c2.addInitScript(()=>{window.MARTINS_SB={url:'https://sb.test',key:'anon-teste'};window.claude={use:async()=>null}});
  await c2.route('https://sb.test/**',r=>{const u=r.request().url();if(/object\/public\//.test(u))return r.fulfill({status:400,body:'{"error":"Bucket not public"}'});
    if(/functions\/v1\/arquivo-qr/.test(u)){const b=JSON.parse(r.request().postData()||'{}');return r.fulfill({status:b.k==='A-x1'?200:404,contentType:'application/json',body:JSON.stringify(b.k==='A-x1'?{url:'https://sb.test/storage/v1/object/sign/arquivos/b/x1?token=t'}:{erro:'não'}),headers:{'access-control-allow-origin':'*'}})}
    if(/object\/sign\//.test(u))return r.fulfill({status:200,body:'conteudo-assinado',headers:{'access-control-allow-origin':'*'}});return r.fulfill({status:404,body:'{}',headers:{'access-control-allow-origin':'*'}})});
  const Q=await c2.newPage();Q.on('pageerror',e=>erros.push('QR: '+e.message));await Q.goto(APP+'#f=ab12cd34ef56ab12cd34ef56ab12cd');await Q.waitForTimeout(1200);
  r=await Q.evaluate(async()=>{const a=await arqBaixa('b/x1','A-x1'),b=await arqBaixa('b/outro','A-outro');return {a:a&&atob(a.split(',')[1]),b}});
  ok(r.a==='conteudo-assinado'&&r.b===null,'QR sem login com o espaço fechado: pega o link temporário da função arquivo-qr; arquivo de outra peça não abre');
  await c2.close();

  console.log('6) Revisão independente: correções');
  ({A,ctx}=await abre(1366,768));
  r=await A.evaluate(()=>{ui.pv='qd';render();const B=document.getElementById('qdCols');B.scrollLeft=300;const cc=B.querySelector('.qd-col .qd-col-c');cc.scrollTop=200;const t0=cc.scrollTop,l0=B.scrollLeft;render();
    const B2=document.getElementById('qdCols'),c2=B2.querySelector('.qd-col .qd-col-c');return {l:B2.scrollLeft===l0&&l0>0,t:c2.scrollTop===t0&&t0>0}});
  ok(r.l&&r.t,'o quadro guarda a rolagem (para o lado e dentro da coluna) quando a tela é redesenhada');
  r=await A.evaluate(()=>{const p=state.pedidos.find(p=>!p.concluido&&!p.cancelado&&lotesDe(p.id).some(l=>!loteDone(l)));const d=new Date();d.setHours(17,0,0,0);p.entrega=d.getTime();const dn=Date.now;Date.now=()=>d.getTime()+3600e3;RC={};const i=qdPrazoInfo(p);Date.now=dn;return i});
  ok(r.c==='crit'&&r.t==='venceu hoje','no dia da entrega, depois das 17h: "venceu hoje" (não "vence hoje" junto com "atrasado")');
  r=await A.evaluate(()=>{const P=trelloPlano({lists:[{id:'L'}],labels:[],checklists:[],actions:[],cards:[{id:'X',name:'9999 x',idList:'L',attachments:[{id:'a',name:'mal',url:'javascript:alert(1)'},{id:'b',name:'ok',url:'https://drive.google.com/x'}]}]});return P.caixa[0].ax.map(a=>a.nome).join()});
  ok(r==='ok','link do Trello que não é http(s) (ex.: javascript:) é ignorado na importação');
  await ctx.close();
  for(const [w,h] of [[1024,768],[1366,768],[1920,1080]]){({A,ctx}=await abre(w,h));
    r=await A.evaluate(()=>{ui.pv='qd';render();const B=document.getElementById('qdCols').getBoundingClientRect(),n=document.querySelector('.nav'),nt=n&&getComputedStyle(n).display!=='none'?n.getBoundingClientRect().top:innerHeight;return {b:Math.round(B.bottom),nt:Math.round(nt)}});
    ok(r.b<=r.nt+1,`${w}×${h}: o fim do quadro (e a barra de rolagem) fica acima da barra de baixo (${r.b} ≤ ${r.nt})`);await ctx.close()}
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.slice(0,3).join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
