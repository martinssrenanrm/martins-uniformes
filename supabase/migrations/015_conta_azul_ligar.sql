-- 015: LIGA a busca das vendas do Conta Azul pela função do Supabase (aplicar só na troca, depois de:
--   a) a função "conta-azul" publicada (supabase/functions/conta-azul) e os segredos CA_CLIENT_ID e CA_CLIENT_SECRET colados nela;
--   b) a busca de vendas desligada no GitHub (martins-uniformes-copias › conta-azul-vendas.yml sem o horário).
-- Busca rápida a cada 3 min, seg–sáb, 7h–19h (Brasília = UTC-3: 10h–21h57 UTC) e a completa às 02:30 (05:30 UTC).
-- Antes desta, guarde o endereço da função (muda por cliente; não fica no código; não é segredo):
--   insert into public.ca_config (id, funcao_url) values (1, 'https://<ref>.supabase.co/functions/v1/conta-azul')
--   on conflict (id) do update set funcao_url = excluded.funcao_url;
-- O agendador manda um segredo que só o banco conhece (Vault); a função confere com ca_cron_confere (014).
-- Desligar: select cron.unschedule('conta-azul-rapida'); select cron.unschedule('conta-azul-noite');
-- Pode rodar de novo sem problema (recria os horários com o mesmo nome).

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$ begin
  if not exists (select 1 from vault.secrets where name = 'conta_azul_cron') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'conta_azul_cron', 'Agendador → função conta-azul');
  end if;
end $$;


create table if not exists public.ca_config (id int primary key default 1 check (id = 1), funcao_url text);
alter table public.ca_config enable row level security;
revoke all on public.ca_config from anon, authenticated;

create or replace function public.ca_chama(modo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := (select funcao_url from public.ca_config where id = 1),
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-agendador', (select decrypted_secret from vault.decrypted_secrets where name = 'conta_azul_cron')),
    body := jsonb_build_object('modo', modo),
    timeout_milliseconds := 120000);
end $$;
revoke execute on function public.ca_chama(text) from public, anon, authenticated;

-- Sem o endereço (outro cliente, ou o ensaio de restauração): não agenda nada e só avisa.
do $$ begin
  if not exists (select 1 from public.ca_config where id = 1 and funcao_url like 'https://%') then
    raise notice 'Sem o endereço da função em ca_config: agendador NÃO ligado.';
    return;
  end if;
  perform cron.schedule('conta-azul-rapida', '*/3 10-21 * * 1-6', 'select public.ca_chama(''rapida'')');
  perform cron.schedule('conta-azul-noite', '30 5 * * *', 'select public.ca_chama(''noite'')');
end $$;
