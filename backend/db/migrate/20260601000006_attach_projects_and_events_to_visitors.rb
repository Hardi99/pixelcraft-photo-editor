# Les projets créés avant l'introduction des visiteurs n'ont pas de propriétaire :
# on les rattache à un visiteur "legacy" pour pouvoir rendre la colonne obligatoire.
class AttachProjectsAndEventsToVisitors < ActiveRecord::Migration[7.2]
  def up
    add_reference :projects, :visitor, foreign_key: true
    add_reference :events, :visitor, foreign_key: true
    add_reference :events, :project, foreign_key: { on_delete: :nullify }
    add_index :events, %i[action_name visitor_id]

    if select_value("SELECT 1 FROM projects LIMIT 1")
      legacy_id = select_value(<<~SQL.squish)
        INSERT INTO visitors (token, created_at, updated_at)
        VALUES (md5(random()::text), now(), now()) RETURNING id
      SQL
      execute "UPDATE projects SET visitor_id = #{Integer(legacy_id)}"
    end
    change_column_null :projects, :visitor_id, false
  end

  def down
    remove_index :events, %i[action_name visitor_id]
    remove_reference :events, :project
    remove_reference :events, :visitor
    remove_reference :projects, :visitor
  end
end
