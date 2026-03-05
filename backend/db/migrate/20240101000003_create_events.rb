class CreateEvents < ActiveRecord::Migration[7.1]
  def change
    create_table :events do |t|
      t.string :action_name, null: false
      t.jsonb  :metadata,    default: {}

      t.timestamps
    end

    add_index :events, :action_name
    add_index :events, :created_at
  end
end
