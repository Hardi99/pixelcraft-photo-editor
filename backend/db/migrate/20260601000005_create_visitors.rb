class CreateVisitors < ActiveRecord::Migration[7.2]
  def change
    create_table :visitors do |t|
      t.string :token, null: false
      t.timestamps
    end
    add_index :visitors, :token, unique: true
  end
end
