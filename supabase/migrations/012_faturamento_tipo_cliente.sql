-- 012: faturamento por tipo de cliente (08/11/2026). Só gestão. Lê ca_vendas (009) e o tipo marcado no app; não grava nada.
-- O tipo é do cliente do Conta Azul, guardado pelo app em docs › catcli/<id do cliente> = {"id":..., "nome":..., "tipo":"..."}.
-- A lista de tipos é da fábrica (config/main › tiposCli); um tipo que saiu da lista conta como "sem tipo".
-- Igual à 010, mais:
--   'tipos'       = a lista de tipos da fábrica (vazia = a fábrica não usa);
--   'por_cliente' = TODOS os clientes do período (não só os 5 maiores), com o tipo (null = sem tipo).
-- A soma de 'por_cliente' é sempre igual a 'total' (mesmas vendas, mesmo período).
-- Pode rodar de novo sem problema.

create or replace function public.faturamento(de date, ate date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb; m0 date := date_trunc('month', de)::date; m1 date := date_trunc('month', ate)::date; tl jsonb;
begin
  if not public.eh_gestao() then return null; end if;
  if not exists (select 1 from public.ca_vendas where situacao in ('APROVADO', 'FATURADO')) then
    return jsonb_build_object('vazio', true);
  end if;
  select case when jsonb_typeof(data->'tiposCli') = 'array' then data->'tiposCli' else '[]'::jsonb end into tl
    from public.docs where path = 'config/main';
  tl := coalesce(tl, '[]'::jsonb);
  with v as (select data, total, coalesce(nullif(cliente_id, ''), cliente_nome) cli, cliente_nome
             from public.ca_vendas where situacao in ('APROVADO', 'FATURADO') and data is not null),
  tp as (select data->>'id' cli, data->>'tipo' tipo from public.docs
         where col = 'catcli' and tl ? (data->>'tipo'))
  select jsonb_build_object(
    'periodo', jsonb_build_object('de', de, 'ate', ate),
    'total', (select coalesce(sum(total), 0) from v where data between de and ate),
    'vendas', (select count(*) from v where data between de and ate),
    'media_mensal', (select round(coalesce(sum(total), 0) / 12.0, 2) from v
                     where data >= (m0 - interval '12 months')::date and data < m0),
    'meses', (select jsonb_agg(jsonb_build_object('mes', to_char(g.m, 'YYYY-MM'),
                       'total', coalesce((select sum(total) from v where date_trunc('month', v.data) = g.m), 0),
                       'vendas', (select count(*) from v where date_trunc('month', v.data) = g.m)) order by g.m)
              from generate_series((m1 - interval '12 months')::date, m1, interval '1 month') g(m)),
    'clientes', (select coalesce(jsonb_agg(jsonb_build_object('nome', nome, 'total', tot, 'vendas', n) order by tot desc), '[]'::jsonb)
                 from (select max(cliente_nome) nome, sum(total) tot, count(*) n from v
                       where data between de and ate group by cli order by 2 desc limit 5) c),
    'tipos', tl,
    'por_cliente', (select coalesce(jsonb_agg(jsonb_build_object('id', c.cli, 'nome', c.nome, 'total', c.tot, 'vendas', c.n,
                                    'tipo', (select tp.tipo from tp where tp.cli = c.cli limit 1)) order by c.tot desc), '[]'::jsonb)
                    from (select cli, max(cliente_nome) nome, sum(total) tot, count(*) n from v
                          where data between de and ate group by cli) c),
    'atualizado', (select max(sincronizado) from public.ca_vendas)
  ) into r;
  return r;
end $$;
revoke execute on function public.faturamento(date, date) from public, anon;
grant execute on function public.faturamento(date, date) to authenticated;
