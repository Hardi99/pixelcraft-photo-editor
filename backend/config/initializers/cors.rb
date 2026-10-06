# Liste blanche explicite (comparaison exacte des origines). L'ancienne regex
# non ancrée /https:\/\/.*\.vercel\.app/ acceptait n'importe quel site Vercel,
# et même https://x.vercel.app.evil.com.
allowed_origins = ENV.fetch("FRONTEND_ORIGINS", "http://localhost:5173").split(",").map(&:strip)

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins)

    resource "/api/*",
      headers: %w[Authorization Content-Type],
      methods: %i[get post patch delete options]

    # Fabric.js charge les images en crossOrigin "anonymous" : sans ces en-têtes,
    # le canvas serait « tainted » et l'export PNG échouerait.
    resource "/rails/active_storage/*", headers: :any, methods: %i[get options]
  end
end
