-- 007: registro de eventos e métricas (01/11/2026).
-- Estado (tabela docs) diz COMO ESTÁ agora. Eventos dizem O QUE ACONTECEU, quem fez, onde e quando.
-- As métricas saem dos eventos, calculadas aqui no banco: o painel recebe só os números, nunca os eventos.
-- Eventos não voltam para os aparelhos (não pesam no tráfego) e nunca são alterados: só se acrescenta.
-- Desfazer não apaga: gera 'acao.desfeita' apontando o toque (acao) que perdeu o valor.
-- Catálogo dos tipos: EV_TIPOS no app.html. Pode rodar de novo sem problema.

create table if not exists public.eventos (
  id      uuid primary key,                    -- criado no aparelho (reenvio não duplica)
  ts      timestamptz not null,                -- quando o fato aconteceu (registro feito depois: a hora informada)
  reg     timestamptz,                         -- quando foi registrado no aparelho
  rec     timestamptz not null default now(),  -- quando chegou ao banco
  acao    uuid,                                -- o toque que gerou o evento (um desfazer anula todos os eventos do toque)
  tipo    text not null,                       -- 'entidade.acao', ex.: 'etapa.concluida'
  usuario text,                                -- quem estava com o app (usuarios/<id>)
  pessoa  text,                                -- de quem é o trabalho (pessoas/<id>)
  dv      text,                                -- aparelho
  tela    text,                                -- onde a ação foi feita
  ped     text,                                -- pedido
  lote    text,                                -- peça do pedido
  ref     text,                                -- outro alvo: etapa, material, arquivo, ação desfeita…
  de      text,                                -- situação antes
  para    text,                                -- situação depois
  q       numeric,                             -- quantidade (peças, metros…)
  dur     integer,                             -- duração em segundos (trabalho feito, sem pausas)
  retro   boolean not null default false,      -- marcado depois do fato
  dados   jsonb,                               -- fotografia do momento (etapa, tempo padrão, máquina, motivo…)
  v       smallint not null default 1,         -- versão do formato
  app     text                                 -- versão do app que gerou
);
alter table public.eventos add column if not exists reg timestamptz;
alter table public.eventos add column if not exists acao uuid;
create index if not exists eventos_ts_idx on public.eventos (ts);
create index if not exists eventos_tipo_ts_idx on public.eventos (tipo, ts);
create index if not exists eventos_ped_idx on public.eventos (ped) where ped is not null;
create index if not exists eventos_desfeita_idx on public.eventos (ref) where tipo = 'acao.desfeita';

alter table public.eventos enable row level security;
drop policy if exists eventos_gravar on public.eventos;
drop policy if exists eventos_ler on public.eventos;
create policy eventos_gravar on public.eventos for insert to authenticated with check (public.tem_acesso());
-- Ler: só a gestão (tem dados de produção por pessoa).
create policy eventos_ler on public.eventos for select to authenticated using (public.eh_gestao());
revoke all on public.eventos from anon;
revoke update, delete, truncate on public.eventos from authenticated;
grant select, insert on public.eventos to authenticated;

-- Uso das telas: só contagem por dia (barato), para saber o que é usado e onde a equipe se perde.
create table if not exists public.uso (
  dia     date not null,
  usuario text not null,
  dv      text not null,
  tela    text not null,
  n       integer not null default 0,
  primary key (dia, usuario, dv, tela)
);
alter table public.uso enable row level security;
drop policy if exists uso_ler on public.uso;
create policy uso_ler on public.uso for select to authenticated using (public.eh_gestao());
revoke all on public.uso from anon;
revoke insert, update, delete, truncate on public.uso from authenticated;
grant select on public.uso to authenticated;

create or replace function public.uso_conta(itens jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.tem_acesso() then return; end if;
  insert into public.uso (dia, usuario, dv, tela, n)
  select dia, usuario, dv, tela, sum(n) from (
    select (x->>'dia')::date dia, left(x->>'usuario', 60) usuario, left(coalesce(x->>'dv', '?'), 20) dv, left(x->>'tela', 60) tela,
           greatest(0, least(100000, coalesce((x->>'n')::int, 0))) n
    from jsonb_array_elements(itens) x
    where x->>'dia' is not null and x->>'usuario' is not null and x->>'tela' is not null) t
  group by dia, usuario, dv, tela
  on conflict (dia, usuario, dv, tela) do update set n = public.uso.n + excluded.n;
end $$;
revoke execute on function public.uso_conta(jsonb) from public, anon;
grant execute on function public.uso_conta(jsonb) to authenticated;

-- Fuso da fábrica (config/main.fuso): os dias das métricas são os dias da fábrica, não os de Londres.
create or replace function public.fuso() returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif((select data->>'fuso' from public.docs where path = 'config/main'), ''), 'America/Sao_Paulo');
$$;
revoke execute on function public.fuso() from public, anon;
grant execute on function public.fuso() to authenticated;

