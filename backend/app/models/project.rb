class Project < ApplicationRecord
  IMAGE_TYPES = %w[image/png image/jpeg].freeze
  MAX_IMAGE_SIZE = 10.megabytes
  MAX_LAYERS_SIZE = 1.megabyte
  ASPECT_RATIOS = %w[1:1 4:5 3:4 9:16 16:9].freeze
  EXPORT_TARGETS = %w[post portrait tall story landscape].freeze
  EXPORT_FORMATS = %w[jpeg png].freeze

  belongs_to :visitor
  has_many :events, dependent: :nullify

  # La photo d'origine est conservée telle quelle : le texte et les stickers vivent
  # dans `layers`, donc rouvrir un projet ne dégrade jamais l'image.
  has_one_attached :image
  has_one_attached :thumbnail

  validates :title, presence: true, length: { maximum: 120 }
  validates :editing_time, :exports_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :aspect_ratio, inclusion: { in: ASPECT_RATIOS }, allow_nil: true
  validate :image_is_present_and_valid
  validate :thumbnail_is_valid
  validate :layers_fit_size_limit

  def aspect_ratio = settings.to_h.stringify_keys["aspect_ratio"]

  # Incréments atomiques en SQL (UPDATE ... SET x = x + n) : deux requêtes
  # simultanées ne peuvent pas s'écraser comme avec un read-modify-write côté client.
  def add_editing_time!(seconds)
    seconds = seconds.to_i.clamp(0, 1.day.to_i)
    self.class.update_counters(id, editing_time: seconds) if seconds.positive?
  end

  # Destination et type de fichier alimentent la statistique « exports par destination » ;
  # une valeur inconnue est ignorée plutôt que stockée telle quelle.
  def register_export!(target: nil, format: nil)
    metadata = { target: target.presence_in(EXPORT_TARGETS), format: format.presence_in(EXPORT_FORMATS) }.compact
    transaction do
      self.class.update_counters(id, exports_count: 1)
      events.create!(visitor:, action_name: "export", metadata:)
    end
    reload
  end

  private

  def image_is_present_and_valid
    return errors.add(:image, :blank) unless image.attached?

    validate_attachment(:image, image)
  end

  def thumbnail_is_valid
    validate_attachment(:thumbnail, thumbnail) if thumbnail.attached?
  end

  def validate_attachment(name, attachment)
    errors.add(name, "doit être un PNG ou un JPG") unless attachment.blob.content_type.in?(IMAGE_TYPES)
    errors.add(name, "dépasse 10 Mo") if attachment.blob.byte_size > MAX_IMAGE_SIZE
  end

  def layers_fit_size_limit
    errors.add(:layers, "dépasse 1 Mo") if layers.to_json.bytesize > MAX_LAYERS_SIZE
  end
end
