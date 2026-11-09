-- 013: venda do Conta Azul vira pedido "a completar" (09/11/2026). Só leitura do Conta Azul.
-- 1) ca_vendas ganha o que só vem no detalhe de cada venda (a cópia noturna preenche, só para as
--    aprovadas/faturadas recentes): quem vendeu, os itens (sem o custo) e um resumo (CNPJ, observações,
--    valores e parcelas).
-- 2) vendas_para_pedido(desde): a lista que o escritório usa para criar o pedido. ca_vendas continua
--    só da gestão (009); esta função devolve só as vendas aprovadas/faturadas desde a data, para quem
--    é da gestão ou do escritório. O chão de fábrica não vê. Quem já tem pedido é o app que separa
--    (pelo "Nº do pedido no Conta Azul" do pedido).
-- Pode rodar de novo sem problema.

alter table public.ca_vendas add column if not exists vendedor   text;
alter table public.ca_vendas add column if not exists itens      jsonb;
alter table public.ca_vendas add column if not exists detalhe    jsonb;
alter table public.ca_vendas add column if not exists detalhe_em timestamptz;

create or replace function public.vendas_para_pedido(desde date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not exists (
    select 1 from public.docs
    where col = 'usuarios' and data->>'perfil' in ('gestao', 'escritorio')
      and lower(data->>'email') = lower(coalesce(auth.jwt()->>'email', ''))
  ) then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'numero', numero, 'data', data, 'situacao', situacao, 'total', total,
      'cliente_id', cliente_id, 'cliente', cliente_nome, 'vendedor', vendedor,
      'itens', itens, 'detalhe', detalhe) order by data, numero), '[]'::jsonb)
    into r
    from public.ca_vendas
   where situacao in ('APROVADO', 'FATURADO') and data >= desde;
  return r;
end $$;
revoke execute on function public.vendas_para_pedido(date) from public, anon;
grant execute on function public.vendas_para_pedido(date) to authenticated;
