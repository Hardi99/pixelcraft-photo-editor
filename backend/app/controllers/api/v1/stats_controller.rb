module Api
  module V1
    class StatsController < ApplicationController
      def index
        render json: {
          total_projects: Project.count,
          total_exports: Project.sum(:exports_count),
          total_events: Event.count,
          avg_editing_time: Project.average(:editing_time).to_i,
          tool_usage: tool_usage_stats,
          funnel: funnel_stats,
          recent_activity: recent_activity
        }
      end

      private

      def tool_usage_stats
        Event.where(action_name: %w[text sticker select crop filter])
             .group(:action_name)
             .count
      end

      def funnel_stats
        {
          uploaded: Event.where(action_name: "upload").count,
          edited: Event.where(action_name: %w[text filter sticker crop]).count,
          exported: Event.where(action_name: "export").count
        }
      end

      def recent_activity
        Event.order(created_at: :desc)
             .limit(20)
             .pluck(:action_name, :created_at)
             .map { |name, at| { action: name, at: at } }
      end
    end
  end
end
