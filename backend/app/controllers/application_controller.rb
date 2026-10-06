class ApplicationController < ActionController::API
  include Authentication

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable
  rescue_from ActionController::ParameterMissing, with: :bad_request
  rescue_from JSON::ParserError, with: :bad_request

  private

  def not_found
    render json: { error: "Introuvable" }, status: :not_found
  end

  def unprocessable(error)
    render json: { errors: error.record.errors }, status: :unprocessable_entity
  end

  def bad_request(error)
    render json: { error: error.message }, status: :bad_request
  end
end
