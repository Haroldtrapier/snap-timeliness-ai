#!/bin/bash
# SessionStart hook for Claude Code on the web.
# Ensures ffmpeg + Node dependencies are available and reports whether the
# media hosts this project needs are reachable under the environment's
# network (egress) policy.
#
# Runs synchronously: the session waits until this finishes, so ffmpeg and
# node_modules are guaranteed present before the agent does anything.
set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$PROJECT_DIR"

log() { printf '[session-start] %s\n' "$*"; }

# ---------------------------------------------------------------------------
# 1. ffmpeg — only meaningful in the remote (web) container, where we have
#    apt + root. Skip on local machines so we don't touch a dev's system.
# ---------------------------------------------------------------------------
if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ]; then
  if command -v ffmpeg >/dev/null 2>&1; then
    log "ffmpeg already installed ($(ffmpeg -version | head -1 | cut -d' ' -f1-3))"
  else
    log "installing ffmpeg from the main Ubuntu archive..."
    # Update ONLY the main ubuntu.sources. Third-party PPAs
    # (ppa.launchpadcontent.net, docker) are typically not on the egress
    # allowlist and would make 'apt-get update' noisy/slow; the main archive
    # (archive.ubuntu.com / security.ubuntu.com) carries ffmpeg.
    apt-get update -y \
      -o Dir::Etc::sourcelist="sources.list.d/ubuntu.sources" \
      -o Dir::Etc::sourceparts="/dev/null" \
      -o APT::Get::List-Cleanup="0" >/dev/null
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ffmpeg >/dev/null
    log "ffmpeg installed ($(ffmpeg -version | head -1 | cut -d' ' -f1-3))"
  fi
else
  log "local (non-remote) session: skipping ffmpeg apt install"
fi

# ---------------------------------------------------------------------------
# 2. Node dependencies (idempotent; 'npm install' reuses the cached container
#    layer on subsequent runs, unlike 'npm ci').
# ---------------------------------------------------------------------------
if [ -f package-lock.json ] || [ -f package.json ]; then
  log "installing Node dependencies (npm install)..."
  npm install --no-audit --no-fund >/dev/null 2>&1
  log "Node dependencies ready"
fi

# ---------------------------------------------------------------------------
# 3. Media-host reachability probe (diagnostic only — never fails the hook).
#    Egress is fixed at session start, so this tells you up front whether the
#    environment's network policy actually allows the hosts you need.
# ---------------------------------------------------------------------------
HOSTS_FILE="$PROJECT_DIR/.claude/media-hosts.txt"
if [ -f "$HOSTS_FILE" ]; then
  reachable=0 blocked=0 checked=0
  while IFS= read -r raw || [ -n "$raw" ]; do
    host="${raw%%#*}"                     # strip inline comments
    host="$(echo "$host" | tr -d '[:space:]')"
    [ -z "$host" ] && continue
    checked=$((checked + 1))
    case "$host" in
      *:80) url="http://${host%:80}/" ;;  # explicit http
      *)    url="https://${host}/" ;;
    esac
    if curl -sS -o /dev/null --max-time 10 --retry 0 "$url" >/dev/null 2>&1; then
      log "media host OK      -> $host"
      reachable=$((reachable + 1))
    else
      log "media host BLOCKED -> $host (add to the environment egress allowlist, then start a NEW session)"
      blocked=$((blocked + 1))
    fi
  done < "$HOSTS_FILE"

  if [ "$checked" -eq 0 ]; then
    log "no media hosts configured in .claude/media-hosts.txt (edit it to add yours)"
  else
    log "media-host probe: $reachable reachable, $blocked blocked, $checked total"
  fi
fi

log "setup complete"
