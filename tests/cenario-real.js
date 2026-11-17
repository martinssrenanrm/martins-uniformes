// Cenário de teste parecido com a produção (só dados de demonstração, nunca dados reais):
// ~90 pedidos com mockup, datas variadas (atrasados, perto, futuros, entregues), checklists parciais e completos,
// responsáveis, comentários, anexos e colunas cheias. Uso: await page.evaluate(CENARIO, {mock:dataURL, notas:true})
// O app precisa estar aberto; a função chama seed() e normalizar().
module.exports = function CENARIO(o){o=o||{};seed();state=normalizar(state);
  const T=now(),base=state.pedidos.slice(),L0=state.lotes.slice();let k=0;
  while(state.pedidos.length<(o.n||90)){const p=base[k%base.length],id=String(6100+k);k++;
    const np=JSON.parse(JSON.stringify(p));Object.assign(np,{id,ficha:String(6200+k),cliente:p.cliente+' '+k,concluido:null,cancelado:null});
    const r=k%9;np.entrega=r<3?T-(r+1)*3*864e5:r<5?T+(r-2)*864e5:T+(5+r*3)*864e5;np.chegada=np.entrega-25*864e5;
    if(r===8)np.concluido=T-864e5;state.pedidos.push(np);
    L0.filter(l=>l.ped===p.id&&!l.rework).forEach((l,i)=>{const nl=JSON.parse(JSON.stringify(l));Object.assign(nl,{id:id+'-'+(i+1),ped:id,parent:null,rework:false});if(o.mock)nl.mock=o.mock;
      if(k%4===0)nl.steps={};state.lotes.push(nl)})}
  const U=state.usuarios;state.pedidos.forEach((p,i)=>{if(o.mock)lotesDe(p.id).forEach(l=>{if(!l.mock)l.mock=o.mock});
    if(i%3===0){qdCkGarante(p);const I=p.ck.flatMap(g=>g.itens);I.slice(0,i%2?I.length:Math.ceil(I.length/3)).forEach(x=>{x.ok=true;x.por=U[i%U.length].nome;x.u=U[i%U.length].id;x.em=T-i*36e5})}
    if(i%4===0)p.resp=[U[i%U.length].id];if(i%5===0)p.etq=['urgente'];if(i%7===0)p.evento=true;
    if(i%6===0)p.coment=[{id:'c'+i,t:'Cliente confirmou as cores',ts:T-i*6e5,por:U[0].nome,u:U[0].id,m:[]}]});
  state.notas=o.notas?[{id:'n1',t:'Escola Arco-Íris: 80 camisetas',ts:T-7e6,por:U[0].nome},{id:'n2',t:'Academia: orçamento regatas',ts:T-9e6,por:U[0].nome}]:[];
  const u=U[0];SESSAO={id:u.id,email:u.email};NV.pronto=true;ui.sheet=null;ui.tela='pedidos';return state.pedidos.length};
