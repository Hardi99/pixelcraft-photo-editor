class Event < ApplicationRecord
  # Actions envoyées par l'interface. save / export / delete sont enregistrées
  # par le serveur lui-même, pour que les KPI ne dépendent pas du client.
  CLIENT_ACTIONS = %w[upload text sticker filter crop].freeze
  SERVER_ACTIONS = %w[save export delete].freeze
  EDIT_ACTIONS = %w[text sticker filter crop].freeze
  MAX_METADATA_SIZE = 1.kilobyte

  belongs_to :visitor, optional: true
  belongs_to :project, optional: true

  validates :action_name, inclusion: { in: CLIENT_ACTIONS + SERVER_ACTIONS, message: "action inconnue" }
  validates :action_name, inclusion: { in: CLIENT_ACTIONS, message: "réservée au serveur" }, on: :client
  validate :metadata_fits_size_limit

  scope :recent, -> { order(created_at: :desc) }

  private

  def metadata_fits_size_limit
    errors.add(:metadata, "trop volumineux") if metadata.to_json.bytesize > MAX_METADATA_SIZE
  end
end
