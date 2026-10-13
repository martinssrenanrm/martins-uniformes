-- Martins Pro no Supabase: uma tabela de documentos (mesmo formato do banco do Claude),
-- acesso só para quem está na lista de acessos do app (documentos usuarios/*).
-- Rodar uma vez no SQL Editor do projeto (ou via tools/supabase.js).

create table if not exists public.docs (
  path text primary key,
  col text generated always as (split_part(path, '/', 1)) stored,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists docs_col_idx on public.docs (col);
alter table public.docs replica identity full;

create or replace function public.docs_touch() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists docs_touch on public.docs;
create trigger docs_touch before update on public.docs for each row execute function public.docs_touch();

-- Quem tem acesso: o e-mail do login está num documento usuarios/* do app.
create or replace function public.tem_acesso() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.docs
    where col = 'usuarios' and lower(data->>'email') = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

alter table public.docs enable row level security;
drop policy if exists docs_ler on public.docs;
drop policy if exists docs_criar on public.docs;
drop policy if exists docs_mudar on public.docs;
drop policy if exists docs_apagar on public.docs;
create policy docs_ler    on public.docs for select to authenticated using (public.tem_acesso());
create policy docs_criar  on public.docs for insert to authenticated with check (public.tem_acesso());
create policy docs_mudar  on public.docs for update to authenticated using (public.tem_acesso()) with check (public.tem_acesso());
create policy docs_apagar on public.docs for delete to authenticated using (public.tem_acesso());

-- Atualização parcial (o app manda só o que mudou): junta objetos, troca listas e valores.
create or replace function public.jsonb_junta(a jsonb, b jsonb) returns jsonb
language sql immutable as $$
  select case
    when jsonb_typeof(a) = 'object' and jsonb_typeof(b) = 'object' then (
      select coalesce(jsonb_object_agg(k,
        case when a ? k and b ? k then public.jsonb_junta(a -> k, b -> k)
             when b ? k then b -> k else a -> k end), '{}'::jsonb)
      from (select jsonb_object_keys(a) k union select jsonb_object_keys(b)) chaves)
    else b end;
$$;

create or replace function public.doc_update(p text, patch jsonb) returns boolean
language plpgsql security invoker set search_path = public as $$
begin
  update public.docs set data = public.jsonb_junta(data, patch) where path = p;
  return found;
end $$;

-- Mudanças ao vivo para os outros aparelhos.
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;
