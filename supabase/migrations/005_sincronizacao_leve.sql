-- 005: sincronização leve (30/10/2026).
-- Problema: o app avisava cada mudança mandando a linha inteira (inclusive pedaços de imagem e de backup, ~190 kB cada)
-- para todos os aparelhos, e cada aparelho baixava todas as coleções a cada 2 minutos. Estourou a cota de tráfego do plano grátis.
-- Solução: uma tabela pequena só com "este documento mudou em tal hora". O app escuta esta tabela e baixa só o documento que mudou.
-- Pode rodar de novo sem problema.

create table if not exists public.docs_sinal(
  path text primary key,
  col  text not null,
  upd  timestamptz not null default clock_timestamp(),
  del  boolean not null default false
);
create index if not exists docs_sinal_upd_idx on public.docs_sinal(upd);

alter table public.docs_sinal enable row level security;
drop policy if exists docs_sinal_ler on public.docs_sinal;
create policy docs_sinal_ler on public.docs_sinal for select to authenticated using (public.tem_acesso());
revoke all on public.docs_sinal from anon;
revoke insert, update, delete on public.docs_sinal from authenticated;
grant select on public.docs_sinal to authenticated;

-- Só o gatilho escreve aqui. Pedaços de imagem (mockp) e de backup (backupp) não geram sinal: são lidos só quando alguém abre.
create or replace function public.docs_sinaliza() returns trigger
language plpgsql security definer set search_path = public as $$
declare p text; c text;
begin
  if tg_op = 'DELETE' then p := old.path; else p := new.path; end if;
  c := split_part(p, '/', 1);
  if c in ('mockp', 'backupp') then return null; end if;
  insert into public.docs_sinal(path, col, upd, del) values (p, c, clock_timestamp(), tg_op = 'DELETE')
  on conflict (path) do update set upd = excluded.upd, del = excluded.del, col = excluded.col;
  return null;
end $$;
revoke execute on function public.docs_sinaliza() from public, anon, authenticated;

drop trigger if exists docs_sinaliza on public.docs;
create trigger docs_sinaliza after insert or update or delete on public.docs
  for each row execute function public.docs_sinaliza();

-- sinais dos documentos que já existem
insert into public.docs_sinal(path, col, upd, del)
  select path, col, updated_at, false from public.docs where col not in ('mockp', 'backupp')
  on conflict (path) do nothing;

-- O ao vivo passa a ser só pela tabela de sinais (linhas de ~100 bytes em vez da linha inteira, duas vezes).
alter table public.docs replica identity default;
do $$ begin alter publication supabase_realtime drop table public.docs; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.docs_sinal; exception when duplicate_object then null; end $$;
