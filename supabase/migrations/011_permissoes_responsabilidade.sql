-- 011: permissões por responsabilidade, também no banco (repete a regra da tela; Onda UX 1, 11/2026).
-- NÃO APLICADA. Aplicar só com aprovação, fora do expediente. Pode rodar de novo sem quebrar nada.
--
-- Regra (igual à do app, `PERMS` em app.html):
--   * Gestão pode tudo.
--   * Quem não é da gestão não muda as permissões (config/main › permissoes).
--   * Cancelar pedido (e voltar um cancelado): só se a fábrica liberou ('cancelar'; padrão: só a gestão).
--   * Entregar pedido (e desfazer a entrega): só se a fábrica liberou ('entregar'; padrão: o Escritório pode).
--   * Corrigir o que a produção já fez ('corrigirProd'; padrão: só a gestão): mudar ou voltar um processo
--     terminado há mais de 15 minutos, ou cancelar um começo de mais de 15 minutos.
--     Os 15 minutos deixam o "Desfazer" do próprio toque funcionar (ele guarda até 15 minutos).
--     Processos de prestador de serviço (com `forn`) ficam fora: "Chegou" e o desfazer dele são do Escritório.
-- O que a fábrica escolhe fica em config/main › permissoes: {"entregar":true,"cancelar":false,"corrigirProd":false}.
-- Cadastros e Painel do gestor já não abrem para quem não é da gestão; no banco, eventos e métricas já são só da gestão (007).
-- Cadastros (tipos, produtos, pessoas, forn) NÃO foram fechados no banco: o Escritório marca quem saiu (pessoas.disp)
-- e o Novo pedido pode cadastrar empresa. Fechar por campo fica para depois, se for preciso.

create or replace function public.perm_escritorio(k text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select (data->'permissoes'->>k)::boolean from public.docs
      where path = 'config/main' and jsonb_typeof(data->'permissoes'->k) = 'boolean'),
    case k when 'entregar' then true else false end);
$$;
revoke execute on function public.perm_escritorio(text) from public, anon;
grant execute on function public.perm_escritorio(text) to authenticated;

create or replace function public.docs_regras() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  k text; o jsonb; n jsonb; -- (a coluna gerada "col" ainda não existe no NEW de um gatilho "before": usar o path)
  lim bigint := (extract(epoch from now()) * 1000)::bigint - 15 * 60 * 1000;
begin
  -- só vale para quem entra pelo app (o SQL Editor e as rotinas do servidor não têm usuário)
  if auth.uid() is null or public.eh_gestao() then return new; end if;

  if new.path = 'config/main' and (old.data->'permissoes') is distinct from (new.data->'permissoes') then
    raise exception 'Só a gestão muda o que o Escritório pode fazer.' using errcode = '42501';
  end if;

  if split_part(new.path, '/', 1) = 'pedidos' then
    if coalesce(old.data->'cancelado', 'null'::jsonb) is distinct from coalesce(new.data->'cancelado', 'null'::jsonb) then
      if not public.perm_escritorio('cancelar') then
        raise exception 'Só a gestão cancela pedido.' using errcode = '42501';
      end if;
    elsif coalesce(old.data->'cancelado', 'null'::jsonb) = 'null'::jsonb
      and coalesce(old.data->'concluido', 'null'::jsonb) is distinct from coalesce(new.data->'concluido', 'null'::jsonb) then
      if not public.perm_escritorio('entregar') then
        raise exception 'Só a gestão entrega pedido.' using errcode = '42501';
      end if;
    end if;
  end if;

  if split_part(new.path, '/', 1) = 'lotes' and not public.perm_escritorio('corrigirProd') then
    for k, o in select key, value from jsonb_each(coalesce(old.data->'steps', '{}'::jsonb)) loop
      continue when jsonb_typeof(o) <> 'object' or o ? 'forn';
      n := new.data->'steps'->k;
      if o->>'st' = 'ok' and coalesce(o->>'fim', '') ~ '^[0-9]+(\.[0-9]+)?$' and (o->>'fim')::numeric < lim then
        if n is null or n->>'st' is distinct from 'ok' or n->'ini' is distinct from o->'ini'
           or n->'fim' is distinct from o->'fim' or n->'op' is distinct from o->'op' then
          raise exception 'Só a gestão corrige o que a produção já fez.' using errcode = '42501';
        end if;
      elsif o->>'st' = 'and' and coalesce(o->>'ini', '') ~ '^[0-9]+(\.[0-9]+)?$' and (o->>'ini')::numeric < lim then
        if n is null or n->>'st' = 'pend' then
          raise exception 'Só a gestão cancela um processo começado.' using errcode = '42501';
        end if;
      end if;
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists docs_regras on public.docs;
create trigger docs_regras before update on public.docs for each row execute function public.docs_regras();
