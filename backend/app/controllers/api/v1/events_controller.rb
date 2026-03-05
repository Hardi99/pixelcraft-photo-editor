module Api
  module V1
    class EventsController < ApplicationController
      def create
        event = Event.create!(event_params)
        render json: event, status: :created
      end

      private

      def event_params
        params.require(:event).permit(:action_name, metadata: {})
      end
    end
  end
end
