# Martins Pro: instruções para quem mexe neste projeto

O sistema inteiro está em `app.html`. Antes de mudar qualquer coisa, leia `README.md` e `DADOS.md`: onde ficam os dados e o que nunca pode ser perdido.

## Usabilidade (obrigatório)

**Público:**
- Hoje usam a Helena (dona e encarregada, ~60 anos, principal usuária, celular na fábrica), o Roger (vendas e rua) e as vendedoras (computador).
- Depois, as costureiras (~60 anos, Android simples com letra aumentada, vista cansada, pressa, medo de "apertar errado").
- Pense sempre na **Dona Cida**: se ela não entende a tela, a tela falhou.

**Regras:**
1. **Toda tela nova, função nova ou mudança de interface** segue `docs/ux/GUIA-USABILIDADE.md`: letra de 16px ou mais, alvos de 48px ou mais, palavras da equipe, uma ação principal, confirmação no que não tem volta.
2. **Ao terminar qualquer mudança de interface:**
   - aplique o **Teste da Dona Cida** (seção 7 do guia) nas telas alteradas;
   - tire prints em 360×640;
   - mostre o resultado ao Nico.
3. **Sem mudança brusca em tela que já está em uso:**
   - classifique o risco de estranhamento (baixo, médio ou alto);
   - não mude o visual e o fluxo da mesma tela ao mesmo tempo;
   - não mude de lugar botão usado todo dia sem aprovação;
   - trabalhe em ondas pequenas aprovadas (`docs/ux/PLANO-DE-ONDAS.md`);
   - registre cada onda em `docs/ux/NOVIDADES-PARA-EQUIPE.md`.
4. **Nenhuma função é adicionada ou removida** numa onda de usabilidade. Função nova é pedido separado.
5. **Central "Como usar o app" (lista `FAQ` em `app.html`):** toda função nova, botão renomeado ou tela mudada atualiza as perguntas e respostas no mesmo commit. Rode `tests/ajuda.test.js`.

## Produto para várias confecções (obrigatório)

A Martins é o primeiro cliente, não o produto. O mesmo código vai servir outras confecções de roupas e acessórios.

**Antes de implementar um pedido, classifique:**
1. **Dado** (tecido, fornecedor, tempo de etapa): já cabe em cadastro. Não mexa no código; ensine onde fica.
2. **Regra que outra fábrica faria diferente** (quem faz a arte, o que trava o corte): vira opção de configuração, com padrão neutro.
3. **Função que só alguns clientes querem**: vira módulo liga/desliga.
4. **Melhoria que serve a todos**: núcleo, sem nome de cliente.

**Nunca no código (o teste `cliente-novo` confere):**
- nome de pessoa, e-mail real, id de pedido ou de produto de um cliente na lógica;
- atualização de dados que mude conteúdo (só formato) ou que rode a cada abertura re-impondo dado apagado. Atualização nova = novo item no fim de `MIGRACOES` (v = último + 1); roda uma vez por banco e fica registrada em `schema`;
- acesso fixo. Os primeiros acessos vêm de `clientes/<id>.json` (`admins`), só quando o banco não tem nenhum usuário.

Textos que citam quem procurar usam `SUPORTE()`, `gestoresTxt()` e `NOME_EMP()`. Dados de demonstração ficam só em `seed()` e são marcados com `exemplo:true`.

## Testes
Todos de uma vez: `NODE_PATH=$(npm root -g) bash tests/rodar-todos.sh`. O GitHub roda todos a cada envio para a main e **só publica se passarem** (e se `site/` foi gerado do `app.html` atual).

```
NODE_PATH=$(npm root -g) node tests/sincronia.test.js
NODE_PATH=$(npm root -g) node tests/corrigir-pedido.test.js
NODE_PATH=$(npm root -g) node tests/dados-persistem.test.js
NODE_PATH=$(npm root -g) node tests/mockup-original.test.js
NODE_PATH=$(npm root -g) node tests/ajuda.test.js
NODE_PATH=$(npm root -g) node tests/pausar-dividir.test.js
NODE_PATH=$(npm root -g) node tests/supabase.test.js
NODE_PATH=$(npm root -g) node tests/cancelar-pedido.test.js
NODE_PATH=$(npm root -g) node tests/importar-ficha.test.js
NODE_PATH=$(npm root -g) node tests/feriados-entrega.test.js
NODE_PATH=$(npm root -g) node tests/modelagem-tecidos.test.js
NODE_PATH=$(npm root -g) node tests/etiquetas.test.js
NODE_PATH=$(npm root -g) node tests/ciclo.test.js
NODE_PATH=$(npm root -g) node tests/cliente-novo.test.js
NODE_PATH=$(npm root -g) node tests/setores-escritorio.test.js
NODE_PATH=$(npm root -g) node tests/minha-vez.test.js
NODE_PATH=$(npm root -g) node tests/tempos-padrao.test.js
NODE_PATH=$(npm root -g) node tests/cortar-junto.test.js
NODE_PATH=$(npm root -g) node tests/bloco2-martins.test.js
NODE_PATH=$(npm root -g) node tests/etapas-produto.test.js
NODE_PATH=$(npm root -g) node tests/fichas-trello.test.js
NODE_PATH=$(npm root -g) node tests/escritorio-fora.test.js
NODE_PATH=$(npm root -g) node tests/conta-azul.test.js
NODE_PATH=$(npm root -g) node tests/audios-2310.test.js
NODE_PATH=$(npm root -g) node tests/audios-2610.test.js
NODE_PATH=$(npm root -g) node tests/pedido-mf.test.js
```

## Supabase (endereço próprio)

O mesmo `app.html` roda no Claude (sem `window.MARTINS_SB`) e no Supabase (com `window.MARTINS_SB`, gerado por `tools/build.js`). Toda mudança no banco ou no login precisa passar nos dois modos. Roteiro completo em `docs/SUPABASE.md`.
