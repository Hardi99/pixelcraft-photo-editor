module Api
  module V1
    class StatsController < ApplicationController
      allow_anonymous

      def show
        render json: Stats::Dashboard.new.to_h
      end
    end
  end
end
