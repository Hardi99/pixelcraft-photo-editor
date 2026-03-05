module Api
  module V1
    class ProjectsController < ApplicationController
      before_action :set_project, only: [:show, :update, :destroy]

      def index
        projects = Project.order(created_at: :desc)
        render json: projects.map { |p| serialize(p) }
      end

      def show
        render json: serialize(@project)
      end

      def create
        project = Project.new(project_params)
        project.image.attach(params[:image]) if params[:image]

        if project.save
          render json: serialize(project), status: :created
        else
          render json: { errors: project.errors }, status: :unprocessable_entity
        end
      end

      def update
        @project.image.attach(params[:image]) if params[:image]

        if @project.update(project_params)
          render json: serialize(@project)
        else
          render json: { errors: @project.errors }, status: :unprocessable_entity
        end
      end

      def destroy
        @project.destroy
        head :no_content
      end

      private

      def set_project
        @project = Project.find(params[:id])
      end

      def project_params
        params.require(:project).permit(:title, :layers_json, :editing_time, :exports_count)
      rescue ActionController::ParameterMissing
        ActionController::Parameters.new.permit!
      end

      def serialize(project)
        project.as_json.merge(
          image_url: project.image.attached? ? url_for(project.image) : nil
        )
      end
    end
  end
end
