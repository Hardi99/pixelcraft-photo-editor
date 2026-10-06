RSpec.configure do |config|
  config.expect_with(:rspec) { _1.include_chain_clauses_in_custom_matcher_descriptions = true }
  config.mock_with(:rspec) { _1.verify_partial_doubles = true }
  config.shared_context_metadata_behavior = :apply_to_host_groups
  config.disable_monkey_patching!
  config.order = :random
  Kernel.srand config.seed
end
