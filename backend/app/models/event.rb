class Event < ApplicationRecord
  # Actions envoyées par l'interface. save / delete sont enregistrées par le
  # serveur lui-même (dans la même transaction que l'écriture en base).
  # export vient des deux côtés : le serveur pour un projet sauvegardé, le
  # client pour une création exportée sans avoir été sauvegardée.
  CLIENT_ACTIONS = %w[upload text sticker filter crop export].freeze
  SERVER_ACTIONS = %w[save delete].freeze
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
