class Project < ApplicationRecord
  validates :title, presence: true
  validates :editing_time, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :exports_count, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
end
