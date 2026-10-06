# Agrège les KPI du tableau de bord. Isolé du controller pour pouvoir être testé
# seul et réutilisé (export CSV, rapport mail...) sans passer par HTTP.
module Stats
  class Dashboard
    RECENT_LIMIT = 20

    def initialize(projects: Project.all, events: Event.all)
      @projects = projects
      @events = events
    end

    def to_h
      {
        total_projects: @projects.count,
        total_exports: @projects.sum(:exports_count),
        total_events: @events.count,
        avg_editing_time: @projects.average(:editing_time).to_i,
        tool_usage: @events.where(action_name: Event::EDIT_ACTIONS).group(:action_name).count,
        funnel:,
        recent_activity:
      }
    end

    private

    # Entonnoir en visiteurs distincts, chaque étape incluse dans la précédente :
    # « édité » = a uploadé PUIS édité. Compter des événements bruts donnait des
    # taux supérieurs à 100 % (on ajoute plusieurs textes par photo).
    def funnel
      uploaded = visitors_who(%w[upload])
      edited = visitors_who(Event::EDIT_ACTIONS).where(visitor_id: uploaded)
      exported = visitors_who(%w[export]).where(visitor_id: edited)

      { uploaded: uploaded.count, edited: edited.count, exported: exported.count }
    end

    def visitors_who(actions)
      @events.where(action_name: actions).where.not(visitor_id: nil).select(:visitor_id).distinct
    end

    def recent_activity
      @events.recent.limit(RECENT_LIMIT).pluck(:action_name, :created_at)
             .map { |action, at| { action:, at: } }
    end
  end
end
