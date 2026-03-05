class Event < ApplicationRecord
  validates :action_name, presence: true

  TRACKED_ACTIONS = %w[upload text sticker filter crop export save delete].freeze
end
