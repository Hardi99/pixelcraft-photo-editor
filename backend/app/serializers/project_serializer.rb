# Contrat JSON explicite : la liste reste légère (pas de calques), le détail
# ajoute les calques. Les URLs pointent vers ActiveStorage, pas vers du base64.
class ProjectSerializer
  include Rails.application.routes.url_helpers

  def initialize(project, detailed: false)
    @project = project
    @detailed = detailed
  end

  def as_json(*)
    json = @project.slice(:id, :title, :editing_time, :exports_count, :settings, :created_at, :updated_at)
    json[:image_url] = blob_path(@project.image)
    json[:thumbnail_url] = blob_path(@project.thumbnail)
    json[:layers] = @project.layers if @detailed
    json
  end

  private

  def blob_path(attachment)
    rails_blob_path(attachment, only_path: true) if attachment.attached?
  end
end
