# Authentification par jeton porteur (Authorization: Bearer <token>).
# Chaque controller qui inclut ce concern ne voit que les données du visiteur courant.
module Authentication
  extend ActiveSupport::Concern
  include ActionController::HttpAuthentication::Token::ControllerMethods

  included do
    before_action :authenticate_visitor!
  end

  class_methods do
    def allow_anonymous(**options)
      skip_before_action :authenticate_visitor!, **options
    end
  end

  private

  attr_reader :current_visitor

  def authenticate_visitor!
    @current_visitor = authenticate_with_http_token { |token, _| Visitor.find_by(token:) }
    render json: { error: "Jeton manquant ou invalide" }, status: :unauthorized unless @current_visitor
  end
end
