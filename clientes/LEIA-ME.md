# Clientes

Um arquivo por confecção. O build gera o app daquele cliente:

```
CLIENTE=martins SUPABASE_URL=... SUPABASE_ANON_KEY=... node tools/build.js
```

Campos:
- `id`: identificador curto, sem espaço.
- `nome` / `curto`: nome do app no celular (ícone e título).
- `suporte`: quem a equipe procura quando o app não abre (ex.: "o Nico"). Aparece nas telas de erro.
- `tiposCliente` (opcional): tipos de cliente que separam o faturamento em Resultados (ex.: `["Escola","Empresa"]`). É só o ponto de partida: depois, a lista é cuidada em Cadastros › Ajustes › Tipos de cliente. Sem o campo, a fábrica começa sem tipos e a divisão não aparece.
- `admins`: acessos de gestão criados **só na primeira instalação** (quando o banco não tem nenhum usuário). Ex.: `[{"id":"u-ana","email":"ana@empresa.com.br","nome":"Ana"}]`. Depois disso, os acessos são cuidados no próprio app (Cadastros › Ajustes › Acessos).

Nunca coloque aqui dados de pedidos, fichas ou senhas: este repositório é público.
