#!/usr/bin/env bash
# Point the mobile dev stack at this machine's current LAN address.
#
# Two files need it and they drift: the repo-root .env drives the compose
# `mobile` service, while apps/mobile/.env is the fallback for running Metro on
# the host. Updating one but not the other produces a phone stuck on
# "connecting to the development server", so this writes both.
set -euo pipefail

cd "$(dirname "$0")/.."

IP="${1:-$(hostname -I | awk '{print $1}')}"

if [[ -z "$IP" ]]; then
  echo "Could not determine a LAN IP. Pass one explicitly: pnpm dev:ip 192.168.1.50" >&2
  exit 1
fi

set_var() {
  local file="$1" key="$2" value="$3"
  [[ -f "$file" ]] || return 0
  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >>"$file"
  fi
}

set_var .env LAN_IP "$IP"
set_var apps/mobile/.env EXPO_PUBLIC_API_URL "http://${IP}:4000"

echo "LAN_IP=${IP}"
echo "Recreate Metro so it advertises the new address:"
echo "  docker compose -f compose.dev.yml up -d --force-recreate mobile"
