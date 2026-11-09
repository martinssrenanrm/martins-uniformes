-- Conferência histórico × peças (frente "toques que somem", 09/11/2026).
-- Só lê. Rode no SQL Editor do Supabase ou pelo conector (execute_sql).
-- Para cada etapa, pega o último "feita" (etapa.concluida) ou "voltou do prestador" (remessa.retornada) do histórico
-- (sem os toques desfeitos) e confere se a peça (docs › lotes) está como feita.
-- Resultado esperado: nenhuma linha com toques depois da correção. Troque a data em "desde" para olhar só os toques novos.
with params as (select timestamptz '2026-11-03 00:00-03' as desde),
desf as (select jsonb_array_elements_text(dados->'ids')::uuid id from eventos where tipo = 'acao.desfeita'),
e as (
  select * from eventos, params
  where ts >= params.desde and lote is not null and ref is not null
    and tipo in ('etapa.concluida', 'remessa.retornada', 'etapa.iniciada', 'etapa.revertida', 'etapa.inicio_cancelado', 'remessa.enviada')
    and id not in (select id from desf)
),
ult as (select distinct on (lote, ref) * from e order by lote, ref, ts desc)
select u.ped as pedido, u.lote as peca, u.ref as etapa, u.dados->>'proc' as processo, u.tipo,
       to_char(u.ts at time zone 'America/Sao_Paulo', 'DD/MM HH24:MI') as quando, u.dv as aparelho,
       d.data->'steps'->u.ref as como_esta_na_peca
from ult u left join docs d on d.path = 'lotes/' || u.lote
where u.tipo in ('etapa.concluida', 'remessa.retornada')
  and coalesce(d.data->'steps'->u.ref->>'st', '') <> 'ok'
order by u.ts;
