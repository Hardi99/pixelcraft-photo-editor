class AddThumbnailToProjects < ActiveRecord::Migration[7.1]
  def change
    add_column :projects, :thumbnail, :text
  end
end
