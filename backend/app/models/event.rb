class Event < ApplicationRecord
  TRACKED_ACTIONS = %w[upload text sticker filter crop export save delete].freeze

  validates :action_name, presence: true,
                          inclusion: { in: TRACKED_ACTIONS, message: "action inconnue" }
end
