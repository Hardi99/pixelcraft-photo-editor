require "rails_helper"

RSpec.describe Stats::Dashboard do
  subject(:stats) { described_class.new.to_h }

  def act(visitor, *actions) = actions.each { create(:event, visitor:, action_name: _1) }

  describe "entonnoir" do
    it "compte des visiteurs distincts, pas des événements" do
      act(create(:visitor), "upload", "text", "text", "text", "sticker")

      expect(stats[:funnel]).to eq(uploaded: 1, edited: 1, exported: 0)
    end

    it "n'inclut à chaque étape que les visiteurs de l'étape précédente" do
      act(create(:visitor), "upload", "text", "export")
      act(create(:visitor), "upload", "filter")
      act(create(:visitor), "upload")
      act(create(:visitor), "text", "export") # n'a jamais uploadé : hors entonnoir

      expect(stats[:funnel]).to eq(uploaded: 3, edited: 2, exported: 1)
    end
  end

  it "agrège l'usage des outils d'édition uniquement" do
    act(create(:visitor), "upload", "text", "text", "filter")

    expect(stats[:tool_usage]).to eq("text" => 2, "filter" => 1)
  end

  it "compte les exports par destination, sans les exports non renseignés" do
    visitor = create(:visitor)
    create(:event, visitor:, action_name: "export", metadata: { "target" => "story" })
    create(:event, visitor:, action_name: "export", metadata: { "target" => "story" })
    create(:event, visitor:, action_name: "export", metadata: { "target" => "post" })
    create(:event, visitor:, action_name: "export")

    expect(stats[:exports_by_target]).to eq("story" => 2, "post" => 1)
  end

  it "calcule les totaux projets" do
    create(:project, editing_time: 100, exports_count: 2)
    create(:project, editing_time: 300, exports_count: 1)

    expect(stats).to include(total_projects: 2, total_exports: 3, avg_editing_time: 200)
  end
end
