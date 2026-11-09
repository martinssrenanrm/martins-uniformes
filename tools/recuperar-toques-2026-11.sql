-- Recuperação dos 28 toques perdidos em 05 e 06/11/2026 (frente "toques que somem").
-- NÃO RODAR sem o ok do Renan sobre a lista final. Roda uma vez; rodar de novo não muda nada (só grava etapa que ainda não está feita).
-- Não mexe no histórico (eventos): ele já tem esses toques. Só devolve às peças o que o histórico diz.
-- Antes de mudar, guarda uma cópia de cada peça em lixeira/ (dá para restaurar em Cadastros › Ajustes › Cópias de segurança).
-- Cada etapa recebe exatamente o que o app teria gravado no toque (mesma hora, mesma pessoa).
begin;

create temp table rec(lote text, ref text, passo jsonb) on commit drop;
insert into rec values
-- Pedido 6232: "Chegou" do Márcio, marcados pela Helena em 05/11
  ('6232-3','pz1','{"op":"roger","st":"ok","fim":1793888940042,"forn":"fb","saiu":1793206057807}'),
  ('6232-4','pz1','{"op":"roger","st":"ok","fim":1793888952657,"forn":"fb","saiu":1793888952657,"semLevei":true}'),
  ('6232-5','pz0','{"op":"roger","st":"ok","fim":1793888956103,"forn":"fb","saiu":1793888956103,"semLevei":true}'),
  ('6232-6','pz0','{"op":"roger","st":"ok","fim":1793888979068,"forn":"fb","saiu":1793888979068,"semLevei":true}'),
  ('6232-9','pz0','{"op":"roger","st":"ok","fim":1793889056385,"forn":"fb","saiu":1793889056385,"semLevei":true}'),
-- Pedido 6260: DTF manga direita (Priscila), primeiro "Terminei" (05/11 15:00, 126 min); o de 06/11 14:09 foi a repetição
  ('6260-5','pz1','{"op":"pmulnxr7x914","st":"ok","ini":1793890442027,"fim":1793901658868,"maq":"sublimacao-1","util":126}');
-- Pedido 6260: "Marcar todas como feitas" do Roger em 06/11 18:24 (11 etapas em cada peça)
insert into rec select l, r, jsonb_build_object('st','ok','ini',t,'fim',t,'op','roger','por','Roger','retro',true)
  from (values ('6260-1',1794000258241::bigint),('6260-2',1794000267938::bigint)) p(l,t),
       unnest(array['barra','barramanga','botao','casear','cobregola','embalar','etiqueta','fechar','manga','ombro','arremate']) r;

-- só o que ainda não está feito na peça
delete from rec where exists (select 1 from docs d where d.path = 'lotes/' || rec.lote and d.data->'steps'->rec.ref->>'st' = 'ok');

-- cópia de segurança das peças que vão mudar
insert into docs(path, data)
select 'lixeira/lotes~' || replace(d.path, 'lotes/', '') || '~recup0911',
       jsonb_build_object('col','lotes','id',replace(d.path,'lotes/',''),'data',d.data,'ts',(extract(epoch from now())*1000)::bigint,'por','Recuperação 09/11 (toques perdidos)')
from docs d where d.path in (select distinct 'lotes/' || lote from rec)
on conflict (path) do nothing;

-- devolve as etapas
update docs d set data = jsonb_set(d.data, '{steps}', coalesce(d.data->'steps', '{}'::jsonb) || x.passos)
from (select 'lotes/' || lote as path, jsonb_object_agg(ref, passo) as passos from rec group by lote) x
where d.path = x.path;

select lote, count(*) as etapas_devolvidas from rec group by lote order by lote;
commit;
