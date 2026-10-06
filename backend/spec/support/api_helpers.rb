module ApiHelpers
  def json = response.parsed_body

  def auth_headers(visitor) = { "Authorization" => "Bearer #{visitor.token}" }

  def image_upload(name = "pixel.png", type = "image/png")
    Rack::Test::UploadedFile.new(file_fixture(name), type)
  end
end

RSpec.configure { _1.include ApiHelpers, type: :request }
