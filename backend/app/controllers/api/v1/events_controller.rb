module Api
  module V1
    class EventsController < ApplicationController
      def create
        attrs = params.require(:event).permit(:action_name, :project_id, metadata: {})
        project = current_visitor.projects.find_by(id: attrs.delete(:project_id))

        # Contexte :client → refuse save/delete, que seul le serveur enregistre.
        current_visitor.events.new(attrs.merge(project:)).save!(context: :client)
        head :created
      end
    end
  end
end
