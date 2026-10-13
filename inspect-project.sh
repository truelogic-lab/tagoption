#!/usr/bin/env bash

echo "========================================"
echo "PROJECT OVERVIEW"
echo "========================================"

echo -e "
--- package.json ---"
cat package.json

echo -e "
--- Project tree (src only, depth 4) ---"
find src -maxdepth 4 -type f | sort

echo -e "
--- Config files ---"
for f in vite.config.* tsconfig*.json tailwind.config.* postcss.config.* .env.example index.html; do
  [ -f "$f" ] && echo -e "
### $f ###" && cat "$f"
done

echo -e "
========================================"
echo "CORE APP FILES"
echo "========================================"

for f in src/main.jsx src/main.tsx src/App.jsx src/App.tsx src/index.css src/App.css; do
  [ -f "$f" ] && echo -e "
### $f ###" && cat "$f"
done

echo -e "
========================================"
echo "ROUTES / PAGES"
echo "========================================"

find src -type f ( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" ) \
  | grep -Ei "route|page|layout" | sort | while read -r f; do
    echo -e "
### $f ###"
    cat "$f"
  done

echo -e "
========================================"
echo "TRADE SCREEN + CHART FILES"
echo "========================================"

find src -type f | grep -Ei "trade|live|chart|market|digit" | sort | while read -r f; do
  echo -e "
### $f ###"
  cat "$f"
done

echo -e "
========================================"
echo "GLOBAL STYLES / DESIGN TOKENS"
echo "========================================"

find src -type f ( -name "*.css" -o -name "*.scss" ) | grep -Ei "index|global|theme|variable|tokens" | sort | while read -r f; do
  echo -e "
### $f ###"
  cat "$f"
done

echo -e "
========================================"
echo "COMPONENT INVENTORY"
echo "========================================"

find src/components -type f 2>/dev/null | sort

echo -e "
========================================"
echo "DONE"
echo "========================================"
