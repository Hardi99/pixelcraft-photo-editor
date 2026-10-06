require "rails_helper"

RSpec.describe "API publique" do
  describe "POST /api/v1/visitors" do
    it "crée un visiteur anonyme et renvoie son jeton" do
      expect { post "/api/v1/visitors" }.to change(Visitor, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json["token"]).to eq(Visitor.last.token)
    end
  end

  describe "GET /api/v1/stats" do
    it "est public et renvoie les KPI" do
      get "/api/v1/stats"

      expect(response).to have_http_status(:ok)
      expect(json.keys).to include("total_projects", "funnel", "tool_usage", "recent_activity")
    end
  end

  describe "CORS" do
    def preflight(origin)
      options "/api/v1/stats", headers: { "Origin" => origin, "Access-Control-Request-Method" => "GET" }
      response.headers["Access-Control-Allow-Origin"]
    end

    it "autorise le frontend configuré" do
      expect(preflight("http://localhost:5173")).to eq("http://localhost:5173")
    end

    it "refuse une origine qui imite un domaine autorisé" do
      expect(preflight("https://pixelcraft.vercel.app.evil.com")).to be_nil
      expect(preflight("https://autre-projet.vercel.app")).to be_nil
    end
  end
end
