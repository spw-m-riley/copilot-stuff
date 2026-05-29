#!/usr/bin/env bash
# prune-session-state.sh — remove stale session-state directories.
#
# Defaults to a dry-run that lists what would be deleted. Pass --apply
# to actually delete. Pass --days N to override the age threshold
# (default: 90 days).
#
# Usage:
#   scripts/prune-session-state.sh                    # dry-run, >90 days
#   scripts/prune-session-state.sh --days 60          # dry-run, >60 days
#   scripts/prune-session-state.sh --apply            # delete >90 days
#   scripts/prune-session-state.sh --days 30 --apply  # delete >30 days

set -euo pipefail

DAYS=90
APPLY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --apply) APPLY=1; shift ;;
    --days)  DAYS="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,14p' "$0"
      exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$REPO_ROOT/session-state"

if [[ ! -d "$TARGET" ]]; then
  echo "no session-state directory at $TARGET" >&2
  exit 0
fi

mapfile -t VICTIMS < <(find "$TARGET" -maxdepth 1 -mindepth 1 -type d -mtime +"$DAYS" | sort)

if [[ ${#VICTIMS[@]} -eq 0 ]]; then
  echo "nothing to prune (>${DAYS} days)"
  exit 0
fi

TOTAL_BYTES=0
for d in "${VICTIMS[@]}"; do
  bytes=$(du -sk "$d" 2>/dev/null | awk '{print $1}')
  TOTAL_BYTES=$(( TOTAL_BYTES + bytes ))
done
TOTAL_MB=$(( TOTAL_BYTES / 1024 ))

echo "candidates: ${#VICTIMS[@]} directories, ~${TOTAL_MB} MB total (>${DAYS} days old)"

if [[ "$APPLY" -ne 1 ]]; then
  echo "dry-run — pass --apply to delete. First 10 candidates:"
  printf '  %s\n' "${VICTIMS[@]:0:10}"
  exit 0
fi

for d in "${VICTIMS[@]}"; do
  rm -rf -- "$d"
done

echo "deleted ${#VICTIMS[@]} directories (~${TOTAL_MB} MB freed)"
