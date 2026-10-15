// Teste: o app no endereço próprio (Supabase) — login de verdade, regras de acesso, dados ao vivo entre aparelhos.
// Rodar: NODE_PATH=$(npm root -g) node tests/supabase.test.js
const { chromium } = require('playwright');const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..');let falhas=0;const ok=(c,m)=>{console.log((c?'  ✔ ':'  ✘ ')+m);if(!c)falhas++};
const docs=new Map(),users=new Map(),pages=[];const avisos=[];
const merge=(a,b)=>{if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){const o={...a};for(const k of Object.keys(b))o[k]=k in a?merge(a[k],b[k]):b[k];return o}return b};
const acesso=e=>!!e&&[...docs].some(([p,d])=>p.startsWith('usuarios/')&&String(d.email||'').toLowerCase()===String(e).toLowerCase());
async function avisa(p){for(const pg of pages)await pg.evaluate(p=>window.__sbPush&&window.__sbPush({new:{path:p}}),p).catch(()=>{})}
async function sbop(k,a,b){
  if(k==='q'){const st=JSON.parse(b),pode=acesso(a);
    if(st.op==='select'){if(!pode)return {data:st.single?null:[],error:null};let L=[...docs].filter(([p])=>st.f.every(([c,v])=>c==='col'?p.split('/')[0]===v:c==='path'?p===v:true)).sort((x,y)=>x[0]<y[0]?-1:1).map(([p,d])=>({path:p,data:JSON.parse(JSON.stringify(d))}));
      if(st.range)L=L.slice(st.range[0],st.range[1]+1);return {data:st.single?(L[0]||null):L,error:null}}
    if(!pode)return {data:null,error:{code:'42501',message:'new row violates row-level security policy'}};
    if(st.op==='upsert'){(Array.isArray(st.payload)?st.payload:[st.payload]).forEach(r=>docs.set(r.path,r.data));setTimeout(()=>avisa((Array.isArray(st.payload)?st.payload[0]:st.payload).path),10);return {data:null,error:null}}
    if(st.op==='delete'){const p=(st.f.find(f=>f[0]==='path')||[])[1];docs.delete(p);setTimeout(()=>avisa(p),10);return {data:null,error:null}}}
  if(k==='rpc'){const {args}=JSON.parse(b);if(!acesso(a))return {data:null,error:{code:'42501',message:'row-level security'}};if(!docs.has(args.p))return {data:false,error:null};docs.set(args.p,merge(docs.get(args.p),args.patch));setTimeout(()=>avisa(args.p),10);return {data:true,error:null}}
  if(k==='login'){const u=users.get(a);if(!u||u.pass!==b)return {error:{message:'Invalid login credentials'}};if(!u.ok)return {error:{message:'Email not confirmed'}};return {}}
  if(k==='signup'){if(users.get(a)?.ok)return {error:{message:'User already registered'}};users.set(a,{pass:b,ok:false});avisos.push('confirmar:'+a);return {}}
  if(k==='reset'){avisos.push('reset:'+a);return {}}
  if(k==='setpass'){const u=users.get(a)||{};users.set(a,{...u,pass:b,ok:true});return {data:{},error:null}}}
