#!/usr/bin/env bash
# Roda todos os testes; para no fim e sai com erro se algum falhou.
# Uso: NODE_PATH=$(npm root -g) bash tests/rodar-todos.sh
cd "$(dirname "$0")/.."
falhou=()
for f in tests/*.test.js; do
  echo "=== $f"
  if ! timeout 300 node "$f"; then falhou+=("$f"); fi
done
# o mesmo teste do Supabase com o banco de hoje (sem a migração 019)
echo "=== tests/supabase.test.js (banco sem a 019)"
if ! SEM_019=1 timeout 300 node tests/supabase.test.js; then falhou+=("tests/supabase.test.js[sem 019]"); fi
if [ ${#falhou[@]} -gt 0 ]; then echo; echo "FALHARAM: ${falhou[*]}"; exit 1; fi
echo; echo "Todos os testes passaram."
