# Mudança para o Supabase: endereço próprio da Martins

**Situação (14/10/2026): feita.**
- **Endereço:** https://martinssrenanrm.github.io/martins-uniformes/
- **Projeto Supabase:** `fmiyrnkzsurjlunfgwjq` ("Martins Uniformes App").
- **Dados levados:** 135 documentos, conferidos por coleção.
- **Para publicar uma mudança:** rode `tools/build.js` com a URL e a chave pública do projeto, faça o commit de `site/` e o push. A automação publica em cerca de 1 minuto.
- **Pendência:** apagar as funções desligadas `public.importar_docs` e `public.exportar_docs`, usadas só na migração. Ninguém tem permissão de usá-las. O conector do Claude não roda `drop` sem confirmação; apague pelo SQL Editor do Supabase.
- **Banco versionado:** tudo o que existe no banco está em `supabase/migrations/` (001 tabela e regras, 002 ficha pública do QR, 003 permissões). Mudança nova no banco = arquivo novo numerado.

**Objetivo:** abrir o app em qualquer navegador, só com o e-mail e a senha do app, sem conta Claude.

## Como fica
- **Banco:** Supabase (projeto do Renan).
  - Tabela única `docs` com `path`, `col`, `data` e `updated_at`, no mesmo formato do banco do Claude.
  - Mudanças chegam ao vivo nos outros aparelhos (Realtime).
- **Login:** Supabase Auth, com e-mail e senha.
  - **Primeiro acesso:** a pessoa toca em "É meu primeiro acesso", cria a senha e confirma pelo e-mail.
  - **Esqueci a senha:** chega um link por e-mail.
  - **Gestão:** pode mandar o link de senha nova em Ajustes › Acessos.
- **Quem entra:** só quem tem o e-mail cadastrado em **Cadastros › Ajustes › Acessos**. São os documentos `usuarios/*`, conferidos pela regra `tem_acesso()` do banco. Quem não está na lista entra, mas não vê nem grava nada.
- **Site:** `site/index.html`, gerado por `tools/build.js` a partir do `app.html`. Publicado pelo **GitHub Pages** num repositório público só com o site (`martinssrenanrm/martins-app`), ou pela Vercel a partir deste repositório (`vercel.json`).
- **Modo Claude:** o mesmo `app.html` continua funcionando no link do Claude enquanto a virada não acontece. Sem `window.MARTINS_SB`, ele usa o banco do Claude.

## O que precisa vir de fora (uma vez)
1. **Projeto Supabase**, na conta do Renan.
   - Para eu preparar tudo sozinho: um **token de acesso**, criado em supabase.com/dashboard/account/tokens.
   - Guarde o token nas configurações do ambiente como variável **`SUPABASE_ACCESS_TOKEN`**.
   - Me diga o **ref** do projeto: o código do endereço `https://<ref>.supabase.co`.
2. **Onde o site fica (escolha um):**
   - **GitHub Pages (escolhido):** este repositório publica sozinho pela automação `.github/workflows/pages.yml` sempre que `site/` muda.
     - Uma vez só, o dono faz: Settings › Pages › Source **GitHub Actions**.
     - Se o GitHub pedir upgrade: Pages em repositório privado exige GitHub Pro (cerca de US$ 4/mês). Não torne este repositório público, porque ele tem prints com dados reais de clientes.
     - Endereço: `https://martinssrenanrm.github.io/martins-uniformes/`, ou um domínio próprio.
   - **Vercel:** **Add New › Project › Import** `martinssrenanrm/martins-uniformes` › Deploy. Endereço `https://martins-uniformes.vercel.app`.

## Passo a passo da virada (quem executa: Claude)
0. **Sem token, se possível:** com o conector Supabase ligado no Claude (claude.ai/customize/connectors), rode os arquivos de `supabase/migrations/` em ordem (001, 002, …) e pegue a URL e a chave pública por ele. O passo 1 abaixo é o caminho com token.
1. **Preparar o projeto.** Isso cria a tabela, as regras de acesso, o tempo real e os e-mails em português, e mostra a URL e a chave pública.
   ```
   SUPABASE_ACCESS_TOKEN=… SUPABASE_REF=<ref> APP_URL=https://<endereço-da-vercel> node tools/supabase.js
   ```
2. **Combinar uma janela de 15 minutos sem uso** do link antigo.
3. **Exportar tudo do banco do Claude.** Use o ArtifactData com `out_dir`. Coleções:
   - tipos, pessoas, forn, produtos, pedidos, lotes, consertos, clientes, arquivos, usuarios
   - config, log, mock, mockp, mockups, backup, backupp, lixeira
4. **Importar no Supabase.** A chave `service_role` vem da API de gestão (`/v1/projects/<ref>/api-keys`). Use essa chave só aqui, nunca no app.
   ```
   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_KEY=… node tools/migrar.js <pasta-exportada>
   ```
5. **Gerar o site e publicar.**
   ```
   CLIENTE=martins SUPABASE_URL=… SUPABASE_ANON_KEY=… node tools/build.js   (cliente em clientes/<id>.json)
   ```
   - Faça o commit de `site/` neste repositório.
   - **GitHub Pages:** o push de `site/` publica sozinho em cerca de 1 minuto.
   - **Vercel:** o push deste repositório já publica.
6. **Testar com a Helena:** primeiro acesso, confirmação por e-mail, pedidos e mockups aparecendo.
7. **Avisar a equipe do endereço novo.** O link do Claude fica parado, como cópia, por 30 dias.

## Testes
```
NODE_PATH=$(npm root -g) node tests/supabase.test.js
```
O teste usa um Supabase simulado e confere:
- login;
- confirmação por e-mail;
- senha errada;
- e-mail sem acesso não lê nem grava;
- mudança ao vivo entre dois aparelhos;
- "esqueci a senha";
- sair.

## Atenção
- **Senhas:** as senhas atuais não passam para o Supabase (ficam guardadas de outro jeito). Cada pessoa faz o **primeiro acesso uma vez** no endereço novo.
- **E-mail:** o envio padrão do Supabase permite poucos e-mails por hora. Para uma equipe pequena basta. Se crescer, configure um SMTP próprio.
- **Permissões:** só a gestão cria, muda ou apaga acessos, e isso vale no banco, não só na tela (`003_permissoes.sql`). Fora isso, quem tem acesso lê e grava os dados da fábrica; o perfil Operação separa as telas.
