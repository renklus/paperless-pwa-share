#!/bin/sh
set -eu

# Optional per-instance display name (home screen label and share sheet entry).
# Rewrites the generated web app manifest before the server starts.
if [ -n "${APP_NAME:-}" ]; then
  manifest=/public/manifest.webmanifest
  # Escape for a JSON string, then for the sed replacement.
  json=$(printf '%s' "$APP_NAME" | sed -e 's/[\\"]/\\&/g')
  repl=$(printf '%s' "$json" | sed -e 's/[\\&|]/\\&/g')
  updated=$(sed -E \
    -e "s|\"name\":\"[^\"]*\",\"short_name\":\"[^\"]*\"|\"name\":\"$repl\",\"short_name\":\"$repl\"|" \
    "$manifest")
  printf '%s\n' "$updated" > "$manifest"
  echo "Set app name to: $APP_NAME"
fi

exec static-web-server "$@"
