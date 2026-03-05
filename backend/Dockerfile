FROM ruby:3.2-alpine

RUN apk add --no-cache \
  build-base \
  postgresql-dev \
  tzdata \
  nodejs \
  bash \
  git \
  vips-dev \
  imagemagick \
  yaml-dev

WORKDIR /app

COPY Gemfile Gemfile.lock* ./
RUN bundle install --jobs 4 --retry 3

COPY . .

RUN chmod +x bin/rails bin/rake bin/bundle entrypoint.sh 2>/dev/null || true

EXPOSE 3000
CMD ["./entrypoint.sh"]
