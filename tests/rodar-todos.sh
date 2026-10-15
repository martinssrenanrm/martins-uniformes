#!/usr/bin/env bash
# Roda todos os testes; para no fim e sai com erro se algum falhou.
# Uso: NODE_PATH=$(npm root -g) bash tests/rodar-todos.sh
cd "$(dirname "$0")/.."
falhou=()
for f in tests/*.test.js; do
  echo "=== $f"
  if ! timeout 300 node "$f"; then falhou+=("$f"); fi
done
if [ ${#falhou[@]} -gt 0 ]; then echo; echo "FALHARAM: ${falhou[*]}"; exit 1; fi
echo; echo "Todos os testes passaram."
