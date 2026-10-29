// Teste: pedido da Martins de 29/10. Vários anexos por personalização e no pedido (imagem e programa do bordado, arte, logo),
// bloco "Anexos" no pedido e botão "Anexos" na ficha aberta pelo QR code, para o prestador baixar.
// Rodar: NODE_PATH=$(npm root -g) node tests/anexos.test.js
const { chromium } = require('playwright');const path=require('path'),fs=require('fs'),os=require('os');
const APP='file://'+path.resolve(__dirname,'../app.html');const FX=path.join(__dirname,'fixtures');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const DST=path.join(os.tmpdir(),'logo-peito.dst');fs.writeFileSync(DST,Buffer.from('LA:LOGO TESTE\r\n'+'x'.repeat(200)));
(async()=>{const b=await chromium.launch();const erros=[];const ctx=await b.newContext({viewport:{width:820,height:1100},acceptDownloads:true});const A=await ctx.newPage();A.on('pageerror',e=>erros.push(e.message));
  await ctx.addInitScript(()=>{window.claude={use:async()=>null}});await A.goto(APP);await A.waitForTimeout(1200);
  await A.evaluate(()=>{seed();state=normalizar(state);const u=state.usuarios[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.inicio=null;
    const p=state.produtos.find(x=>(x.tecidos||[]).length&&locaisPers(x).length);const cli=state.clientes[0];openSheet({t:'novo',w:{step:2,cliente:cli.nome,cli:cli.id,contato:'',cnpj:'',vend:state.pessoas[0].id,entrega:now()+20*DIA,err:'',itens:[]}});A.wAdd({p:p.id});
    const it=ui.sheet.w.itens[0];it.cor=Object.keys(state.cores)[0];it.tecido=p.tecidos[0];it.gen='M';it.g={M:5};it.pers=[{tipo:'bordado',parte:'Frente',pos:posDe('Frente')[0],tam:'8 cm'}];ui.blk={wpz0:true};render();A.wPzArq({k:'0',j:'0',t:'arqs'})});
  console.log('1) Vários anexos na criação');
  await A.setInputFiles('#fArq',[path.join(FX,'mockup-marinho.png'),DST]);await A.waitForTimeout(1200);
  let r=await A.evaluate(()=>{const x=ui.sheet.w.itens[0].pers[0];const ids=x.arqs||[];const tipos=ids.map(id=>arqById(id)?.tipo);const tela=document.querySelectorAll('.wpz .anx').length;
    const w=ui.sheet.w;w.step=4;render();A.wCriar();const ped=state.pedidos[state.pedidos.length-1];const l=lotesDe(ped.id)[0];return {n:ids.length,tipos,tela,lArqs:(l.pers[0].arqs||[]).length,pid:ped.id,lid:l.id}});
  ok(r.n===2&&r.tela===2,'dá para anexar vários arquivos na mesma personalização ('+r.n+')');
  ok(r.tipos.includes('arte')&&r.tipos.includes('bordado'),'imagem vira arte e o .dst vira programa do bordado');
  ok(r.lArqs===2,'os anexos vão para o pedido criado');
  console.log('2) Bloco Anexos no pedido');
  await A.evaluate(id=>{ui.sheet={t:'pedido',id};ui.blk={['anx'+id]:true};render();A.anxPedAdd({id})},r.pid);await A.setInputFiles('#fArq',[path.join(FX,'mockup-royal.png')]);await A.waitForTimeout(900);
  r={...r,...await A.evaluate(id=>{const ped=pedById(id);render();const bl=document.querySelector(`[data-blk="anx${id}"]`);const txt=bl?bl.innerText:'';return {pedAnx:(ped.anexos||[]).length,linhas:bl?bl.querySelectorAll('.anx').length:0,todos:/Baixar todos \(3\)/.test(txt),qr:/QR code/.test(txt)}},r.pid)};
  ok(r.pedAnx===1&&r.linhas===3&&r.todos,'o pedido mostra todos os anexos num lugar só (do pedido e de cada personalização) e Baixar todos');
  ok(r.qr,'avisa que quem lê o QR code também baixa');
  r={...r,...await A.evaluate(id=>{const ped=pedById(id),l=lotesDe(id)[0];const a=l.pers[0].arqs[0];A.anxRm({l:l.id,x:l.pers[0].id,id:a});const n=(l.pers[0].arqs||[]).length;A.anxAdd&&0;
    l.qr='abc123def4567890abcdef1234567890';save();return {tira:n===1,tok:l.qr}},r.pid)};
  ok(r.tira,'tirar um anexo da personalização');
  console.log('3) Ficha pelo QR code: botão Anexos');
  const Q=await ctx.newPage();Q.on('pageerror',e=>erros.push(e.message));await Q.goto(APP+'#f='+r.tok);await Q.waitForTimeout(1500);
  const q=await Q.evaluate(()=>{const bt=document.querySelector('[data-a=pubAnexos]');const lab=bt?bt.innerText:'';bt&&bt.click();return {lab,linhas:document.querySelectorAll('.pub-anx .anx').length,baixar:document.querySelectorAll('.pub-anx [data-a=arqBaixar]').length}});
  ok(/Anexos \(2\)/.test(q.lab),'a ficha do QR code tem o botão '+q.lab);
  ok(q.linhas===2&&q.baixar===2,'mostra os anexos da peça (personalização e pedido) com Baixar');
  const [dl]=await Promise.all([Q.waitForEvent('download',{timeout:20000}),Q.evaluate(()=>document.querySelector('.pub-anx [data-a=arqBaixar]').click())]);
  ok(!!dl&&!!dl.suggestedFilename(),'o prestador baixa o arquivo ('+(dl&&dl.suggestedFilename())+')');
  ok(!erros.length,'sem erros de JavaScript'+(erros.length?': '+erros.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} falha(s).`:'\nTudo certo.');process.exit(falhas?1:0)})();
