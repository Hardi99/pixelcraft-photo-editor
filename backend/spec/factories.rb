FactoryBot.define do
  factory :visitor

  factory :project do
    visitor
    sequence(:title) { "Projet #{_1}" }
    settings { { "aspect_ratio" => "1:1", "filter" => "normal" } }
    image { Rack::Test::UploadedFile.new(Rails.root.join("spec/fixtures/files/pixel.png"), "image/png") }
  end

  factory :event do
    visitor
    action_name { "upload" }
  end
end
