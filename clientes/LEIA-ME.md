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
- `quadro` (opcional): ponto de partida do **Quadro de pedidos** (Pedidos › Quadro). Depois, a gestão cuida em Cadastros › Ajustes › Quadro de pedidos.
  - `cols`: colunas em ordem. `tipo` é `inicio` (falta pré-pedido, ficha ou arte), `compra` (falta material para cortar), `prod` (máquinas) ou `fim` (pronto ou entregue). Coluna `prod` diz quais máquinas são dela por `maqs` (nome ou id da máquina), `setores` (id do setor) ou `fases` (`corte`, `pers`, `costura`, `acab`). A máquina citada pelo nome vence o setor e a fase.
  - `etiquetas`: `[{"nome":"Urgente","cor":"vermelho"}]`. Cores: vermelho, amarelo, verde, azul, rosa, roxo, laranja, cinza. A etiqueta EVENTO já existe (é o "pedido para evento").
  - `checklist`: `[{"nome":"Corte","itens":["Cortou?"]}]`, o checklist que todo pedido recebe.
  - Sem o campo, as colunas saem dos setores da fábrica, com etiquetas e checklist simples.
- `admins`: acessos de gestão criados **só na primeira instalação** (quando o banco não tem nenhum usuário). Ex.: `[{"id":"u-ana","email":"ana@empresa.com.br","nome":"Ana"}]`. Depois disso, os acessos são cuidados no próprio app (Cadastros › Ajustes › Acessos).

Nunca coloque aqui dados de pedidos, fichas ou senhas: este repositório é público.
