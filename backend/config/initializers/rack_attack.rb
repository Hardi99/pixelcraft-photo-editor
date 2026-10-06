# Limitation de débit par adresse IP. Stockage mémoire : suffisant pour une seule
# instance ; avec plusieurs instances, il faudrait un cache partagé (Redis).
class Rack::Attack
  Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

  throttle("api/ip", limit: 300, period: 5.minutes) { |req| req.ip if req.path.start_with?("/api/") }
  throttle("visitors/ip", limit: 10, period: 1.hour) { |req| req.ip if req.post? && req.path == "/api/v1/visitors" }
  throttle("events/ip", limit: 60, period: 1.minute) { |req| req.ip if req.post? && req.path == "/api/v1/events" }

  self.throttled_responder = lambda do |_req|
    [ 429, { "Content-Type" => "application/json" }, [ { error: "Trop de requêtes" }.to_json ] ]
  end
end

# Le middleware est inséré automatiquement par la gem ; désactivé en test.
Rack::Attack.enabled = !Rails.env.test?
