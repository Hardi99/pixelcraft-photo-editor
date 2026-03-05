#!/bin/bash
set -e

echo "=== Starting Photo Editor Backend ==="
echo "RAILS_ENV: $RAILS_ENV"
echo "Working directory: $(pwd)"
echo "Files in config/: $(ls config/)"

echo "=== Running database setup ==="
bundle exec rake db:prepare

echo "=== Starting Rails server ==="
exec bundle exec rails server -b 0.0.0.0 -p 3000
