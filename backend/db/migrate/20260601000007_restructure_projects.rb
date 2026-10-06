# Les images passent dans ActiveStorage (photo d'origine + miniature) au lieu d'une
# colonne base64, et les calques deviennent du jsonb interrogeable par PostgreSQL.
class RestructureProjects < ActiveRecord::Migration[7.2]
  def up
    remove_column :projects, :thumbnail
    change_column :projects, :layers_json, :jsonb, using: "layers_json::jsonb"
    rename_column :projects, :layers_json, :layers
    change_column_default :projects, :layers, from: nil, to: {}
    add_column :projects, :settings, :jsonb, null: false, default: {}
    change_column_null :projects, :editing_time, false, 0
    change_column_null :projects, :exports_count, false, 0
  end

  def down
    change_column_null :projects, :exports_count, true
    change_column_null :projects, :editing_time, true
    remove_column :projects, :settings
    change_column_default :projects, :layers, from: {}, to: nil
    rename_column :projects, :layers, :layers_json
    change_column :projects, :layers_json, :text
    add_column :projects, :thumbnail, :text
  end
end
