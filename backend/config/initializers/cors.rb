Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(
      "http://localhost:5173",
      "http://localhost:3000",
      /https:\/\/.*\.railway\.app/,
      /https:\/\/.*\.vercel\.app/,
      ENV.fetch("FRONTEND_URL", "http://localhost:5173")
    )

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Content-Disposition"]
  end
end
