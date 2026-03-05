class CreateProjects < ActiveRecord::Migration[7.1]
  def change
    create_table :projects do |t|
      t.string  :title,         null: false
      t.text    :layers_json
      t.integer :editing_time,  default: 0
      t.integer :exports_count, default: 0

      t.timestamps
    end
  end
end
