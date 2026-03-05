class ApplicationController < ActionController::API
  include Rails.application.routes.url_helpers

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable

  private

  def not_found
    render json: { error: "Not found" }, status: :not_found
  end

  def unprocessable(error)
    render json: { errors: error.record.errors }, status: :unprocessable_entity
  end
end
