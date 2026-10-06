require "rails_helper"

RSpec.describe "Projects API" do
  let(:visitor) { create(:visitor) }
  let(:headers) { auth_headers(visitor) }

  describe "authentification" do
    it "refuse une requête sans jeton" do
      get "/api/v1/projects"
      expect(response).to have_http_status(:unauthorized)
    end

    it "refuse un jeton inconnu" do
      get "/api/v1/projects", headers: { "Authorization" => "Bearer inconnu" }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "isolation entre visiteurs" do
    let!(:other_project) { create(:project) }

    it "ne liste pas les projets des autres" do
      create(:project, visitor:)
      get("/api/v1/projects", headers:)

      expect(json["projects"].pluck("id")).not_to include(other_project.id)
      expect(json["meta"]["total"]).to eq(1)
    end

    it "renvoie 404 sur le projet d'un autre et ne le supprime pas" do
      delete("/api/v1/projects/#{other_project.id}", headers:)

      expect(response).to have_http_status(:not_found)
      expect(Project.exists?(other_project.id)).to be(true)
    end
  end

  describe "GET /api/v1/projects" do
    it "pagine et n'expose pas les calques dans la liste" do
      create_list(:project, 3, visitor:)
      get("/api/v1/projects", headers:, params: { page: 1 })

      expect(json["projects"].size).to eq(3)
      expect(json["projects"].first).not_to have_key("layers")
      expect(json["projects"].first["image_url"]).to start_with("/rails/active_storage/")
    end
  end

  describe "POST /api/v1/projects" do
    let(:params) do
      {
        project: {
          title: "Affiche",
          image: image_upload,
          thumbnail: image_upload,
          layers: { objects: [ { type: "i-text", text: "Salut" } ] }.to_json,
          settings: { aspect_ratio: "4:5", filter: "moon" }.to_json
        },
        editing_seconds: 42
      }
    end

    it "crée le projet avec sa photo d'origine et ses calques" do
      expect { post("/api/v1/projects", headers:, params:) }.to change(visitor.projects, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json["layers"]["objects"].first["text"]).to eq("Salut")
      expect(json["settings"]).to eq("aspect_ratio" => "4:5", "filter" => "moon")
      expect(json["editing_time"]).to eq(42)
      expect(visitor.events.pluck(:action_name)).to eq([ "save" ])
    end

    it "renvoie 422 sans image" do
      post "/api/v1/projects", headers:, params: { project: { title: "Vide" } }
      expect(response).to have_http_status(:unprocessable_entity)
      expect(json["errors"]).to have_key("image")
    end

    it "renvoie 400 si les calques ne sont pas du JSON" do
      post "/api/v1/projects", headers:, params: { project: params[:project].merge(layers: "{oops") }
      expect(response).to have_http_status(:bad_request)
    end

    it "renvoie 400 sans paramètre project" do
      post("/api/v1/projects", headers:)
      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "PATCH /api/v1/projects/:id" do
    it "cumule le temps d'édition" do
      project = create(:project, visitor:, editing_time: 100)
      patch "/api/v1/projects/#{project.id}", headers:, params: { project: { title: "Renommé" }, editing_seconds: 20 }

      expect(response).to have_http_status(:ok)
      expect(json).to include("title" => "Renommé", "editing_time" => 120)
    end
  end

  describe "POST /api/v1/projects/:id/export" do
    it "incrémente le compteur côté serveur" do
      project = create(:project, visitor:, exports_count: 2)
      post("/api/v1/projects/#{project.id}/export", headers:, params: { target: "portrait", file_type: "png" }, as: :json)

      expect(json["exports_count"]).to eq(3)
      expect(project.events.last.metadata).to eq("target" => "portrait", "format" => "png")
    end
  end

  describe "DELETE /api/v1/projects/:id" do
    it "supprime le projet et garde la trace de l'action" do
      project = create(:project, visitor:)

      expect { delete("/api/v1/projects/#{project.id}", headers:) }.to change(Project, :count).by(-1)
      expect(response).to have_http_status(:no_content)
      expect(visitor.events.last).to have_attributes(action_name: "delete", project_id: nil)
    end
  end
end
