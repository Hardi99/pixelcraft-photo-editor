module Api
  module V1
    class ProjectsController < ApplicationController
      PER_PAGE = 24

      before_action :set_project, only: %i[show update destroy export]

      def index
        page = [ params[:page].to_i, 1 ].max
        projects = current_visitor.projects.with_attached_thumbnail.order(updated_at: :desc)

        render json: {
          projects: projects.offset((page - 1) * PER_PAGE).limit(PER_PAGE).map { ProjectSerializer.new(_1) },
          meta: { page:, per_page: PER_PAGE, total: projects.count }
        }
      end

      def show
        render json: ProjectSerializer.new(@project, detailed: true)
      end

      def create
        project = current_visitor.projects.new(project_params)
        project.editing_time = editing_seconds

        Project.transaction do
          project.save!
          track!(project, "save")
        end
        render json: ProjectSerializer.new(project, detailed: true), status: :created
      end

      def update
        Project.transaction do
          @project.update!(project_params)
          @project.add_editing_time!(editing_seconds)
          track!(@project, "save")
        end
        render json: ProjectSerializer.new(@project.reload, detailed: true)
      end

      def destroy
        track!(@project, "delete")
        @project.destroy!
        head :no_content
      end

      def export
        render json: ProjectSerializer.new(@project.register_export!)
      end

      private

      # find sur l'association : le projet d'un autre visiteur renvoie 404, pas 403,
      # pour ne pas révéler son existence.
      def set_project
        @project = current_visitor.projects.find(params[:id])
      end

      # Requête multipart : les fichiers arrivent tels quels, les champs structurés
      # (calques, réglages) arrivent en JSON sérialisé.
      def project_params
        attrs = params.require(:project).permit(:title, :image, :thumbnail, :layers, :settings)
        %i[layers settings].each { |key| attrs[key] = JSON.parse(attrs[key]) if attrs[key].is_a?(String) }
        attrs
      end

      def editing_seconds
        params[:editing_seconds].to_i.clamp(0, 1.day.to_i)
      end

      def track!(project, action)
        current_visitor.events.create!(project:, action_name: action)
      end
    end
  end
end
