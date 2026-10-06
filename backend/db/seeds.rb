# Données de démo pour le tableau de bord : 10 visiteurs simulent un parcours
# réaliste (tous uploadent, 7 éditent, 4 exportent). Idempotent.
if Event.exists?
  puts "Seeds déjà présents, rien à faire."
else
  image_path = Rails.root.join("db/seeds/rocket.jpg")

  10.times do |i|
    visitor = Visitor.create!
    visitor.events.create!(action_name: "upload")
    next if i >= 7

    Event::EDIT_ACTIONS.sample(rand(1..3)).each { visitor.events.create!(action_name: _1) }
    next if i >= 4

    project = visitor.projects.create!(
      title: "Projet démo #{i + 1}",
      editing_time: rand(60..600),
      settings: { aspect_ratio: "1:1", filter: "normal" },
      image: { io: File.open(image_path), filename: "rocket.jpg", content_type: "image/jpeg" }
    )
    visitor.events.create!(project:, action_name: "save")
    project.register_export!
  end

  puts "Seeded #{Visitor.count} visiteurs, #{Event.count} événements, #{Project.count} projets."
end
