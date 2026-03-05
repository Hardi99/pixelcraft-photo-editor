require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "rails/test_unit/railtie"

Bundler.require(*Rails.groups)

module PhotoEditor
  class Application < Rails::Application
    config.load_defaults 7.1
    config.api_only = true
    config.time_zone = "Europe/Paris"
    config.active_storage.variant_processor = :vips
  end
end
