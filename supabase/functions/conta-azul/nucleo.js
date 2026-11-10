// Núcleo da busca de vendas do Conta Azul (função "conta-azul" do Supabase; migrações 013 a 015).
// Só LÊ o Conta Azul. Roda igual no Supabase (Deno) e nos testes (Node): recebe o fetch e o ambiente.
//
// Modos: 'rapida' (agendador, a cada 3 min no expediente, e o botão "Buscar vendas agora"): o que mudou desde a última;
//        'noite' (02:30): o que mudou no último dia + itens que faltam; 'completa' (à mão): tudo desde uma data.
// Token: o refresh_token do Conta Azul muda a cada renovação e o anterior morre. Por isso:
//   - uma busca por vez (trava no banco, ca_trava_pega/solta, que vence sozinha);
//   - o acesso (vale ~1 hora) é guardado e reaproveitado: o token só é renovado quando o acesso vence;
//   - o token novo é gravado ANTES de qualquer outra chamada.

const PRODUCAO = /^(aprovado|faturado)$/i;
export class Falha extends Error {}
const falha = (m) => { throw new Falha(m); };

export async function sincronizar({ modo = 'rapida', desde = null, env, f = fetch, agora = () => Date.now(), espera = (ms) => new Promise((ok) => setTimeout(ok, ms)) }) {
  const CA = String(env.CA_API || 'https://api-v2.contaazul.com').replace(/\/+$/, '');
  const SB = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const SBK = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const faltam = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((k) => !env[k]);
  if (faltam.length) falha(`faltam os segredos ${faltam.join(', ')} na função.`);
  const DIAS = Number(env.CA_DETALHE_DIAS || 90), MAX = Number(env.CA_DETALHE_MAX || (modo === 'rapida' ? 40 : 400));
  const sbCab = { apikey: SBK, ...(SBK.startsWith('eyJ') ? { Authorization: `Bearer ${SBK}` } : {}), 'Content-Type': 'application/json' };
  const sb = async (caminho, o = {}) => {
    const r = await f(SB + caminho, { ...o, headers: { ...sbCab, ...(o.headers || {}) } });
    if (!r.ok) falha(`Supabase ${o.method || 'GET'} ${caminho.split('?')[0]} respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`);
    return r;
  };
  const rpc = async (nome, args) => (await sb(`/rest/v1/rpc/${nome}`, { method: 'POST', body: JSON.stringify(args) })).json();

  // Códigos da aplicação do Conta Azul: segredos da função ou, se não houver, integracoes 'conta-azul-app'
  // (gravado pela rotina do GitHub a partir dos segredos de lá; só a chave de serviço lê).
  let cid = env.CA_CLIENT_ID, csec = env.CA_CLIENT_SECRET;
  if (!cid || !csec) {
    const [app] = await (await sb('/rest/v1/integracoes?nome=eq.conta-azul-app&select=segredo')).json();
    try { const j = JSON.parse(app?.segredo || '{}'); cid = cid || j.client_id; csec = csec || j.client_secret; } catch { /* inválido */ }
    if (!cid || !csec) falha('faltam os códigos da aplicação do Conta Azul (CA_CLIENT_ID e CA_CLIENT_SECRET).');
  }
  const dono = `${modo}-${agora()}-${Math.random().toString(36).slice(2, 8)}`;
  if (!(await rpc('ca_trava_pega', { dono, segundos: 140 }))) return { ocupado: true };
  try {
    const [integ] = await (await sb('/rest/v1/integracoes?nome=eq.conta-azul&select=segredo,info')).json();
    if (!integ) falha('o Conta Azul ainda não foi conectado.');
    let info = { ...(integ.info || {}) };
    const guardaInfo = async (extra) => { info = { ...info, ...extra }; await sb('/rest/v1/integracoes?nome=eq.conta-azul', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ info, atualizado: new Date(agora()).toISOString() }) }); };

    // acesso: reaproveita enquanto vale (com 2 min de folga); senão renova e grava o token novo na hora
    let acesso = info.acesso && Date.parse(info.acesso_ate || 0) > agora() + 120e3 ? info.acesso : null;
    if (!acesso) {
      const r = await f(`${CA}/oauth/token`, { method: 'POST', headers: { Authorization: 'Basic ' + btoa(`${cid}:${csec}`), 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: integ.segredo }) });
      const txt = await r.text(); let j = {}; try { j = JSON.parse(txt); } catch { /* não-JSON */ }
      if (!r.ok || !j.access_token || !j.refresh_token) {
        const revogado = ['access_revoked', 'invalid_refresh_token'].includes(j.error_subtype);
        falha(`o Conta Azul recusou o token: ${r.status} ${j.error || txt.slice(0, 200)}${j.error_subtype ? ` (${j.error_subtype})` : ''}.${revogado ? ' Precisa conectar o Conta Azul de novo.' : ''}`);
      }
      acesso = j.access_token;
      const ate = new Date(agora() + (Number(j.expires_in) || 3600) * 1000).toISOString();
      info = { ...info, acesso, acesso_ate: ate };
      await sb('/rest/v1/integracoes?nome=eq.conta-azul', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ segredo: j.refresh_token, info, atualizado: new Date(agora()).toISOString() }) });
    }
    const ca = async (caminho) => {
      for (let t = 1; ; t++) {
        const r = await f(CA + caminho, { headers: { Authorization: `Bearer ${acesso}` } });
        if (r.ok) return r.json();
        if ((r.status === 429 || r.status >= 500) && t < 4) { await espera(Math.min(10, Number(r.headers.get('retry-after')) || t * 1.5) * 1000); continue; }
        if (r.status === 401) await guardaInfo({ acesso: null, acesso_ate: null });
        falha(`Conta Azul GET ${caminho.split('?')[0]} respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`);
      }
    };

    // horário de Brasília, como o Conta Azul pede; o par de/até é obrigatório
    const hb = (ms) => encodeURIComponent(new Date(ms - 3 * 36e5).toISOString().slice(0, 19));
    const ultima = info.ultima_sincronizacao ? Date.parse(info.ultima_sincronizacao) : null;
    if (modo !== 'completa' && !ultima) falha('falta a primeira carga completa.');
    const folga = modo === 'noite' ? 864e5 : 10 * 6e4;
    const filtro = modo === 'completa'
      ? `data_inicio=${desde || '2022-01-01'}&data_fim=2099-12-31`
      : `data_alteracao_de=${hb(ultima - folga)}&data_alteracao_ate=${hb(agora() + 36e5)}`;
    const inicio = new Date(agora()).toISOString();
    const dataMin = new Date(agora() - DIAS * 864e5).toISOString().slice(0, 10);
    let total = 0, esperado = null; const mudaram = [];
    for (let pagina = 1; ; pagina++) {
      const j = await ca(`/v1/venda/busca?${filtro}&pagina=${pagina}&tamanho_pagina=200&campo_ordenado_ascendente=DATA`);
      if (esperado === null) esperado = j.total_itens ?? null;
      const L = Array.isArray(j.itens) ? j.itens : [];
      if (L.length) await sb('/rest/v1/ca_vendas', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(L.map(linha)) });
      total += L.length;
      L.filter((v) => PRODUCAO.test(v.situacao?.nome || '') && String(v.data || '') >= dataMin).forEach((v) => mudaram.push(v.id));
      if (L.length < 200) break;
    }
    if (esperado !== null && total < esperado) falha(`vieram ${total} vendas, o Conta Azul disse ${esperado}. Nada foi marcado como sincronizado.`);
    await guardaInfo({ ultima_sincronizacao: inicio, ultimas_vendas: total });

    // itens e vendedor (sem o custo): as que mudaram agora e as que ainda estão sem itens
    const semItens = await (await sb(`/rest/v1/ca_vendas?select=id&itens=is.null&situacao=in.(APROVADO,FATURADO)&data=gte.${dataMin}&limit=${MAX}`)).json();
    const ids = [...new Set([...mudaram, ...semItens.map((x) => x.id)])].slice(0, MAX);
    let ok = 0; const erros = [];
    for (const id of ids) {
      try {
        const d = await ca(`/v1/venda/${id}`); const v = d.venda || {}; const itens = [];
        for (let pagina = 1; ; pagina++) {
          const j = await ca(`/v1/venda/${id}/itens?pagina=${pagina}&tamanho_pagina=100`);
          const L = Array.isArray(j.itens) ? j.itens : [];
          itens.push(...L.map((x) => ({ id_item: x.id_item ?? null, nome: x.nome ?? '', descricao: x.descricao ?? '', tipo: x.tipo ?? null, quantidade: x.quantidade ?? null, valor: x.valor ?? null })));
          if (L.length < 100) break;
        }
        const detalhe = { cliente: { nome: d.cliente?.nome ?? null, documento: d.cliente?.documento ?? null }, observacoes: v.observacoes ?? null, composicao_valor: v.composicao_valor ?? null,
          parcelas: (v.condicao_pagamento?.parcelas || []).map((p) => ({ numero: p.numero ?? null, data_vencimento: p.data_vencimento ?? null, valor: p.valor ?? null, descricao: p.descricao ?? null })),
          data_compromisso: v.data_compromisso ?? null, versao: v.versao ?? null };
        await sb(`/rest/v1/ca_vendas?id=eq.${id}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ vendedor: d.vendedor?.nome ?? null, itens, detalhe, detalhe_em: new Date(agora()).toISOString() }) });
        ok++;
      } catch (e) { erros.push(`${id}: ${e instanceof Falha ? e.message : e}`); }
    }
    // aviso pequeno para os aparelhos abertos atualizarem a lista (o app escuta docs_sinal; não baixa coleções)
    if (ok || mudaram.length) await sb('/rest/v1/docs_sinal', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify([{ path: 'cavsinal/vendas', col: 'cavsinal', upd: new Date(agora()).toISOString(), del: false }]) });
    return { vendas: total, detalhes: ok, erros };
  } finally {
    await rpc('ca_trava_solta', { dono }).catch(() => {});
  }
}

export const linha = (v) => ({
  id: v.id, numero: v.numero ?? null, data: v.data ?? null, criado_em: v.criado_em ?? null, alterado_em: v.data_alteracao ?? null,
  cliente_id: v.cliente?.id ?? null, cliente_nome: v.cliente?.nome ?? null, situacao: v.situacao?.nome ?? null, tipo: v.tipo ?? null, origem: v.origem ?? null,
  total: typeof v.total === 'number' ? v.total : null, dados: v, sincronizado: new Date().toISOString(),
});
