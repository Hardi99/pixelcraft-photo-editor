#!/bin/bash
set -e

echo "=== Starting Photo Editor Backend ==="
echo "RAILS_ENV: ${RAILS_ENV:-development}"

if [ -z "$DATABASE_URL" ]; then
  echo "WARNING: DATABASE_URL is not set — skipping migrations"
else
  echo "=== Running database migrations ==="
  bundle exec rake db:migrate
fi

echo "=== Starting Rails server ==="
exec bundle exec rails server -b 0.0.0.0 -p 3000
