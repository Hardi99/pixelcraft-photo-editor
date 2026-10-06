module Api
  module V1
    class VisitorsController < ApplicationController
      allow_anonymous only: :create

      def create
        visitor = Visitor.create!
        render json: { token: visitor.token }, status: :created
      end
    end
  end
end
