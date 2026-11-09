-- 014: busca das vendas do Conta Azul pela função do Supabase (09/11/2026). Prepara; NÃO liga.
-- Quem liga é a 015 (agendador). Sem a 015, nada roda sozinho e o app não mostra "Buscar vendas agora".
-- 1) Trava: uma busca por vez. O token do Conta Azul muda a cada renovação e o anterior deixa de valer:
--    duas buscas ao mesmo tempo perderiam a conexão. A trava vence sozinha (a busca que caiu não prende as outras).
-- 2) ca_estado(): o app pergunta se a busca automática está ligada e quando foi a última.
-- 3) ca_pode_buscar(): quem pode tocar em "Buscar vendas agora" (gestão e escritório).
-- 4) ca_cron_confere(segredo): a função confere se a chamada veio do agendador (segredo guardado no Vault pela 015).
-- Pode rodar de novo sem problema.

create table if not exists public.ca_trava (
  id    int primary key default 1 check (id = 1),
  dono  text,
  ate   timestamptz not null default '-infinity'
);
insert into public.ca_trava (id) values (1) on conflict (id) do nothing;
alter table public.ca_trava enable row level security;
revoke all on public.ca_trava from anon, authenticated;

-- Pega a trava por até "segundos". true = pode buscar; false = outra busca está rodando.
create or replace function public.ca_trava_pega(dono text, segundos int) returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update public.ca_trava set dono = ca_trava_pega.dono, ate = clock_timestamp() + make_interval(secs => segundos)
   where id = 1 and (ate < clock_timestamp() or ca_trava.dono = ca_trava_pega.dono)
  returning true into ok;
  return coalesce(ok, false);
end $$;
create or replace function public.ca_trava_solta(dono text) returns void
language sql security definer set search_path = public as $$
  update public.ca_trava set ate = '-infinity' where id = 1 and ca_trava.dono = ca_trava_solta.dono;
$$;
revoke execute on function public.ca_trava_pega(text, int) from public, anon, authenticated;
revoke execute on function public.ca_trava_solta(text) from public, anon, authenticated;

create or replace function public.ca_pode_buscar() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.docs
    where col = 'usuarios' and data->>'perfil' in ('gestao', 'escritorio')
      and lower(data->>'email') = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;
revoke execute on function public.ca_pode_buscar() from public, anon;
grant execute on function public.ca_pode_buscar() to authenticated;

create or replace function public.ca_estado() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare ligado boolean := false; i jsonb;
begin
  if not public.ca_pode_buscar() then return null; end if;
  if to_regclass('cron.job') is not null then
    execute 'select exists (select 1 from cron.job where jobname = ''conta-azul-rapida'' and active)' into ligado;
  end if;
  select info into i from public.integracoes where nome = 'conta-azul';
  return jsonb_build_object('ligado', ligado, 'ultima', i->>'ultima_sincronizacao');
end $$;
revoke execute on function public.ca_estado() from public, anon;
grant execute on function public.ca_estado() to authenticated;

create or replace function public.ca_cron_confere(segredo text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare s text;
begin
  if segredo is null or length(segredo) < 20 or to_regclass('vault.decrypted_secrets') is null then return false; end if;
  execute 'select decrypted_secret from vault.decrypted_secrets where name = ''conta_azul_cron''' into s;
  return s is not null and s = segredo;
end $$;
revoke execute on function public.ca_cron_confere(text) from public, anon, authenticated;