// dados: cópia dos dados reais, se existir; senão os exemplos são criados pelo próprio app num banco do Claude simulado
const REAL=process.env.REAL||path.resolve(__dirname,'../../claude-code-scratch-real2');
(async()=>{const b=await chromium.launch();const er=[];
  if(fs.existsSync(REAL))for(const col of fs.readdirSync(REAL))for(const f of fs.readdirSync(path.join(REAL,col)))docs.set(col+'/'+f.replace(/\.json$/,''),JSON.parse(fs.readFileSync(path.join(REAL,col,f),'utf8')));
  else{// gera uma base completa com os pedidos de exemplo do próprio app (banco do Claude simulado)
    const st=new Map(),list=c=>[...st].filter(([p])=>p.split('/')[0]===c&&p.split('/').length===2).map(([p,d])=>({id:p.split('/')[1],data:d}));
    const ctx=await b.newContext();await ctx.exposeFunction('__dbop',async(o,p,d)=>{if(o==='get')return {data:st.get(p)||null};if(o==='list')return list(p);if(o==='acquire')return {acquired:true};if(o==='set')st.set(p,JSON.parse(JSON.stringify(d)));if(o==='update'){if(!st.has(p))return {err:'invalid_argument'};st.set(p,merge(st.get(p),d))}if(o==='delete')st.delete(p);return {}});
    await ctx.addInitScript(fs.readFileSync(path.join(__dirname,'fakedb.js'),'utf8'));await ctx.addInitScript(()=>localStorage.setItem('martins-sessao',JSON.stringify({id:'u-helena',email:'helena@exemplo.test'})));const p0=await ctx.newPage();await p0.goto('file://'+path.join(R,'app.html'));await p0.waitForTimeout(1200);
    await p0.evaluate(()=>{ui.sheet=null;render()});await p0.click('[data-a=inicio][data-v=exemplo]');await p0.waitForTimeout(2500);await ctx.close();
    st.forEach((d,p)=>{if(!/^(trava|backup|backupp)\//.test(p))docs.set(p,d)})}
  const fake=fs.readFileSync(path.join(__dirname,'fakesupabase.js'),'utf8'),app=fs.readFileSync(path.join(R,'app.html'),'utf8');
  const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>window.MARTINS_SB={url:'https://teste.supabase.co',key:'anon'}</script></head><body>${app}</body></html>`;
  async function aparelho(n){const ctx=await b.newContext({viewport:{width:390,height:844}});await ctx.exposeFunction('__sbop',sbop);
    await ctx.route('https://app.martins.test/**',r=>r.fulfill({contentType:'text/html',body:html}));
    await ctx.route('https://cdn.jsdelivr.net/npm/@supabase/**',r=>r.fulfill({contentType:'application/javascript',body:fake}));
    const p=await ctx.newPage();p.on('pageerror',e=>er.push(n+': '+e.message));pages.push(p);await p.goto('https://app.martins.test/');await p.waitForTimeout(1500);return p}
  console.log('1) Abre em qualquer navegador, sem conta Claude');
  const A=await aparelho('A');ok(await A.$('#sbE')!==null&&/Entrar/.test(await A.textContent('.login h1')),'mostra a tela Entrar do app');
  console.log('2) Primeiro acesso da Helena');
  await A.click('[data-a=sbPasso][data-v=primeiro]');await A.fill('#sbE','helena@exemplo.test');await A.fill('#sbS1','martins1');await A.fill('#sbS2','martins1');await A.click('[data-a=sbCriar]');await A.waitForTimeout(500);
  ok(avisos.includes('confirmar:helena@exemplo.test')&&/Confira seu e-mail/.test(await A.textContent('.login')),'pede para confirmar pelo e-mail');
  await A.click('[data-a=sbPasso][data-v=entrar]');await A.fill('#sbE','helena@exemplo.test');await A.fill('#sbS','martins1');await A.click('[data-a=sbEntrar]');await A.waitForTimeout(500);
  ok(/confirmar o e-mail/.test(await A.textContent('.login')),'sem confirmar, avisa que falta confirmar');
  users.get('helena@exemplo.test').ok=true;await A.fill('#sbS','martins1');await A.click('[data-a=sbEntrar]');await A.waitForTimeout(2500);
  const nP=await A.evaluate(()=>state.pedidos.length);ok(await A.evaluate(()=>!!usuarioAtual()&&usuarioAtual().nome==='Helena'),'Helena entrou');ok(nP>0,`dados do Supabase carregados (${nP} pedidos)`);
  console.log('3) Senha errada e e-mail sem acesso');
  const B=await aparelho('B');await B.fill('#sbE','helena@exemplo.test');await B.fill('#sbS','errada');await B.click('[data-a=sbEntrar]');await B.waitForTimeout(400);
  ok(/E-mail ou senha errados/.test(await B.textContent('.login')),'senha errada: mensagem clara');
  users.set('estranho@x.com',{pass:'123456',ok:true});await B.fill('#sbE','estranho@x.com');await B.fill('#sbS','123456');await B.click('[data-a=sbEntrar]');await B.waitForTimeout(1500);
  ok(/ainda não tem acesso/.test(await B.textContent('#app')),'e-mail fora da lista não vê nada');
  const antes=docs.size;await B.evaluate(async()=>{try{await sbDB(SB.c).doc('pedidos/hack').set({x:1})}catch(e){}});ok(docs.size===antes&&!docs.has('pedidos/hack'),'e-mail fora da lista não consegue gravar');
  console.log('4) Roger entra e vê ao vivo o que a Helena faz');
  users.set('roger@exemplo.test',{pass:'roger12',ok:true});await B.click('[data-a=sbSair]');await B.waitForTimeout(1500);
  await B.fill('#sbE','roger@exemplo.test');await B.fill('#sbS','roger12');await B.click('[data-a=sbEntrar]');await B.waitForTimeout(2500);
  ok(await B.evaluate(()=>usuarioAtual()?.nome==='Roger'),'Roger entrou');
  const pid=await A.evaluate(()=>{const p=state.pedidos.find(x=>!x.concluido)||state.pedidos[0];snap();p.contato='Contato Novo Supabase';commit();return p.id});await A.waitForTimeout(1500);
  ok(docs.get('pedidos/'+pid)?.contato==='Contato Novo Supabase','mudança da Helena gravada no Supabase');
  ok(await B.evaluate(id=>pedById(id)?.contato==='Contato Novo Supabase',pid),'Roger vê a mudança sem recarregar');
  console.log('5) Esqueci a senha');
  const C=await aparelho('C');await C.click('[data-a=sbPasso][data-v=esqueci]');await C.fill('#sbE','roger@exemplo.test');await C.click('[data-a=sbEsqueci]');await C.waitForTimeout(400);
  ok(avisos.includes('reset:roger@exemplo.test')&&/Confira seu e-mail/.test(await C.textContent('.login')),'manda o link de senha nova');
  await C.evaluate(()=>window.__sbRecovery('roger@exemplo.test'));await C.waitForTimeout(300);await C.fill('#sbS1','novaSenha9');await C.fill('#sbS2','novaSenha9');await C.click('[data-a=sbNova]');await C.waitForTimeout(2500);
  ok(users.get('roger@exemplo.test').pass==='novaSenha9'&&await C.evaluate(()=>usuarioAtual()?.nome==='Roger'),'senha nova salva e já entra');
  console.log('6) Sair');
  await A.evaluate(()=>sair());await A.waitForTimeout(1500);ok(await A.$('#sbE')!==null,'sair volta para a tela Entrar');
  ok(!er.length,'sem erros de JavaScript'+(er.length?': '+er.join(' | '):''));
  await b.close();console.log(falhas?`\n${falhas} FALHA(S)`:'\nTudo certo.');process.exit(falhas?1:0)})();
