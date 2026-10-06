require "rails_helper"

RSpec.describe Project do
  describe "validations" do
    it "est valide avec une image PNG" do
      expect(build(:project)).to be_valid
    end

    it "exige une image" do
      project = build(:project, image: nil)
      expect(project).not_to be_valid
      expect(project.errors[:image]).to be_present
    end

    it "refuse un fichier qui n'est pas une image" do
      project = build(:project, image: Rack::Test::UploadedFile.new(file_fixture("notes.txt"), "text/plain"))
      expect(project).not_to be_valid
      expect(project.errors[:image]).to include("doit être un PNG ou un JPG")
    end

    it "refuse des calques de plus de 1 Mo" do
      project = build(:project, layers: { "objects" => [ "x" * Project::MAX_LAYERS_SIZE ] })
      expect(project).not_to be_valid
      expect(project.errors[:layers]).to be_present
    end

    it "refuse un format inconnu" do
      expect(build(:project, settings: { "aspect_ratio" => "3:2" })).not_to be_valid
    end
  end

  describe "#register_export!" do
    it "incrémente le compteur et enregistre un événement export" do
      project = create(:project)

      expect { project.register_export! }
        .to change { project.reload.exports_count }.by(1)
        .and change { project.events.where(action_name: "export").count }.by(1)
    end
  end

  describe "#register_export! avec destination" do
    it "enregistre la destination et le type de fichier" do
      project = create(:project)
      project.register_export!(target: "story", format: "jpeg")

      expect(project.events.last.metadata).to eq("target" => "story", "format" => "jpeg")
    end

    it "ignore une destination inconnue" do
      project = create(:project)
      project.register_export!(target: "<script>", format: "gif")

      expect(project.events.last.metadata).to eq({})
    end
  end

  describe "#add_editing_time!" do
    it "cumule le temps au lieu de l'écraser" do
      project = create(:project, editing_time: 100)
      project.add_editing_time!(30)
      expect(project.reload.editing_time).to eq(130)
    end

    it "ignore les valeurs négatives" do
      project = create(:project, editing_time: 100)
      project.add_editing_time!(-50)
      expect(project.reload.editing_time).to eq(100)
    end
  end
end
