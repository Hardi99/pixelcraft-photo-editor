#!/bin/bash
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL is not set — skipping database setup"
else
  # db:prepare crée la base si besoin, applique les migrations, et lance les seeds
  # (idempotents) uniquement à la création.
  bundle exec rails db:prepare
fi

exec bundle exec rails server -b 0.0.0.0 -p "${PORT:-3000}"
