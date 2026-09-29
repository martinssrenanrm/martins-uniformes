# Martins Pro · Sistema de produção

Sistema de chão de fábrica da Martins Uniformes: máquinas, equipe, pedidos, fichas de produção, mockups, terceirizados, escritório e painel do gestor.

- **App publicado (link oficial):** https://claude.ai/artifact/TeXfVwz76SUL5XMGKXxK4E
- **Código:** `app.html` (arquivo único: HTML, CSS e JavaScript)
- **Onde ficam os dados e regras para não perder nada:** [DADOS.md](DADOS.md)

## Como atualizar
1. Editar `app.html`.
2. Rodar os testes (precisa de Node e Playwright):
   ```
   NODE_PATH=$(npm root -g) node tests/dados-persistem.test.js
   NODE_PATH=$(npm root -g) node tests/mockup-original.test.js
   ```
3. Publicar de novo no mesmo link do Claude. Os dados ficam no banco do app e **não** são afetados pela publicação.

## Pastas
- `tests/`: testes automáticos. `fixtures/` tem os mockups usados nos testes.
- `gestor-v01.html`: primeiro protótipo (histórico).