-- ===== Métricas (views com as regras de acesso de quem consulta) =====
-- Eventos que valem: tira os desfeitos (pelo toque e, para o formato antigo, pela lista de ids).
create or replace view public.ev_validos with (security_invoker = true) as
  select e.*, (e.ts at time zone public.fuso())::date dia from public.eventos e
  where e.tipo <> 'acao.desfeita'
    and not exists (select 1 from public.eventos d where d.tipo = 'acao.desfeita'
                    and ((e.acao is not null and d.ref = e.acao::text) or d.dados->'ids' ? e.id::text));

-- Tempo de cada processo feito: a última conclusão de cada etapa (ou parte), se ela não voltou para "ainda não feita" depois.
create or replace view public.m_etapas with (security_invoker = true) as
  with c as (
    select distinct on (lote, ref, coalesce(dados->>'parte', '')) *
    from public.ev_validos where tipo = 'etapa.concluida'
    order by lote, ref, coalesce(dados->>'parte', ''), ts desc)
  select c.ts, c.dia, c.ped, c.lote, c.ref etapa, c.dados->>'proc' processo, c.dados->>'posto' posto, c.dados->>'fase' fase,
         c.dados->>'maq' maquina, c.pessoa, c.usuario, c.q pecas, c.dur segundos, c.retro, c.reg,
         (c.dados->>'padrao')::numeric seg_padrao_peca, (c.dados->>'rework') is not null conserto, (c.dados->>'escritorio') is not null escritorio
  from c
  where not exists (select 1 from public.ev_validos r where r.tipo = 'etapa.revertida' and r.lote = c.lote and r.ref = c.ref and r.ts > c.ts);

-- Pedido: da entrada à entrega; prazo prometido (o primeiro) e o final (depois das mudanças).
create or replace view public.m_pedidos with (security_invoker = true) as
  with c as (select distinct on (ped) ped, ts criado, (dados->>'chegada')::timestamptz chegada, (dados->>'entrega')::timestamptz prazo_inicial,
                    q pecas, dados->>'fonte' fonte, pessoa vendedor
             from public.ev_validos where tipo = 'pedido.criado' order by ped, ts),
       p as (select distinct on (ped) ped, (para)::timestamptz prazo_final from public.ev_validos where tipo = 'pedido.prazo_alterado' and para is not null order by ped, ts desc),
       e as (select distinct on (ped) ped, tipo, ts from public.ev_validos where tipo in ('pedido.entregue', 'pedido.entrega_desfeita') order by ped, ts desc),
       x as (select distinct on (ped) ped, tipo, ts from public.ev_validos where tipo in ('pedido.cancelado', 'pedido.reativado') order by ped, ts desc)
  select c.ped, c.criado, c.chegada, c.pecas, c.fonte, c.vendedor, c.prazo_inicial, coalesce(p.prazo_final, c.prazo_inicial) prazo_final,
         case when e.tipo = 'pedido.entregue' then e.ts end entregue,
         case when x.tipo = 'pedido.cancelado' then x.ts end cancelado,
         round(extract(epoch from ((case when e.tipo = 'pedido.entregue' then e.ts end) - coalesce(c.chegada, c.criado))) / 86400.0, 1) dias_ate_entregar,
         case when e.tipo is distinct from 'pedido.entregue' then null
              else e.ts <= coalesce(p.prazo_final, c.prazo_inicial) + interval '12 hours' end no_prazo,
         case when e.tipo is distinct from 'pedido.entregue' or c.prazo_inicial is null then null
              else e.ts <= c.prazo_inicial + interval '12 hours' end no_prazo_inicial
  from c left join p using (ped) left join e using (ped) left join x using (ped);

-- Compras: por pedido e item, quando faltou, quando comprou e quando saiu do estoque.
create or replace view public.m_compras with (security_invoker = true) as
  select ped, ref item, min(ts) filter (where tipo = 'material.em_falta') falta, min(ts) filter (where tipo = 'material.comprado') comprado,
         min(ts) filter (where tipo = 'material.do_estoque') do_estoque, max(dados->>'cat') categoria,
         round(extract(epoch from (min(ts) filter (where tipo = 'material.comprado') - min(ts) filter (where tipo = 'material.em_falta'))) / 3600.0, 1) horas_ate_comprar
  from public.ev_validos where tipo in ('material.em_falta', 'material.comprado', 'material.do_estoque')
  group by ped, ref;

-- Retrabalho: peças que voltaram para conserto, com quem fez a etapa de origem.
create or replace view public.m_retrabalho with (security_invoker = true) as
  select ts, dia, ped, lote, ref etapa_origem, dados->>'proc_origem' processo_origem, dados->>'motivo' motivo,
         dados->>'pessoa_origem' pessoa_origem, pessoa quem_achou, q pecas
  from public.ev_validos where tipo = 'conserto.aberto';

