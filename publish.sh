#!/bin/zsh
set -e

cd "/Users/kylinou/Desktop/USYD/Studying in USYD/毕业结构:规划"

git add index.html .gitignore publish.sh

if git diff --cached --quiet; then
  echo "No planner changes to publish."
else
  git commit -m "Update planner: $(date '+%Y-%m-%d %H:%M')"
fi

git push
