Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :projects
      resources :events, only: [:create]
      get "stats", to: "stats#index"
    end
  end
end