-- Adesão: quanto do trabalho é registrado na hora (e não depois), por pessoa e dia.
create or replace view public.m_adesao with (security_invoker = true) as
  select dia, pessoa, count(*) etapas,
         count(*) filter (where retro) depois,
         count(*) filter (where not retro and segundos between 60 and 43200 and (reg is null or reg - ts < interval '15 minutes')) na_hora,
         round(100.0 * count(*) filter (where not retro and segundos between 60 and 43200 and (reg is null or reg - ts < interval '15 minutes')) / nullif(count(*), 0)) pct_na_hora
  from public.m_etapas where not escritorio and pessoa is not null group by dia, pessoa;

-- Onde a equipe se perde: desfazer por tela e por tipo de ação desfeita.
create or replace view public.m_desfazer with (security_invoker = true) as
  select (d.ts at time zone public.fuso())::date dia, d.tela, o.tipo acao_desfeita, count(distinct d.id) n
  from public.eventos d join public.eventos o on o.acao is not null and o.acao::text = d.ref and o.tipo <> 'acao.desfeita'
  where d.tipo = 'acao.desfeita' group by 1, 2, 3;

-- Resumo para o painel (só gestão): números de um período, sem baixar eventos.
create or replace function public.metricas(de date, ate date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb; fz text := public.fuso();
begin
  if not public.eh_gestao() then return null; end if;
  select jsonb_build_object(
    'periodo', jsonb_build_object('de', de, 'ate', ate, 'fuso', fz),
    'pedidos', (select jsonb_build_object(
        'criados', count(*) filter (where (criado at time zone fz)::date between de and ate),
        'entregues', count(*) filter (where (entregue at time zone fz)::date between de and ate),
        'no_prazo_pct', round(100.0 * count(*) filter (where no_prazo and (entregue at time zone fz)::date between de and ate)
                              / nullif(count(*) filter (where no_prazo is not null and (entregue at time zone fz)::date between de and ate), 0)),
        'no_prazo_inicial_pct', round(100.0 * count(*) filter (where no_prazo_inicial and (entregue at time zone fz)::date between de and ate)
                              / nullif(count(*) filter (where no_prazo_inicial is not null and (entregue at time zone fz)::date between de and ate), 0)),
        'dias_medio', round(avg(dias_ate_entregar) filter (where (entregue at time zone fz)::date between de and ate), 1),
        'cancelados', count(*) filter (where (cancelado at time zone fz)::date between de and ate))
      from public.m_pedidos),
    'etapas', (select jsonb_build_object('feitas', count(*), 'pecas', coalesce(sum(pecas), 0), 'horas', round(coalesce(sum(segundos), 0) / 3600.0, 1),
                                         'pct_depois', round(100.0 * count(*) filter (where retro) / nullif(count(*), 0)))
               from public.m_etapas where dia between de and ate and not escritorio),
    'processos', (select coalesce(jsonb_agg(p order by (p->>'horas')::numeric desc), '[]'::jsonb) from (
        select jsonb_build_object('processo', processo, 'feitas', count(*), 'pecas', sum(pecas), 'horas', round(sum(segundos) / 3600.0, 1),
                                  'seg_por_peca', round(sum(segundos) / nullif(sum(pecas), 0)), 'seg_padrao', round(avg(seg_padrao_peca))) p
        from public.m_etapas where dia between de and ate and not retro and not escritorio and not conserto group by processo) t),
    'retrabalho', (select jsonb_build_object('pecas', coalesce(sum(pecas), 0),
                     'motivos', coalesce((select jsonb_object_agg(motivo, n) from (select motivo, sum(pecas) n from public.m_retrabalho where dia between de and ate and motivo is not null group by motivo) m), '{}'::jsonb))
                   from public.m_retrabalho where dia between de and ate),
    'compras', (select jsonb_build_object('itens_em_falta', count(*) filter (where falta is not null), 'horas_medio_ate_comprar', round(avg(horas_ate_comprar), 1))
                from public.m_compras where (coalesce(falta, comprado, do_estoque) at time zone fz)::date between de and ate),
    'adesao', (select jsonb_build_object('pct_na_hora', round(100.0 * sum(na_hora) / nullif(sum(etapas), 0)), 'pct_depois', round(100.0 * sum(depois) / nullif(sum(etapas), 0)))
               from public.m_adesao where dia between de and ate),
    'desfazer', (select coalesce(jsonb_agg(jsonb_build_object('tela', tela, 'acao', acao_desfeita, 'n', n) order by n desc), '[]'::jsonb)
                 from (select tela, acao_desfeita, sum(n) n from public.m_desfazer where dia between de and ate group by 1, 2 order by 3 desc limit 10) t),
    'uso', (select coalesce(jsonb_agg(jsonb_build_object('tela', tela, 'n', n) order by n desc), '[]'::jsonb)
            from (select tela, sum(n) n from public.uso where dia between de and ate group by tela order by 2 desc limit 15) t)
  ) into r;
  return r;
end $$;
revoke execute on function public.metricas(date, date) from public, anon;
grant execute on function public.metricas(date, date) to authenticated;
