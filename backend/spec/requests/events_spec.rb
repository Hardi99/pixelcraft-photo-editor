require "rails_helper"

RSpec.describe "Events API" do
  let(:visitor) { create(:visitor) }
  let(:headers) { auth_headers(visitor) }

  it "enregistre une action d'interface rattachée au visiteur" do
    post "/api/v1/events", headers:, params: { event: { action_name: "text" } }

    expect(response).to have_http_status(:created)
    expect(visitor.events.pluck(:action_name)).to eq([ "text" ])
  end

  it "refuse qu'un client déclare lui-même une sauvegarde" do
    post "/api/v1/events", headers:, params: { event: { action_name: "save" } }
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it "ignore un project_id qui appartient à un autre visiteur" do
    foreign = create(:project)
    post "/api/v1/events", headers:, params: { event: { action_name: "text", project_id: foreign.id } }

    expect(visitor.events.last.project).to be_nil
  end

  it "exige un jeton" do
    post "/api/v1/events", params: { event: { action_name: "text" } }
    expect(response).to have_http_status(:unauthorized)
  end
end
