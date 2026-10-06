Rails.application.routes.draw do
  get "up", to: "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resources :visitors, only: :create
      resources :projects do
        post :export, on: :member
      end
      resources :events, only: :create
      resource :stats, only: :show
    end
  end
end
