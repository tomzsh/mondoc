#!/usr/bin/env bash
# Sync local MONSKILLS into .agents/skills/ from the official monorepo.
# Does not overwrite .agents/skills/mondoc/ (project skill).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/.agents/skills"
TMP="${TMPDIR:-/tmp}/monskills-sync-$$"
REPO_URL="${MONSKILLS_REPO:-https://github.com/therealharpaljadeja/monskills.git}"

TOPICS=(
  scaffold
  why-monad
  concepts
  addresses
  wallet
  wallet-integration
  gas
  tooling-and-infra
  indexer
)

cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

echo "==> Cloning $REPO_URL"
git clone --depth 1 "$REPO_URL" "$TMP"

mkdir -p "$DEST"

# Router skill lives in package root SKILL.md → monskill/
mkdir -p "$DEST/monskill"
cp -a "$TMP/SKILL.md" "$DEST/monskill/SKILL.md"

# Prefer committed project router if present (has relative paths + mondoc)
if [[ -f "$ROOT/.agents/skills/monskill/SKILL.md.project" ]]; then
  cp -a "$ROOT/.agents/skills/monskill/SKILL.md.project" "$DEST/monskill/SKILL.md"
  echo "  using monskill/SKILL.md.project"
elif command -v python3 >/dev/null 2>&1; then
  python3 - <<'PY' "$DEST/monskill/SKILL.md"
import re, sys
path = sys.argv[1]
text = open(path).read()
text2 = re.sub(r"\]\(/([a-z0-9-]+)/SKILL\.md\)", r"](../\1/SKILL.md)", text)
text2 = re.sub(r"`([a-z0-9-]+)/`", r"`../\1/`", text2)
if "mondoc" not in text2:
    text2 = text2.replace(
        "building on Monad (mainnet and testnet).",
        "building on Monad (mainnet and testnet).\n\n**Repo:** Also open `../mondoc/SKILL.md` and root `AGENTS.md`.\n",
        1,
    )
open(path, "w").write(text2)
print("patched monskill paths")
PY
fi
# Keep a project copy of the router for future syncs
cp -a "$DEST/monskill/SKILL.md" "$DEST/monskill/SKILL.md.project"

for topic in "${TOPICS[@]}"; do
  if [[ -d "$TMP/$topic" ]]; then
    rm -rf "$DEST/$topic"
    cp -a "$TMP/$topic" "$DEST/$topic"
    echo "  synced $topic"
  else
    echo "  skip missing $topic" >&2
  fi
done

# Preserve project skill
if [[ ! -f "$DEST/mondoc/SKILL.md" ]]; then
  echo "WARN: mondoc project skill missing — restore from git" >&2
fi

# Update skills-lock stub
cat > "$ROOT/skills-lock.json" <<EOF
{
  "version": 1,
  "source": "therealharpaljadeja/monskills",
  "syncedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "skills": {
    "monskill": { "path": ".agents/skills/monskill" },
    "scaffold": { "path": ".agents/skills/scaffold" },
    "why-monad": { "path": ".agents/skills/why-monad" },
    "concepts": { "path": ".agents/skills/concepts" },
    "addresses": { "path": ".agents/skills/addresses" },
    "wallet": { "path": ".agents/skills/wallet" },
    "wallet-integration": { "path": ".agents/skills/wallet-integration" },
    "gas": { "path": ".agents/skills/gas" },
    "tooling-and-infra": { "path": ".agents/skills/tooling-and-infra" },
    "indexer": { "path": ".agents/skills/indexer" },
    "mondoc": { "path": ".agents/skills/mondoc", "project": true }
  }
}
EOF

echo "==> Done. Local skills:"
find "$DEST" -name 'SKILL.md' | sort
