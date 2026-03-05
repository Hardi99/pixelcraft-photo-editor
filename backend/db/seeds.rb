# Sample events to populate the KPI dashboard
actions = %w[upload text filter export text sticker upload text export
             filter text upload export select crop text filter upload]

actions.each_with_index do |action, i|
  Event.create!(
    action_name: action,
    metadata: { source: "seed", index: i }
  )
end

# Sample projects
3.times do |i|
  Project.create!(
    title: "Projet démo #{i + 1}",
    editing_time: rand(60..600),
    exports_count: rand(1..8)
  )
end

puts "Seeded #{Event.count} events and #{Project.count} projects."
