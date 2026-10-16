# Roteiro do produto: onde paramos e o que vem depois

Atualizado em 16/10/2026. Contexto: a Martins está **em implantação**. Os dados de produção ainda não refletem o chão de fábrica (muita etapa marcada depois de pronta). **Não agir sobre esses números agora.**

## Feito e publicado
- **Replicabilidade (R0–R3):** sem dados da Martins no código; banco versionado e permissões; atualizações em ordem; testes no GitHub antes de publicar; modelo de fábrica; setores, etapas do escritório, cargos, módulos e palavras configuráveis; Cadastros › Configurar.
- **Usabilidade:** Onda 2 (confirmação e aviso no alto), Onda 4 (travas do dia a dia), Onda 5a–5d (Pedido, máquina, Novo pedido e Ajustes em blocos).
- **Visual v2:** Inter, superfícies leves, hierarquia de botões, cor da marca por cliente; revisão das telas principais.
- **Gestão por metas:** fase 1 (perfis Gestão/Escritório/Chão de fábrica + tela Minha vez) e fase 2 (tempos padrão cadastrado × real + indicador de registro confiável).

## Próximos passos (nesta ordem)
1. **Gestão por metas, fase 3:** tela "Hoje" por perfil, com meta automática por setor (pessoas × horas × tempo padrão × eficiência alvo). Onde não houver dado confiável, mostrar "aguardando registro".
2. **Fase 4: Revisão do dia** (o gestor faz sozinho): ontem × meta → 3 gargalos → decisão com dono e prazo → cobrança no dia seguinte; resumo semanal às segundas.
3. **Fase 5: Resultados:** semana, mês e tendência (prazo, eficiência, retrabalho, lead time).
4. **Nova navegação por papel:** Hoje · Pedidos · + Novo · Resultados · Mais (Cadastros/Configurar saem da barra).
5. **Visual dos documentos do cliente:** orçamento, ficha de produção, página do QR.
6. **Onda 3 (palavras da equipe):** "Fora" → "Na rua", verbos claros nos botões (parte pode virar configuração em Palavras da fábrica).
7. **Onda 6 (navegação):** só com aprovação; maior risco.

## Regras que valem para todos os passos
- Publicar só fora do expediente, com os testes passando, e registrar em `docs/ux/NOVIDADES-PARA-EQUIPE.md` com a frase pronta para o grupo.
- Não mudar visual e fluxo da mesma tela ao mesmo tempo.
- Toda regra que outra fábrica faria diferente vira configuração (ver CLAUDE.md).
- Ajustes urgentes da Martins (o que trava a produção) passam na frente deste roteiro.
