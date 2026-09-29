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

## Testes

```
NODE_PATH=$(npm root -g) node tests/sincronia.test.js
NODE_PATH=$(npm root -g) node tests/corrigir-pedido.test.js
NODE_PATH=$(npm root -g) node tests/dados-persistem.test.js
NODE_PATH=$(npm root -g) node tests/mockup-original.test.js
NODE_PATH=$(npm root -g) node tests/ajuda.test.js
```
