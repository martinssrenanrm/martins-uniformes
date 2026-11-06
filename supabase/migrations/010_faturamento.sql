-- 010: faturamento para o Painel › Resultados (só gestão). Lê public.ca_vendas (migração 009); não grava nada.
-- Regra: faturamento = vendas com situação APROVADO ou FATURADO, pela data da venda (coluna data).
-- Orçamento, cancelado, recusado e em andamento ficam de fora.
-- Devolve: total e quantidade do período; média mensal dos 12 meses fechados antes do mês de "de";
-- os últimos 13 meses até o mês de "ate" (meses sem venda vêm com zero); os 5 maiores clientes do período;
-- e quando os dados do Conta Azul foram atualizados. Sem venda nenhuma na tabela, devolve {"vazio": true}.
-- Pode rodar de novo sem problema.

create or replace function public.faturamento(de date, ate date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb; m0 date := date_trunc('month', de)::date; m1 date := date_trunc('month', ate)::date;
begin
  if not public.eh_gestao() then return null; end if;
  if not exists (select 1 from public.ca_vendas where situacao in ('APROVADO', 'FATURADO')) then
    return jsonb_build_object('vazio', true);
  end if;
  with v as (select data, total, coalesce(nullif(cliente_id, ''), cliente_nome) cli, cliente_nome
             from public.ca_vendas where situacao in ('APROVADO', 'FATURADO') and data is not null)
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
    'atualizado', (select max(sincronizado) from public.ca_vendas)
  ) into r;
  return r;
end $$;
revoke execute on function public.faturamento(date, date) from public, anon;
grant execute on function public.faturamento(date, date) to authenticated;
