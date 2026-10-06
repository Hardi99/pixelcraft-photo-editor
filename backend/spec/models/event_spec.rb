require "rails_helper"

RSpec.describe Event do
  it "refuse une action inconnue" do
    expect(build(:event, action_name: "hack")).not_to be_valid
  end

  it "accepte une action serveur dans le contexte par défaut" do
    expect(build(:event, action_name: "save")).to be_valid
  end

  it "refuse une action serveur dans le contexte client" do
    expect(build(:event, action_name: "save").valid?(:client)).to be(false)
  end

  it "limite la taille des métadonnées" do
    expect(build(:event, metadata: { "blob" => "x" * 2.kilobytes })).not_to be_valid
  end
end
